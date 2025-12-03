export default function handler(req, res) {
  // Clear the cookie
  res.setHeader("Set-Cookie", "admin_auth=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax");
  return res.status(200).json({ message: "Logged out" });
}
