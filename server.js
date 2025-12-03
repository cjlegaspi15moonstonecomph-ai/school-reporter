import express from 'express';
import session from 'express-session';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { stringify } from 'csv-stringify';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// ----- Session -----
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24*60*60*1000 }
}));

// ----- Admin credentials -----
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || '1234';

// ----- Uploads folder -----
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req,file,cb) => cb(null, uploadDir),
  filename: (req,file,cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random()*1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// ----- Database -----
const dbFile = path.join(process.cwd(), 'reports.db');
const db = new Database(dbFile);

// Create table if not exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    anonymous INTEGER,
    type TEXT,
    text TEXT,
    place TEXT,
    grade TEXT,
    date TEXT,
    files TEXT
  )
`).run();

// ----- Helper functions -----
function saveReport(report){
  const stmt = db.prepare(`
    INSERT INTO reports
    (name, anonymous, type, text, place, grade, date, files)
    VALUES (@name,@anonymous,@type,@text,@place,@grade,@date,@files)
  `);
  stmt.run(report);
}

function getReports(filters={}){
  let sql = 'SELECT * FROM reports WHERE 1=1';
  const params = {};
  
  if(filters.q){
    sql += ' AND (LOWER(text) LIKE @q OR LOWER(name) LIKE @q OR id LIKE @qExact)';
    params.q = `%${filters.q.toLowerCase()}%`;
    params.qExact = `%${filters.q}%`;
  }
  if(filters.type){
    sql += ' AND type=@type';
    params.type = filters.type;
  }
  if(filters.dateFrom){
    sql += ' AND date>=@dateFrom';
    params.dateFrom = filters.dateFrom;
  }
  if(filters.dateTo){
    sql += ' AND date<=@dateTo';
    params.dateTo = filters.dateTo;
  }
  
  const stmt = db.prepare(sql);
  return stmt.all(params).slice(0,500);
}

// ----- Middleware -----
function requireAdmin(req,res,next){
  if(req.session.admin) return next();
  return res.status(401).json({ message:'unauthorized' });
}

// ----- Routes -----
// Student page
app.get('/', (req,res)=> res.sendFile(path.join(__dirname,'public','index.html')));

// Submit report
app.post('/api/report', upload.array('files',5), (req,res)=>{
  try{
    const files = req.files ? req.files.map(f=> `/uploads/${f.filename}`) : [];
    const report = {
      name: req.body.name || null,
      anonymous: !req.body.name ? 1 : 0,
      type: req.body.type || 'Other',
      text: req.body.description || '',
      place: req.body.place || null,
      grade: req.body.grade || null,
      date: new Date().toISOString(),
      files: files.join('|')
    };
    saveReport(report);
    res.json({ message:'Report submitted successfully' });
  }catch(e){
    console.error('Report submission error:', e);
    res.status(500).json({ message:'Server error' });
  }
});

// ----- Admin API -----
// Login
app.post('/api/admin/login', (req,res)=>{
  const { username, password } = req.body;
  if(username===ADMIN_USER && password===ADMIN_PASS){
    req.session.admin = { user: ADMIN_USER };
    return res.json({ message:'ok' });
  }
  return res.status(401).json({ message:'Invalid credentials' });
});

// Logout
app.get('/api/admin/logout', (req,res)=>{
  req.session.destroy(()=>res.json({ message:'logged out' }));
});

// Check session
app.get('/api/admin/check', (req,res)=>{
  if(req.session.admin) return res.json({ ok:true });
  return res.status(401).json({ ok:false });
});

// Fetch reports
app.get('/api/admin/reports', requireAdmin, (req,res)=>{
  try{
    const reports = getReports(req.query);
    reports.forEach(r=> r.files = r.files ? r.files.split('|') : []);
    res.json(reports);
  }catch(e){
    console.error('Fetch reports error:', e);
    res.status(500).json({ message:'Server error' });
  }
});

// Download CSV
app.get('/api/admin/download', requireAdmin, (req,res)=>{
  try{
    const reports = getReports(req.query).map(r=>({
      id: r.id,
      date: r.date,
      type: r.type,
      anonymous: r.anonymous,
      name: r.name||'',
      grade: r.grade||'',
      place: r.place||'',
      text: r.text,
      files: r.files || ''
    }));
    
    stringify(reports, { header:true }, (err,output)=>{
      if(err) return res.status(500).send('CSV error');
      res.header('Content-Type','text/csv');
      res.attachment('reports.csv');
      res.send(output);
    });
  }catch(e){
    console.error('CSV download error:', e);
    res.status(500).send('Server error');
  }
});

// Admin page
app.get('/admin', (req,res)=> res.sendFile(path.join(__dirname,'public','admin.html')));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));
