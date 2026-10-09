require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("./database");

async function main() {
  const dir = path.join(__dirname, "migrations");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const client = await pool.connect();
  try {
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         name text PRIMARY KEY,
         applied_at timestamptz NOT NULL DEFAULT now()
       )`,
    );
    const done = new Set(
      (await client.query("SELECT name FROM schema_migrations")).rows.map(
        (r) => r.name,
      ),
    );
    let applied = 0;
    for (const file of files) {
      if (done.has(file)) continue;
      const sql = fs.readFileSync(path.join(dir, file), "utf8");
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
          file,
        ]);
        await client.query("COMMIT");
        console.log(`applied ${file}`);
        applied++;
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`FAILED ${file}: ${err.message}`);
        process.exitCode = 1;
        return;
      }
    }
    console.log(
      applied ? `${applied} migration(s) applied.` : "Database is up to date.",
    );
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
