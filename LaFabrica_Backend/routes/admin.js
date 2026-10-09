const express = require("express");
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const pool = require("../database");
const { runImport, ImportError } = require("../services/playerImport");

const router = express.Router();

const MAX_UPLOAD_BYTES = 1024 * 1024;

router.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many admin requests, try again later" },
  }),
);

function requireAdminKey(req, res, next) {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) {
    return res
      .status(503)
      .json({
        error: "Admin API is disabled: set ADMIN_API_KEY on the server",
      });
  }
  const provided = req.get("x-admin-key") || "";
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  if (!crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: "Invalid or missing admin key" });
  }
  next();
}

// Auth runs before the upload middleware so an unauthenticated caller cannot make the
// server buffer a file.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 5, parts: 10 },
  fileFilter(req, file, cb) {
    if (!/\.csv$/i.test(file.originalname))
      return cb(new ImportError("Only .csv files are accepted"));
    cb(null, true);
  },
});

router.post(
  "/players/import",
  requireAdminKey,
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file)
        return res
          .status(400)
          .json({ error: 'Attach a CSV file in the "file" field' });
      const dryRun = req.query.dryRun !== "false";
      const result = await runImport(pool, req.file.buffer, { dryRun });
      const blocked = !dryRun && !result.applied;
      res.status(blocked ? 422 : 200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const tooBig = err.code === "LIMIT_FILE_SIZE";
    return res.status(tooBig ? 413 : 400).json({
      error: tooBig
        ? `File is larger than ${MAX_UPLOAD_BYTES / 1024 / 1024} MB`
        : `Upload problem: ${err.message}`,
    });
  }
  if (err instanceof ImportError)
    return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

module.exports = router;
