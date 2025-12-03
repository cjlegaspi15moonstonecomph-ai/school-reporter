// api/admin/download.js
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
    return res.status(401).send("Unauthorized");
  }

  try{
    const snapshot = await db.collection("reports").get();
    const reports = snapshot.docs.map(d=> ({ id: d.id, ...d.data() }));

    // Build CSV
    const header = ["ID","Date","Type","Anonymous","Name","Grade","Place","Description","Files"];
    const rows = reports.map(r => [
      r.id,
      r.date,
      r.type,
      !!r.anonymous,
      r.name || "",
      r.grade || "",
      r.place || "",
      (r.text || "").replace(/\n/g," "),
      (r.files || []).join("|")
    ]);

    const csvLines = [header.join(","), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(","))].join("\n");

    res.setHeader("Content-Type","text/csv");
    res.setHeader("Content-Disposition","attachment; filename=reports.csv");
    return res.status(200).send(csvLines);
  }catch(err){
    console.error(err);
    return res.status(500).send("Server error");
  }
}
