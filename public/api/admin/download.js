export default function handler(req, res) {
  const cookie = req.headers.cookie || "";
  const loggedIn = cookie.includes("admin_auth=true");

  if (!loggedIn) {
    return res.status(401).send("Unauthorized");
  }

  // Example CSV data — replace with real DB later
  const csv = [
    "ID,Type,Name,Place,Grade,Description,Date",
    "1,Physical Violence,John Doe,Hallway,Grade 9,Sample report," + new Date().toISOString()
  ].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=reports.csv");
  res.status(200).send(csv);
}
