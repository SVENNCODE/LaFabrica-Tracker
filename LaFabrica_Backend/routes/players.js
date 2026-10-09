// Public player routes (read-only) plus the AI scout report.
const express = require("express");
const rateLimit = require("express-rate-limit");
const pool = require("../database");
const {
  ScoutReportError,
  PER90_MIN_MINUTES,
  getCachedReport,
  createReport,
} = require("../services/scoutReport");

const router = express.Router();

// ---- shared SQL --------------------------------------------------------------------------

// Dates leave the database as plain 'YYYY-MM-DD' text (not a JS Date), so they cannot shift by a
// day with the server's or browser's time zone. Age is calculated once, here, by PostgreSQL.
const LIST_COLUMNS = `
  id, "firstName", "lastName",
  to_char("dateofBirth", 'YYYY-MM-DD') AS "dateofBirth",
  date_part('year', age(current_date, "dateofBirth"))::int AS age,
  nationality, "position", "currentTeam", goals, assists, "minutesPlayed"`;

// PER90_MIN_MINUTES is a constant number, never user input.
const PROFILE_COLUMNS = `
  id, "firstName", "lastName",
  to_char("dateofBirth", 'YYYY-MM-DD') AS "dateofBirth",
  date_part('year', age(current_date, "dateofBirth"))::int AS age,
  nationality, "position", "currentTeam",
  "Height", "preferredFoot", goals, assists, "minutesPlayed",
  CASE WHEN goals IS NOT NULL AND "minutesPlayed" > ${PER90_MIN_MINUTES}
       THEN round(goals * 90.0 / "minutesPlayed", 2)::float8 END AS "goalsPer90",
  CASE WHEN assists IS NOT NULL AND "minutesPlayed" > ${PER90_MIN_MINUTES}
       THEN round(assists * 90.0 / "minutesPlayed", 2)::float8 END AS "assistsPer90"`;

const POSITION_GROUPS = {
  GK: ["GK"],
  DEF: ["CB", "RB", "LB"],
  MID: ["CDM", "CM", "CAM", "RM", "LM"],
  FWD: ["RW", "LW", "CF", "ST"],
};
const ALL_POSITIONS = Object.values(POSITION_GROUPS).flat();

const SORTS = {
  name_asc: '"lastName" ASC, "firstName" ASC',
  name_desc: '"lastName" DESC, "firstName" DESC',
  age_asc: '"dateofBirth" DESC', // youngest first
  age_desc: '"dateofBirth" ASC', // oldest first
  goals_desc: "goals DESC NULLS LAST",
  assists_desc: "assists DESC NULLS LAST",
  minutes_desc: '"minutesPlayed" DESC NULLS LAST',
};

class BadRequest extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

const singleString = (value, name) => {
  if (value === undefined) return undefined;
  if (typeof value !== "string")
    throw new BadRequest(`"${name}" must be given once`);
  return value.trim();
};

function parsePositions(value) {
  const raw = [].concat(value).join(",");
  const out = new Set();
  for (const part of raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)) {
    if (POSITION_GROUPS[part]) POSITION_GROUPS[part].forEach((p) => out.add(p));
    else if (ALL_POSITIONS.includes(part)) out.add(part);
    else {
      throw new BadRequest(
        `Unknown position "${part.slice(0, 20)}". Use a group (${Object.keys(POSITION_GROUPS).join(", ")}) or a code (${ALL_POSITIONS.join(", ")}).`,
      );
    }
  }
  return [...out];
}

function parseId(raw) {
  if (!/^\d{1,10}$/.test(raw)) return null;
  const n = Number(raw);
  return n >= 1 && n <= 2147483647 ? n : null;
}

router.param("id", (req, res, next, raw) => {
  const id = parseId(raw);
  if (id === null) return res.status(400).json({ error: "Invalid player id" });
  req.playerId = id;
  next();
});

router.get("/", async (req, res) => {
  const where = [];
  const params = [];
  const positions =
    req.query.position === undefined ? [] : parsePositions(req.query.position);
  if (positions.length) {
    params.push(positions);
    where.push(`"position" = ANY($${params.length}::text[])`);
  }
  const team = singleString(req.query.team, "team");
  if (team) {
    if (team.length > 255) throw new BadRequest('"team" is too long');
    params.push(team);
    where.push(`lower("currentTeam") = lower($${params.length})`);
  }
  const sortKey = singleString(req.query.sort, "sort") || "name_asc";
  if (!Object.hasOwn(SORTS, sortKey)) {
    throw new BadRequest(
      `Unknown sort "${sortKey.slice(0, 30)}". Use one of: ${Object.keys(SORTS).join(", ")}.`,
    );
  }
  const result = await pool.query(
    `SELECT ${LIST_COLUMNS}
       FROM players
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY ${SORTS[sortKey]}, "lastName", "firstName", id`,
    params,
  );
  res.json(result.rows);
});

router.get("/filters", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT DISTINCT "currentTeam" FROM players WHERE "currentTeam" IS NOT NULL ORDER BY "currentTeam"`,
  );
  res.json({
    teams: rows.map((r) => r.currentTeam),
    positionGroups: POSITION_GROUPS,
  });
});

router.get("/search", async (req, res) => {
  const query = singleString(req.query.query, "query");
  if (!query) return res.json([]);
  if (query.length > 100) throw new BadRequest("Search text is too long");
  const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
  const result = await pool.query(
    `SELECT id, "firstName", "lastName", "position", "currentTeam", nationality
       FROM players
      WHERE "firstName" ILIKE $1
         OR "lastName" ILIKE $1
         OR CONCAT("firstName", ' ', "lastName") ILIKE $1
      ORDER BY "lastName", "firstName"
      LIMIT 20`,
    [pattern],
  );
  res.json(result.rows);
});

async function loadPlayer(req, res, next) {
  const { rows } = await pool.query(
    `SELECT ${PROFILE_COLUMNS} FROM players WHERE id = $1`,
    [req.playerId],
  );
  if (rows.length === 0)
    return res.status(404).json({ error: "Player not found" });
  req.player = rows[0];
  next();
}

// GET /api/players/:id
router.get("/:id", loadPlayer, (req, res) => {
  res.json(req.player);
});

async function useStoredReport(req, res, next) {
  const stored = await getCachedReport(pool, req.player);
  if (stored) return res.json(stored);
  next();
}

const intFromEnv = (name, fallback) => {
  const n = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const newReportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: intFromEnv("SCOUT_RATE_LIMIT", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many new scout reports requested. Please try again later.",
  },
});

router.post(
  "/:id",
  loadPlayer,
  useStoredReport,
  newReportLimiter,
  async (req, res) => {
    res.json(await createReport(pool, req.player));
  },
);

router.use((err, req, res, next) => {
  if (err instanceof ScoutReportError)
    return res.status(err.status).json({ error: err.message });
  next(err);
});

module.exports = router;
