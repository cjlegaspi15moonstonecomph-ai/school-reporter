export default function handler(req, res) {
  return res.status(200).json([
    {
      id: 1,
      type: "Physical Violence",
      name: "John Doe",
      anonymous: false,
      place: "Hallway",
      grade: "9",
      text: "Sample report",
      date: new Date().toISOString(),
      files: []
    }
  ]);
}
