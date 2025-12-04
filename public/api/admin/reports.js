import jwt from "jsonwebtoken";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
const SECRET = process.env.JWT_SECRET || "supersecret";

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ message: "Method Not Allowed" });

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ ok: false });

  try {
    jwt.verify(token, SECRET);

    const q = req.query.q ? `%${req.query.q.toLowerCase()}%` : null;

    const db = await open({ filename: "./reports.db", driver: sqlite3.Database });
    let rows = await db.all(
      `SELECT * FROM reports
       WHERE (LOWER(text) LIKE COALESCE(?, LOWER(text))
       OR LOWER(name) LIKE COALESCE(?, LOWER(name)))`,
      [q, q]
    );

    rows = rows.map((r) => ({
      ...r,
      files: r.files ? r.files.split("|") : [],
    }));

    res.json(rows);
  } catch {
    res.status(401).json({ ok: false });
  }
}
