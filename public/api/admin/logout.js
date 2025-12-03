// api/admin/logout.js
import { serialize } from "cookie";

export default function handler(req,res){
  const cookie = serialize("admin_auth", "", { path: "/", httpOnly: true, maxAge: 0 });
  res.setHeader("Set-Cookie", cookie);
  return res.status(200).json({ message: "logged out" });
}
