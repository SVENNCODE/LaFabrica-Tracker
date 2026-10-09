// The rate limit on generating NEW scout reports
const { test, before, after, beforeEach, mock } = require("node:test");
const assert = require("node:assert/strict");

require("./testGuard").assertTestDatabase();

process.env.SCOUT_RATE_LIMIT = "2";
const pool = require("../database");
const app = require("../app");
const scoutReport = require("../services/scoutReport");

let server;
let base;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  mock.restoreAll();
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

beforeEach(async () => {
  await pool.query("TRUNCATE players RESTART IDENTITY CASCADE");
  await pool.query(
    `INSERT INTO players ("firstName","lastName","dateofBirth","position") VALUES
      ('A','One','2007-01-01','CM'), ('B','Two','2007-01-02','CM'), ('C','Three','2007-01-03','CM')`,
  );
});

const post = async (id) => {
  const res = await fetch(`${base}/api/players/${id}`, { method: "POST" });
  return { status: res.status, headers: res.headers, body: await res.json() };
};

test("only requests that need a NEW report count towards the limit; stored reports are always served", async () => {
  const gen = mock.method(scoutReport, "generateReport", async () => ({
    text: "r",
    model: "stub-model",
  }));

  assert.equal((await post(1)).status, 200); // new report 1 of 2
  assert.equal((await post(1)).status, 200);
  assert.equal((await post(1)).status, 200);
  assert.equal((await post(2)).status, 200); // new report 2 of 2

  const blocked = await post(3); // would be new report 3
  assert.equal(blocked.status, 429);
  assert.match(blocked.body.error, /Too many/);
  assert.ok(blocked.headers.get("retry-after"));
  assert.equal(gen.mock.callCount(), 2); // the AI service was not called for the blocked request

  assert.equal((await post(1)).status, 200); // stored reports still work while limited
  assert.equal((await post(2)).status, 200);
});
