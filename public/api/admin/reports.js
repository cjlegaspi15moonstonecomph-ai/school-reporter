// reports.js
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFile = path.join(__dirname, '../../../reports.db');
const db = new Database(dbFile);

export default async function handler(req, res) {
  if(!req.session.admin) return res.status(401).json({ message:'unauthorized' });

  const { q, dateFrom, dateTo, type } = req.query;
  let sql = 'SELECT * FROM reports WHERE 1=1';
  const params = {};

  if(q){
    sql += ' AND (LOWER(text) LIKE @q OR LOWER(name) LIKE @q OR id LIKE @qExact)';
    params.q = `%${q.toLowerCase()}%`;
    params.qExact = `%${q}%`;
  }
  if(type){
    sql += ' AND type=@type';
    params.type = type;
  }
  if(dateFrom){
    sql += ' AND date >= @dateFrom';
    params.dateFrom = dateFrom;
  }
  if(dateTo){
    sql += ' AND date <= @dateTo';
    params.dateTo = dateTo;
  }

  const stmt = db.prepare(sql);
  const reports = stmt.all(params).slice(0,500);
  reports.forEach(r => r.files = r.files ? r.files.split('|') : []);

  res.status(200).json(reports);
}
