export default function handler(req, res) {
  const cookie = req.headers.cookie || "";
  const loggedIn = cookie.includes("admin_auth=true");

  if (!loggedIn) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Temporary sample data — replace with real database later
  const sampleReports = [
    {
      id: 1,
      type: "Physical Violence",
      name: "John Doe",
      anonymous: false,
      place: "Hallway",
      grade: "Grade 9",
      text: "Sample report description",
      date: new Date().toISOString(),
      files: []
    }
  ];

  return res.status(200).json(sampleReports);
}
