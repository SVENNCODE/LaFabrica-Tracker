// Integration tests for the CSV importer. They run against a REAL Postgres database and
// wipe the players table, so they refuse to run unless DB_NAME ends in "_test".
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");

require("./testGuard").assertTestDatabase();

process.env.ADMIN_API_KEY = "test-key";
const pool = require("../database");
const adminRoutes = require("../routes/admin");

let server;
let base;

before(async () => {
  const app = express();
  app.use("/api/admin", adminRoutes);
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}/api/admin/players/import`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

const HEADER =
  "firstName,lastName,dateofBirth,nationality,position,currentTeam,Height,preferredFoot,goals,assists,minutesPlayed";

beforeEach(async () => {
  await pool.query("DROP TABLE IF EXISTS _guard");
  await pool.query("ALTER TABLE players DROP CONSTRAINT IF EXISTS no_77_goals");
  await pool.query("TRUNCATE players RESTART IDENTITY CASCADE");
  await pool.query(
    `INSERT INTO players ("firstName","lastName","dateofBirth",nationality,"position","currentTeam","Height","preferredFoot",goals,assists,"minutesPlayed")
     VALUES ('Ana','Test','2007-01-01','Spain','CM','U-19',178,'Right',2,1,900),
            ('Beto','Test','2006-02-02','Spain','GK','Castilla',NULL,NULL,NULL,NULL,NULL)`,
  );
});

async function post(
  csv,
  { dryRun, key = "test-key", filename = "players.csv" } = {},
) {
  const form = new FormData();
  form.append("file", new Blob([csv]), filename);
  const qs = dryRun === undefined ? "" : `?dryRun=${dryRun}`;
  const headers = key === null ? {} : { "x-admin-key": key };
  const res = await fetch(base + qs, { method: "POST", body: form, headers });
  return { status: res.status, body: await res.json() };
}

const row = async (first) =>
  (await pool.query('SELECT * FROM players WHERE "firstName" = $1', [first]))
    .rows[0];
const count = async () =>
  Number((await pool.query("SELECT count(*) FROM players")).rows[0].count);

test("rejects a missing or wrong admin key, and is disabled when no key is configured", async () => {
  assert.equal((await post(`${HEADER}\n`, { key: null })).status, 401);
  assert.equal((await post(`${HEADER}\n`, { key: "nope" })).status, 401);
  const saved = process.env.ADMIN_API_KEY;
  delete process.env.ADMIN_API_KEY;
  try {
    assert.equal((await post(`${HEADER}\n`)).status, 503);
  } finally {
    process.env.ADMIN_API_KEY = saved;
  }
});

test("dry run is the default, reports the plan and writes nothing", async () => {
  const csv = [
    HEADER,
    "Ana,Test,2007-01-01,,,,,,5,,", // update goals 2 -> 5
    "Carlos,New,2008-03-03,Spain,CB,U-19,185,Left,0,0,0", // insert
    "Beto,Test,2006-02-02,,,,,,,,", // nothing provided -> unchanged
  ].join("\n");
  const { status, body } = await post(csv);
  assert.equal(status, 200);
  assert.equal(body.dryRun, true);
  assert.equal(body.applied, false);
  assert.deepEqual(body.summary, {
    insert: 1,
    update: 1,
    unchanged: 1,
    invalid: 0,
  });
  assert.deepEqual(body.rows.find((r) => r.name === "Ana Test").changes, [
    { field: "goals", from: 2, to: 5 },
  ]);
  assert.equal(await count(), 2);
  assert.equal((await row("Ana")).goals, 2);
});

test("real import inserts and updates; blank keeps, <clear> nulls, missing column is untouched", async () => {
  const csv = [
    "firstName,lastName,dateofBirth,position,Height,goals,assists",
    "Ana,Test,2007-01-01,,<clear>,,7",
    "Carlos,New,2008-03-03,cb,185,,",
  ].join("\n");
  const { status, body } = await post(csv, { dryRun: false });
  assert.equal(status, 200);
  assert.equal(body.applied, true);
  assert.deepEqual(body.summary, {
    insert: 1,
    update: 1,
    unchanged: 0,
    invalid: 0,
  });

  const ana = await row("Ana");
  assert.equal(ana.position, "CM"); // blank cell -> kept
  assert.equal(ana.Height, null); // <clear> -> NULL
  assert.equal(ana.goals, 2); // blank cell -> kept
  assert.equal(ana.assists, 7); // value -> set
  assert.equal(ana.minutesPlayed, 900); // column absent -> untouched
  assert.equal(ana.preferredFoot, "Right"); // column absent -> untouched

  const carlos = await row("Carlos");
  assert.equal(carlos.position, "CB");
  assert.equal(carlos.Height, 185);
  assert.equal(carlos.goals, null);
});

test("re-importing the same file is idempotent", async () => {
  const csv = [
    HEADER,
    "Carlos,New,2008-03-03,Spain,CB,U-19,185,Left,0,0,0",
  ].join("\n");
  assert.equal((await post(csv, { dryRun: false })).body.summary.insert, 1);
  const again = await post(csv, { dryRun: false });
  assert.deepEqual(again.body.summary, {
    insert: 0,
    update: 0,
    unchanged: 1,
    invalid: 0,
  });
  assert.equal(await count(), 3);
});

test("matching is case-insensitive on the name and never duplicates", async () => {
  const csv = [HEADER, "ANA,test,2007-01-01,,,,,,9,,"].join("\n");
  const { body } = await post(csv, { dryRun: false });
  assert.equal(body.summary.update, 1);
  assert.equal(await count(), 2);
  assert.equal((await row("ANA")).goals, 9); // casing from the file is applied too
});

test("reports row-level validation errors with row numbers and writes nothing", async () => {
  const csv = [
    HEADER, // line 1
    "Good,Player,2008-01-01,Spain,CM,U-19,180,Left,1,1,100", // line 2 (valid)
    "Bad,Date,2008-02-30,Spain,CM,U-19,,,,,", // line 3: impossible date
    "Bad,Pos,2008-01-01,Spain,XX,U-19,,,,,", // line 4: unknown position
    "Bad,Num,2008-01-01,Spain,CM,U-19,tall,,-3,,", // line 5: height + goals
    "Bad,Foot,2008-01-01,Spain,CM,U-19,,Mixed,,,", // line 6
    ",NoFirst,2008-01-01,,,,,,,,", // line 7: required
    "Good,Player,2008-01-01,Spain,CM,U-19,180,Left,1,1,100", // line 8: duplicate of line 2
  ].join("\n");
  const { status, body } = await post(csv, { dryRun: false });
  assert.equal(status, 422);
  assert.equal(body.applied, false);
  const where = body.errors.map((e) => `${e.row}:${e.field}`);
  assert.deepEqual(where, [
    "3:dateofBirth",
    "4:position",
    "5:Height",
    "5:goals",
    "6:preferredFoot",
    "7:firstName",
    "8:null",
  ]);
  assert.equal(await count(), 2); // all-or-nothing: the one valid row was not written
});

test("rejects a file with no header columns we recognise for the key", async () => {
  const { status, body } = await post("name,age\nAna,17\n");
  assert.equal(status, 400);
  assert.match(body.error, /Missing required column/);
});

test("reports unknown columns as ignored instead of failing", async () => {
  const csv =
    "firstName,lastName,dateofBirth,agent\nAna,Test,2007-01-01,Someone\n";
  const { status, body } = await post(csv);
  assert.equal(status, 200);
  assert.deepEqual(body.ignoredColumns, ["agent"]);
  assert.equal(body.summary.unchanged, 1);
});

test("accepts friendly header aliases", async () => {
  const csv =
    "First Name,Last Name,DOB,Team,Foot\nAna,Test,2007-01-01,Castilla,Both\n";
  const { body } = await post(csv, { dryRun: false });
  assert.equal(body.summary.update, 1);
  const ana = await row("Ana");
  assert.equal(ana.currentTeam, "Castilla");
  assert.equal(ana.preferredFoot, "Both");
});

test("rejects empty, header-only, wrong-extension and binary files", async () => {
  assert.equal((await post("")).status, 400);
  assert.equal((await post(`${HEADER}\n`)).status, 400);
  assert.equal(
    (await post(`${HEADER}\n`, { filename: "players.xlsx" })).status,
    400,
  );
  const binary = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00]);
  const res = await post(binary);
  assert.equal(res.status, 400);
  assert.match(res.body.error, /does not look like a text CSV/);
});

test("rejects uploads over 1 MB with 413", async () => {
  const big = HEADER + "\n" + "x".repeat(1024 * 1024 + 10);
  assert.equal((await post(big)).status, 413);
});

test("rejects more than 5000 rows with 413", async () => {
  const lines = [HEADER];
  for (let i = 0; i < 5001; i++) lines.push(`P${i},Row,2008-01-01,,,,,,,,`);
  const { status, body } = await post(lines.join("\n"));
  assert.equal(status, 413);
  assert.match(body.error, /Too many rows/);
});

test("handles a semicolon-delimited, Windows-1252 file exported by Spanish Excel", async () => {
  const csv =
    "firstName;lastName;dateofBirth;position\nÁlvaro;Muñoz;2008-03-02;CB\n";
  const { status, body } = await post(Buffer.from(csv, "latin1"), {
    dryRun: false,
  });
  assert.equal(status, 200);
  assert.equal(body.encoding, "windows-1252");
  assert.equal(body.delimiter, ";");
  assert.equal(body.summary.insert, 1);
  assert.equal((await row("Álvaro")).lastName, "Muñoz");
});

test("handles a UTF-8 file with a BOM and quoted fields containing commas", async () => {
  const csv =
    '﻿firstName,lastName,dateofBirth,currentTeam\n"Luis","de la Fuente, Jr",2008-05-05,"Castilla, B"\n';
  const { body } = await post(csv, { dryRun: false });
  assert.equal(body.encoding, "utf-8");
  assert.equal(body.summary.insert, 1);
  assert.equal((await row("Luis")).currentTeam, "Castilla, B");
});

test("a database failure part-way through rolls the whole import back", async () => {
  await pool.query(
    "ALTER TABLE players ADD CONSTRAINT no_77_goals CHECK (goals IS DISTINCT FROM 77)",
  );
  const csv = [
    HEADER,
    "First,Ok,2008-01-01,Spain,CM,U-19,180,Left,1,1,100",
    "Second,Boom,2008-01-02,Spain,CM,U-19,180,Left,77,1,100", // passes validation, DB refuses it
  ].join("\n");
  const { status } = await post(csv, { dryRun: false });
  assert.equal(status, 500);
  assert.equal(await count(), 2); // "First Ok" was rolled back too
});
