// login.js
export default async function handler(req, res) {
  const { username, password } = req.body;
  const ADMIN_USER = 'admin'; // or import from env
  const ADMIN_PASS = '1234';  // or import from env

  if(username === ADMIN_USER && password === ADMIN_PASS){
    req.session.admin = { user: ADMIN_USER };
    return res.status(200).json({ message: 'ok' });
  } 
  return res.status(401).json({ message: 'Invalid credentials' });
}
