import jwt from "jsonwebtoken";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { stringify } from "csv-stringify";
const SECRET = process.env.JWT_SECRET || "supersecret";

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ message: "Method Not Allowed" });

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    jwt.verify(token, SECRET);

    const db = await open({ filename: "./reports.db", driver: sqlite3.Database });
    const rows = await db.all(`SELECT * FROM reports`);

    const csvRecords = rows.map((r) => ({
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

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=reports.csv");
      res.send(output);
    });
  } catch {
    res.status(401).json({ message: "Unauthorized" });
  }
}
