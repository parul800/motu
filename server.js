const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASS = 'I am beautiful@12344';
app.use(bodyParser.json());
app.use(express.static('public'));
const db = new sqlite3.Database(path.join(__dirname,'pink_pro_final.db'));
db.serialize(()=>{ db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  insta TEXT NOT NULL UNIQUE,
  pass_hash TEXT NOT NULL,
  reset_token TEXT, reset_expiry INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`); });
// signup
app.post('/api/signup', async (req,res)=>{ const {name,insta,password}=req.body; if(!name||!insta||!password) return res.status(400).json({error:'Missing'}); try{ const pass_hash = await bcrypt.hash(password,10); db.run('INSERT INTO users (name,insta,pass_hash) VALUES (?,?,?)',[name,insta,pass_hash], function(err){ if(err) return res.status(500).json({error:err.message}); res.json({id:this.lastID,name,insta}); }); }catch(e){ res.status(500).json({error:e.message}); } });
// login
app.post('/api/login',(req,res)=>{ const {insta,password}=req.body; if(!insta||!password) return res.status(400).json({error:'Missing'}); db.get('SELECT * FROM users WHERE insta = ?',[insta], async (err,row)=>{ if(err) return res.status(500).json({error:err.message}); if(!row) return res.status(401).json({error:'No user'}); const ok = await bcrypt.compare(password,row.pass_hash); if(!ok) return res.status(401).json({error:'Bad password'}); res.json({id:row.id,name:row.name,insta:row.insta}); }); });
// forgot
app.post('/api/forgot',(req,res)=>{ const {insta}=req.body; if(!insta) return res.status(400).json({error:'Missing'}); db.get('SELECT * FROM users WHERE insta = ?',[insta], (err,row)=>{ if(err) return res.status(500).json({error:err.message}); if(!row) return res.status(404).json({error:'No user'}); const token = crypto.randomBytes(3).toString('hex'); const expiry=Date.now()+1000*60*15; db.run('UPDATE users SET reset_token=?,reset_expiry=? WHERE id=?',[token,expiry,row.id], function(err2){ if(err2) return res.status(500).json({error:err2.message}); res.json({resetToken:token}); }); }); });
// reset
app.post('/api/reset', async (req,res)=>{ const {insta,token,newPassword}=req.body; if(!insta||!token||!newPassword) return res.status(400).json({error:'Missing'}); db.get('SELECT * FROM users WHERE insta=? AND reset_token=?',[insta,token], async (err,row)=>{ if(err) return res.status(500).json({error:err.message}); if(!row) return res.status(400).json({error:'Invalid token'}); if(row.reset_expiry && Date.now()>row.reset_expiry) return res.status(400).json({error:'Token expired'}); const hash = await bcrypt.hash(newPassword,10); db.run('UPDATE users SET pass_hash=?,reset_token=NULL,reset_expiry=NULL WHERE id=?',[hash,row.id], function(err2){ if(err2) return res.status(500).json({error:err2.message}); res.json({message:'Password reset'}); }); }); });
// admin list
app.get('/api/users',(req,res)=>{ const admin = req.headers['x-admin-pass'] || req.query.admin; if(admin !== ADMIN_PASS) return res.status(403).json({error:'Forbidden'}); db.all('SELECT id,name,insta,created_at FROM users ORDER BY id DESC',[],(err,rows)=>{ if(err) return res.status(500).json({error:err.message}); res.json(rows); }); });
app.listen(PORT, ()=>console.log('Server running on',PORT));
