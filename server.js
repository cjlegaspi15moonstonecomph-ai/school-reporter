import express from "express";
import session from "express-session";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { stringify } from "csv-stringify";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder
app.use(express.static(path.join(__dirname, "public")));

// Sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: true,
  })
);

// Admin credentials
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "1234";

// Upload folder
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use("/uploads", express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const name = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, name + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// SQLite Initialization
let db;
(async () => {
  db = await open({
    filename: path.join(__dirname, "reports.db"),
    driver: sqlite3.Database,
  });

  await db.exec(`
      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        anonymous INTEGER,
        type TEXT,
        text TEXT,
        place TEXT,
        grade TEXT,
        date TEXT,
        files TEXT
      )
  `);
})();

// Middleware
function requireAdmin(req, res, next) {
  if (req.session.admin) return next();
  return res.status(401).json({ message: "Unauthorized" });
}

// Submit report
app.post("/api/report", upload.array("files", 5), async (req, res) => {
  try {
    const files = req.files ? req.files.map(f => "/uploads/" + f.filename).join("|") : "";

    await db.run(
      `INSERT INTO reports (name, anonymous, type, text, place, grade, date, files)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.body.name || null,
        req.body.name ? 0 : 1,
        req.body.type || "Other",
        req.body.description || "",
        req.body.place || "",
        req.body.grade || "",
        new Date().toISOString(),
        files,
      ]
    );

    res.json({ message: "Report submitted successfully" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin login
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.admin = { user: ADMIN_USER };
    return res.json({ message: "ok" });
  }

  res.status(401).json({ message: "Invalid credentials" });
});

// Admin check
app.get("/api/admin/check", (req, res) => {
  if (req.session.admin) return res.json({ ok: true });
  res.status(401).json({ ok: false });
});

// Admin logout
app.get("/api/admin/logout", (req, res) => {
  req.session.destroy(() => res.json({ message: "logged out" }));
});

// Fetch reports
app.get("/api/admin/reports", requireAdmin, async (req, res) => {
  try {
    const q = req.query.q ? `%${req.query.q.toLowerCase()}%` : null;

    let rows = await db.all(`
      SELECT * FROM reports
      WHERE (LOWER(text) LIKE COALESCE(?, LOWER(text))
        OR LOWER(name) LIKE COALESCE(?, LOWER(name)))
    `, [q, q]);

    rows = rows.map(r => ({
      ...r,
      files: r.files ? r.files.split("|") : [],
    }));

    res.json(rows);
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Server error" });
  }
});

// Download CSV
app.get("/api/admin/download", requireAdmin, async (req, res) => {
  try {
    const rows = await db.all(`SELECT * FROM reports`);

    const csvRecords = rows.map(r => ({
      id: r.id,
      name: r.name,
      anonymous: r.anonymous,
      type: r.type,
      text: r.text,
      place: r.place,
      grade: r.grade,
      date: r.date,
      files: r.files,
    }));

    stringify(csvRecords, { header: true }, (err, output) => {
      if (err) return res.status(500).send("CSV error");

      res.header("Content-Type", "text/csv");
      res.attachment("reports.csv");
      res.send(output);
    });
  } catch (e) {
    console.log(e);
    res.status(500).send("Server error");
  }
});

// Admin page
app.get("/admin", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "admin.html"))
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});
