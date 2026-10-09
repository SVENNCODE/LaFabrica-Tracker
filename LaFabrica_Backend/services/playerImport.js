"use strict";
const { parse } = require("csv-parse");
const { Readable } = require("stream");

const MAX_ROWS = 5000;
const CLEAR_TOKEN = "<clear>";
const IDENTITY_INDEX = "players_identity_key";
const POSITIONS = [
  "GK",
  "CB",
  "RB",
  "LB",
  "CDM",
  "CM",
  "CAM",
  "RM",
  "LM",
  "RW",
  "LW",
  "CF",
  "ST",
];
const FEET = { left: "Left", right: "Right", both: "Both" };

class ImportError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "ImportError";
    this.status = status;
  }
}

const text = (max) => (v) =>
  v.length > max
    ? { error: `must be at most ${max} characters` }
    : { value: v };

const whole = (min, max) => (v) => {
  if (!/^\d+$/.test(v)) return { error: "must be a whole number" };
  const n = Number(v);
  if (n < min || n > max) return { error: `must be between ${min} and ${max}` };
  return { value: n };
};

function parseDate(v) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return { error: "use the format YYYY-MM-DD" };
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== mo - 1 ||
    dt.getUTCDate() !== d
  ) {
    return { error: "is not a real calendar date" };
  }
  if (y < 1980) return { error: "is before 1980" };
  if (dt.getTime() > Date.now()) return { error: "is in the future" };
  return { value: v };
}

function parsePosition(v) {
  const up = v.toUpperCase();
  return POSITIONS.includes(up)
    ? { value: up }
    : { error: `must be one of ${POSITIONS.join(", ")}` };
}

function parseFoot(v) {
  const f = FEET[v.toLowerCase()];
  return f ? { value: f } : { error: "must be Left, Right or Both" };
}
const FIELDS = [
  { name: "firstName", col: '"firstName"', required: true, parse: text(255) },
  { name: "lastName", col: '"lastName"', required: true, parse: text(255) },
  {
    name: "dateofBirth",
    col: '"dateofBirth"',
    required: true,
    parse: parseDate,
  },
  { name: "nationality", col: "nationality", parse: text(255) },
  { name: "position", col: '"position"', parse: parsePosition },
  { name: "currentTeam", col: '"currentTeam"', parse: text(255) },
  { name: "Height", col: '"Height"', parse: whole(100, 230) },
  { name: "preferredFoot", col: '"preferredFoot"', parse: parseFoot },
  { name: "goals", col: "goals", parse: whole(0, 999) },
  { name: "assists", col: "assists", parse: whole(0, 999) },
  { name: "minutesPlayed", col: '"minutesPlayed"', parse: whole(0, 20000) },
];
const FIELD_BY_NAME = Object.fromEntries(FIELDS.map((f) => [f.name, f]));

const normHeader = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const HEADER_ALIASES = {
  firstname: "firstName",
  lastname: "lastName",
  dateofbirth: "dateofBirth",
  dob: "dateofBirth",
  birthdate: "dateofBirth",
  nationality: "nationality",
  position: "position",
  currentteam: "currentTeam",
  team: "currentTeam",
  height: "Height",
  heightcm: "Height",
  preferredfoot: "preferredFoot",
  foot: "preferredFoot",
  goals: "goals",
  assists: "assists",
  minutesplayed: "minutesPlayed",
  minutes: "minutesPlayed",
};

function decode(buffer) {
  if (buffer.length === 0) throw new ImportError("The file is empty.");
  if (buffer.includes(0)) {
    throw new ImportError(
      "This does not look like a text CSV file (is it an Excel .xlsx renamed to .csv?).",
    );
  }
  try {
    return {
      text: new TextDecoder("utf-8", { fatal: true }).decode(buffer),
      encoding: "utf-8",
    };
  } catch {
    return {
      text: new TextDecoder("windows-1252").decode(buffer),
      encoding: "windows-1252",
    };
  }
}

function sniffDelimiter(textContent) {
  const firstLine =
    textContent.split(/\r?\n/).find((l) => l.trim() !== "") || "";
  const counts = { ",": 0, ";": 0, "\t": 0 };
  for (const ch of firstLine) if (ch in counts) counts[ch]++;
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : ",";
}

async function readRecords(textContent, delimiter) {
  const parser = Readable.from([textContent]).pipe(
    parse({
      delimiter,
      bom: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
      info: true,
    }),
  );
  const records = [];
  try {
    for await (const { record, info } of parser) {
      records.push({ line: info.lines, cells: record });
      if (records.length > MAX_ROWS + 1) {
        throw new ImportError(
          `Too many rows: the limit is ${MAX_ROWS} players per file.`,
          413,
        );
      }
    }
  } catch (err) {
    if (err instanceof ImportError) throw err;
    throw new ImportError(`The CSV could not be read: ${err.message}`);
  }
  return records;
}

function mapHeader(headerCells) {
  const indexByField = {};
  const ignoredColumns = [];
  headerCells.forEach((raw, i) => {
    const field = HEADER_ALIASES[normHeader(raw)];
    if (!field) {
      if (raw !== "") ignoredColumns.push(raw);
    } else if (field in indexByField) {
      throw new ImportError(
        `The column "${field}" appears more than once in the header.`,
      );
    } else {
      indexByField[field] = i;
    }
  });
  const missing = FIELDS.filter(
    (f) => f.required && !(f.name in indexByField),
  ).map((f) => f.name);
  if (missing.length) {
    throw new ImportError(
      `Missing required column(s): ${missing.join(", ")}. First row must be a header.`,
    );
  }
  return { indexByField, ignoredColumns };
}

function validateRow(cells, indexByField, headerLength, line) {
  const errors = [];
  const values = {};
  if (cells.length > headerLength) {
    errors.push({
      row: line,
      field: null,
      message: `has ${cells.length} columns but the header has ${headerLength}`,
    });
    return { values, errors };
  }
  for (const field of FIELDS) {
    if (!(field.name in indexByField)) continue;
    const raw = (cells[indexByField[field.name]] ?? "").trim();
    if (raw === "") {
      if (field.required)
        errors.push({ row: line, field: field.name, message: "is required" });
      continue;
    }
    if (raw.toLowerCase() === CLEAR_TOKEN) {
      if (field.required)
        errors.push({
          row: line,
          field: field.name,
          message: "cannot be cleared",
        });
      else values[field.name] = null;
      continue;
    }
    const result = field.parse(raw);
    if (result.error)
      errors.push({ row: line, field: field.name, message: result.error });
    else values[field.name] = result.value;
  }
  return { values, errors };
}

const identityKey = (v) =>
  `${v.firstName.toLowerCase()}|${v.lastName.toLowerCase()}|${v.dateofBirth}`;

async function assertMigrated(db) {
  const { rowCount } = await db.query(
    `SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND tablename = 'players' AND indexname = $1`,
    [IDENTITY_INDEX],
  );
  if (!rowCount) {
    throw new ImportError(
      'The database is not ready for imports. Run "npm run migrate" in LaFabrica_Backend first.',
      500,
    );
  }
}

async function planEntries(db, entries) {
  if (!entries.length) return;
  const selectCols = FIELDS.map((f) =>
    f.name === "dateofBirth"
      ? `p.${f.col}::text AS "dateofBirth"`
      : `p.${f.col} AS "${f.name}"`,
  );
  const { rows } = await db.query(
    `SELECT t.ord::int AS ord, p.id, ${selectCols.join(", ")}
       FROM unnest($1::text[], $2::text[], $3::date[]) WITH ORDINALITY AS t(f, l, d, ord)
       JOIN players p
         ON lower(p."firstName") = lower(t.f)
        AND lower(p."lastName")  = lower(t.l)
        AND p."dateofBirth"      = t.d`,
    [
      entries.map((e) => e.values.firstName),
      entries.map((e) => e.values.lastName),
      entries.map((e) => e.values.dateofBirth),
    ],
  );
  const matches = new Map();
  for (const r of rows) {
    if (!matches.has(r.ord)) matches.set(r.ord, []);
    matches.get(r.ord).push(r);
  }
  const claimed = new Map();
  entries.forEach((entry, i) => {
    const found = matches.get(i + 1) || [];
    if (found.length > 1) {
      entry.status = "invalid";
      entry.error = {
        row: entry.line,
        field: null,
        message: `matches ${found.length} existing players; fix the duplicates in the database first`,
      };
      return;
    }
    if (found.length === 0) {
      entry.status = "insert";
      return;
    }
    const existing = found[0];
    if (claimed.has(existing.id)) {
      entry.status = "invalid";
      entry.error = {
        row: entry.line,
        field: null,
        message: `is the same player as row ${claimed.get(existing.id)}`,
      };
      return;
    }
    claimed.set(existing.id, entry.line);
    entry.playerId = existing.id;
    entry.changes = [];
    for (const field of FIELDS) {
      if (!(field.name in entry.values)) continue;
      const before = existing[field.name] ?? null;
      const after = entry.values[field.name];
      if (before !== after)
        entry.changes.push({ field: field.name, from: before, to: after });
    }
    entry.status = entry.changes.length ? "update" : "unchanged";
  });
}

async function applyEntries(client, entries) {
  for (const entry of entries) {
    if (entry.status === "insert") {
      const fields = FIELDS.filter((f) => f.name in entry.values);
      const sql = `INSERT INTO players (${fields.map((f) => f.col).join(", ")}) VALUES (${fields.map((_, i) => `$${i + 1}`).join(", ")})`;
      await client.query(
        sql,
        fields.map((f) => entry.values[f.name]),
      );
    } else if (entry.status === "update") {
      const sets = entry.changes.map(
        (c, i) => `${FIELD_BY_NAME[c.field].col} = $${i + 1}`,
      );
      await client.query(
        `UPDATE players SET ${sets.join(", ")}, updated_at = now() WHERE id = $${entry.changes.length + 1}`,
        [...entry.changes.map((c) => c.to), entry.playerId],
      );
    }
  }
}

async function runImport(pool, buffer, { dryRun = true } = {}) {
  const { text: content, encoding } = decode(buffer);
  const delimiter = sniffDelimiter(content);
  const records = await readRecords(content, delimiter);
  if (records.length === 0) throw new ImportError("The file is empty.");
  if (records.length === 1)
    throw new ImportError("The file has a header row but no players.");

  const [header, ...dataRecords] = records;
  const { indexByField, ignoredColumns } = mapHeader(header.cells);
  const headerLength = header.cells.length;

  const errors = [];
  const entries = [];
  const seen = new Map();
  for (const rec of dataRecords) {
    const { values, errors: rowErrors } = validateRow(
      rec.cells,
      indexByField,
      headerLength,
      rec.line,
    );
    if (rowErrors.length) {
      errors.push(...rowErrors);
      entries.push({ line: rec.line, status: "invalid", values });
      continue;
    }
    const key = identityKey(values);
    if (seen.has(key)) {
      errors.push({
        row: rec.line,
        field: null,
        message: `is the same player as row ${seen.get(key)} in this file`,
      });
      entries.push({ line: rec.line, status: "invalid", values });
      continue;
    }
    seen.set(key, rec.line);
    entries.push({ line: rec.line, values });
  }

  const valid = entries.filter((e) => e.status !== "invalid");
  const finish = (applied) => {
    for (const e of entries) if (e.error) errors.push(e.error);
    errors.sort((a, b) => a.row - b.row);
    const count = (s) => entries.filter((e) => e.status === s).length;
    return {
      dryRun,
      applied,
      encoding,
      delimiter: delimiter === "\t" ? "tab" : delimiter,
      ignoredColumns,
      summary: {
        insert: count("insert"),
        update: count("update"),
        unchanged: count("unchanged"),
        invalid: count("invalid"),
      },
      errors,
      rows: entries.map((e) => ({
        row: e.line,
        status: e.status,
        name: e.values.firstName
          ? `${e.values.firstName} ${e.values.lastName}`
          : null,
        changes: e.status === "update" ? e.changes : undefined,
      })),
    };
  };

  if (dryRun || errors.length) {
    await assertMigrated(pool);
    await planEntries(pool, valid);
    return finish(false);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await assertMigrated(client);
    await client.query("LOCK TABLE players IN SHARE ROW EXCLUSIVE MODE");
    await planEntries(client, valid);
    if (entries.some((e) => e.status === "invalid")) {
      await client.query("ROLLBACK");
      return finish(false);
    }
    await applyEntries(client, valid);
    await client.query("COMMIT");
    return finish(true);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { runImport, ImportError, MAX_ROWS, CLEAR_TOKEN, POSITIONS };
