// api/admin/reports.js
import { db } from "../../../lib/firebaseAdmin.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change_this";

function checkAuth(req){
  const cookie = req.headers.cookie || "";
  const match = cookie.split(";").map(s=>s.trim()).find(c=>c.startsWith("admin_auth="));
  if(!match) throw new Error("unauth");
  const token = match.split("=")[1];
  jwt.verify(token, JWT_SECRET);
}

export default async function handler(req,res){
  try{
    checkAuth(req);
  } catch(e){
    return res.status(401).json({ message: "Unauthorized" });
  }

  try{
    const { q, dateFrom, dateTo, type } = req.query || {};
    let ref = db.collection("reports").orderBy("date","desc").limit(500);
    const snapshot = await ref.get();
    let reports = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    if(q){
      const qq = q.toLowerCase();
      reports = reports.filter(r =>
        (r.text && r.text.toLowerCase().includes(qq)) ||
        (r.name && r.name.toLowerCase().includes(qq)) ||
        (r.id && r.id.toString().includes(qq))
      );
    }
    if(type) reports = reports.filter(r => r.type === type);
    if(dateFrom){
      const from = new Date(dateFrom);
      reports = reports.filter(r => new Date(r.date) >= from);
    }
    if(dateTo){
      const to = new Date(dateTo); to.setHours(23,59,59,999);
      reports = reports.filter(r => new Date(r.date) <= to);
    }

    return res.status(200).json(reports);
  }catch(err){
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
