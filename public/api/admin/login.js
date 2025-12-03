export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { username, password } = req.body;

  // CHANGE TO YOUR REAL CREDENTIALS
  const ADMIN_USER = "admin";
  const ADMIN_PASS = "1234";

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    // Set cookie (session)
    res.setHeader('Set-Cookie', `admin_auth=true; Path=/; HttpOnly; Max-Age=86400; SameSite=Lax`);

    return res.status(200).json({ message: "Login successful" });
  }

  return res.status(401).json({ message: "Invalid username or password" });
}
