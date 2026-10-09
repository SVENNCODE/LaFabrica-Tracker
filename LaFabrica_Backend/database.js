// PostgreSQL connection pool.
const { Pool } = require("pg");

const intFromEnv = (name, fallback) => {
  const n = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const connection = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: intFromEnv("DB_PORT", 5432),
    };

const pool = new Pool({
  ...connection,
  ssl:
    process.env.DB_SSL === "true"
      ? {
          rejectUnauthorized:
            process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
        }
      : undefined,
  max: intFromEnv("DB_POOL_MAX", 10),
  connectionTimeoutMillis: intFromEnv("DB_CONNECT_TIMEOUT_MS", 5000), // fail fast if the DB is unreachable
  idleTimeoutMillis: 30000,
  statement_timeout: intFromEnv("DB_STATEMENT_TIMEOUT_MS", 15000), // a stuck query cannot hold a connection forever
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err.message);
});

module.exports = pool;
