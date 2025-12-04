import formidable from "formidable";
import { v2 as cloudinary } from "cloudinary";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method Not Allowed" });

  const form = formidable({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ message: "Upload error" });

    let uploadedFiles = [];
    if (files.files) {
      const fileArray = Array.isArray(files.files) ? files.files : [files.files];
      for (const file of fileArray) {
        const result = await cloudinary.uploader.upload(file.filepath);
        uploadedFiles.push(result.secure_url);
      }
    }

    // Save to SQLite
    const db = await open({ filename: "./reports.db", driver: sqlite3.Database });
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

    await db.run(
      `INSERT INTO reports (name, anonymous, type, text, place, grade, date, files)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fields.name || null,
        fields.name ? 0 : 1,
        fields.type || "Other",
        fields.description || "",
        fields.place || "",
        fields.grade || "",
        new Date().toISOString(),
        uploadedFiles.join("|"),
      ]
    );

    res.status(200).json({ message: "Report submitted successfully" });
  });
}
