export default function handler(req, res) {
  const cookie = req.headers.cookie || "";
  const loggedIn = cookie.includes("admin_auth=true");

  if (!loggedIn) {
    return res.status(401).json({ message: "Not logged in" });
  }

  return res.status(200).json({ message: "Logged in" });
}
