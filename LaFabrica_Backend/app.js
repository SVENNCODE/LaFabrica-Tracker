const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const playerRoutes = require("./routes/players");
const adminRoutes = require("./routes/admin");

const app = express();

app.disable("x-powered-by");
app.use(helmet());

if (process.env.TRUST_PROXY) {
  const v = process.env.TRUST_PROXY;
  app.set("trust proxy", /^\d+$/.test(v) ? Number(v) : v === "true" ? true : v);
}

const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "100kb" }));
app.use("/api/players", playerRoutes);
app.use("/api/admin", adminRoutes);
app.get("/", (req, res) => {
  res.json({ message: "La Fabrica API is running" });
});

app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status =
    Number.isInteger(err.status) && err.status >= 400 && err.status < 600
      ? err.status
      : 500;
  if (status >= 500) {
    console.error(err);
    return res.status(status).json({ error: "Server error" });
  }
  res
    .status(status)
    .json({
      error:
        err.type === "entity.parse.failed"
          ? "Invalid JSON body"
          : err.message || "Bad request",
    });
});
module.exports = app;
