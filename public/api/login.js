export default function handler(req, res) {
  if (req.method === 'POST') {
    const { username, password } = req.body;

    // Replace with your credentials
    if(username === "admin" && password === "1234") {
      res.status(200).json({ success: true });
    } else {
      res.status(401).json({ success: false });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
