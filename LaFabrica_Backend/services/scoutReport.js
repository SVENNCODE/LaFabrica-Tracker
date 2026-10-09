"use strict";
const crypto = require("crypto");

const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const TIMEOUT_MS =
  Number.parseInt(process.env.GROQ_TIMEOUT_MS ?? "", 10) || 20000;

// Per-90 figures are only meaningful with enough minutes.
const PER90_MIN_MINUTES = 180;

class ScoutReportError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = "ScoutReportError";
    this.status = status;
  }
}

const getModel = () => process.env.GROQ_MODEL || DEFAULT_MODEL;

let client = null;
function getClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new ScoutReportError(
      "AI scout reports are not configured on this server.",
      503,
    );
  }
  if (!client) {
    const Groq = require("groq-sdk");
    client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
      timeout: TIMEOUT_MS,
      maxRetries: 1,
    });
  }
  return client;
}

const clean = (v) =>
  String(v)
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .trim();
const orNotAdded = (v) =>
  v === null || v === undefined ? "Not yet added" : clean(v);

function buildPrompt(p) {
  const per90 =
    p.goalsPer90 === null || p.goalsPer90 === undefined
      ? `Not available (needs more than ${PER90_MIN_MINUTES} minutes played)`
      : `${p.goalsPer90} goals and ${p.assistsPer90} assists per 90 minutes`;
  return `You are an expert football scout writing about a youth academy player.

Use ONLY the data below. Do not invent statistics, match results, injuries, transfers or quotes. If a piece of data is "Not yet added", say it is missing rather than guessing. These are small samples from youth football, so state the limits of the data plainly.

Player Data:
- Name: ${clean(p.firstName)} ${clean(p.lastName)}
- Age: ${p.age ?? "Age unknown"}
- Nationality: ${orNotAdded(p.nationality)}
- Position: ${orNotAdded(p.position)}
- Current Team: ${orNotAdded(p.currentTeam)}
- Height: ${p.Height ? `${p.Height}cm` : "Not yet added"}
- Preferred Foot: ${orNotAdded(p.preferredFoot)}
- Goals: ${orNotAdded(p.goals)}
- Assists: ${orNotAdded(p.assists)}
- Minutes Played: ${orNotAdded(p.minutesPlayed)}
- Rate stats: ${per90}

Write the report in 3 clearly labeled sections:
1. Performance Analysis
2. Development Projection
3. Professional Comparison

For the Professional Comparison, suggest ONE currently active professional player whose playing style at this position is similar, and say clearly that it is a style comparison, not a prediction of ability. If the data is too thin for a fair comparison, say so instead.

Be specific, professional and concise.`;
}

const hashInput = (model, prompt) =>
  crypto.createHash("sha256").update(`${model}\n${prompt}`).digest("hex");

// Calls Groq.
async function generateReport(prompt) {
  const model = getModel();
  let completion;
  try {
    completion = await getClient().chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
    });
  } catch (err) {
    if (err instanceof ScoutReportError) throw err;
    console.error(
      "Groq request failed:",
      err.name,
      err.status ?? "",
      err.message,
    );
    if (err.name === "APIConnectionTimeoutError") {
      throw new ScoutReportError(
        "The AI service took too long to respond. Please try again.",
        504,
      );
    }
    throw new ScoutReportError(
      "The AI service is unavailable right now. Please try again later.",
      502,
    );
  }
  const text = completion?.choices?.[0]?.message?.content?.trim();
  if (!text)
    throw new ScoutReportError(
      "The AI service returned an empty report. Please try again.",
      502,
    );
  return { text, model };
}

async function getCachedReport(db, player) {
  const hash = hashInput(getModel(), buildPrompt(player));
  const { rows } = await db.query(
    "SELECT report, model, created_at FROM scout_reports WHERE player_id = $1 AND input_hash = $2",
    [player.id, hash],
  );
  return rows[0]
    ? {
        report: rows[0].report,
        model: rows[0].model,
        generatedAt: rows[0].created_at,
        cached: true,
      }
    : null;
}

// Generates a report with the AI service and stores it, replacing any older one for this player.
async function createReport(db, player) {
  const prompt = buildPrompt(player);
  const { text, model } = await module.exports.generateReport(prompt);
  const { rows } = await db.query(
    `INSERT INTO scout_reports (player_id, report, model, input_hash)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (player_id) DO UPDATE
       SET report = EXCLUDED.report, model = EXCLUDED.model,
           input_hash = EXCLUDED.input_hash, created_at = now()
     RETURNING created_at`,
    [player.id, text, model, hashInput(getModel(), prompt)],
  );
  return {
    report: text,
    model,
    generatedAt: rows[0].created_at,
    cached: false,
  };
}

module.exports = {
  ScoutReportError,
  PER90_MIN_MINUTES,
  buildPrompt,
  getCachedReport,
  createReport,
  generateReport,
};
