import jwt from "jsonwebtoken";
const SECRET = process.env.JWT_SECRET || "supersecret";

export default function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ message: "Method Not Allowed" });

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ ok: false });

  try {
    jwt.verify(token, SECRET);
    res.json({ ok: true });
  } catch {
    res.status(401).json({ ok: false });
  }
}
