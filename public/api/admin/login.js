// api/admin/login.js
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "1234";
const JWT_SECRET = process.env.JWT_SECRET || "change_this";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign({ user: ADMIN_USER }, JWT_SECRET, { expiresIn: "1d" });
    const cookie = serialize("admin_auth", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60
    });
    res.setHeader("Set-Cookie", cookie);
    return res.status(200).json({ message: "ok" });
  }
  return res.status(401).json({ message: "Invalid credentials" });
}
