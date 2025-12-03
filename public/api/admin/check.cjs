// check.js
export default async function handler(req, res) {
  if(req.session && req.session.admin){
    res.status(200).json({ ok: true });
  } else {
    res.status(401).json({ ok: false });
  }
}
