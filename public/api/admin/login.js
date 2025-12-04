import jwt from "jsonwebtoken";

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "1234";
const SECRET = process.env.JWT_SECRET || "supersecret";

export default function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method Not Allowed" });

  const { username, password } = JSON.parse(req.body);

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign({ user: ADMIN_USER }, SECRET, { expiresIn: "1d" });
    return res.status(200).json({ token });
  }

  res.status(401).json({ message: "Invalid credentials" });
}
