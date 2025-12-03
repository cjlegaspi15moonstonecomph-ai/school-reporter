// api/admin/check.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change_this";

export default function handler(req, res) {
  try {
    const cookie = req.headers.cookie || "";
    const match = cookie.split(";").map(s=>s.trim()).find(c => c.startsWith("admin_auth="));
    if (!match) return res.status(401).json({ ok: false });
    const token = match.split("=")[1];
    jwt.verify(token, JWT_SECRET);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(401).json({ ok: false });
  }
}
