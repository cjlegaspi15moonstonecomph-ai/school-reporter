// logout.js
export default async function handler(req, res) {
  req.session.destroy(() => {
    res.status(200).json({ message: 'logged out' });
  });
}
