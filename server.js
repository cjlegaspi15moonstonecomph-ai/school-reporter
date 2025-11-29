import express from 'express';
import session from 'express-session';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { stringify } from 'csv-stringify';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ----- Session -----
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24*60*60*1000 }
}));

// ----- Admin credentials -----
const ADMIN_USER = 'admin';
const ADMIN_PASS = '1234';

// ----- Storage for uploaded files -----
const uploadDir = path.join(__dirname, 'uploads');
if(!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random()*1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Serve uploaded files
app.use('/uploads', express.static(uploadDir));

// ----- Helper functions -----
function loadReports(){
  if(!fs.existsSync('reports.json')) fs.writeFileSync('reports.json','[]');
  return JSON.parse(fs.readFileSync('reports.json','utf8'));
}
function saveReports(reports){
  fs.writeFileSync('reports.json', JSON.stringify(reports,null,2));
}

// ----- Admin auth middleware -----
function requireAdmin(req,res,next){
  if(req.session.admin) return next();
  return res.status(401).json({ message: 'unauthorized' });
}

// ----- Routes -----

// Serve student report page
app.get('/', (req,res) => {
  res.sendFile(path.join(__dirname,'public','index.html'));
});

// Serve admin dashboard page
app.get('/admin', (req,res) => {
  res.sendFile(path.join(__dirname,'public','admin.html'));
});

// Student report submission
app.post('/api/report', upload.array('files',5), (req,res)=>{
  try{
    const reports = loadReports();
    const files = req.files ? req.files.map(f=> `/uploads/${f.filename}`) : [];
    const newReport = {
      id: Date.now(),
      name: req.body.name || null,
      anonymous: !req.body.name,
      type: req.body.type || 'Other',
      text: req.body.description || '',
      date: new Date().toISOString(),
      files
    };
    reports.push(newReport);
    saveReports(reports);
    res.json({ message: 'Report submitted successfully' });
  }catch(err){
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin login/logout
app.post('/admin/login', (req,res)=>{
  const { username, password } = req.body;
  if(username===ADMIN_USER && password===ADMIN_PASS){
    req.session.admin={ user:ADMIN_USER };
    return res.json({ message:'ok' });
  }
  return res.status(401).json({ message:'Invalid credentials' });
});
app.get('/admin/logout', (req,res)=>{
  req.session.destroy(()=>res.json({ message:'logged out' }));
});
app.get('/admin/check', (req,res)=>{
  if(req.session.admin) return res.json({ ok:true });
  return res.status(401).json({ ok:false });
});

// Admin fetch reports
app.get('/admin/reports', requireAdmin, (req,res)=>{
  let reports = loadReports();
  const { q, dateFrom, dateTo, type } = req.query;

  if(q){
    const qq = q.toLowerCase();
    reports = reports.filter(r =>
      (r.text && r.text.toLowerCase().includes(qq)) ||
      (r.name && r.name.toLowerCase().includes(qq)) ||
      r.id.toString().includes(qq)
    );
  }
  if(type) reports = reports.filter(r => r.type === type);
  if(dateFrom){ const from = new Date(dateFrom); reports = reports.filter(r=> new Date(r.date)>=from); }
  if(dateTo){ const to = new Date(dateTo); to.setHours(23,59,59,999); reports = reports.filter(r=> new Date(r.date)<=to); }

  res.json(reports.slice(0,500));
});

// CSV download (include uploaded files)
app.get('/admin/download', requireAdmin, (req,res)=>{
  let reports = loadReports();
  const { q, dateFrom, dateTo, type } = req.query;

  if(q){
    const qq = q.toLowerCase();
    reports = reports.filter(r =>
      (r.text && r.text.toLowerCase().includes(qq)) ||
      (r.name && r.name.toLowerCase().includes(qq)) ||
      r.id.toString().includes(qq)
    );
  }
  if(type) reports = reports.filter(r => r.type === type);
  if(dateFrom){ const from = new Date(dateFrom); reports = reports.filter(r=> new Date(r.date)>=from); }
  if(dateTo){ const to = new Date(dateTo); to.setHours(23,59,59,999); reports = reports.filter(r=> new Date(r.date)<=to); }

  const csvData = reports.map(r=>({
    id:r.id,
    date:r.date,
    type:r.type,
    anonymous:r.anonymous,
    name:r.name||'',
    text:r.text,
    files: r.files ? r.files.join('|') : ''
  }));

  stringify(csvData,{ header:true }, (err,output)=>{
    if(err) return res.status(500).send('CSV error');
    res.header('Content-Type','text/csv');
    res.attachment('reports.csv');
    res.send(output);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('Server running on port', PORT));
