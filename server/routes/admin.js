const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb, saveDatabase } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'ads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `ad_${Date.now()}_${Math.round(Math.random() * 1000)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
    const allowedVideo = /\.(mp4|webm|ogg|mov|avi)$/i;
    const ext = path.extname(file.originalname);
    if (allowedImage.test(ext) || allowedVideo.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format non supporté. Images: jpg, png, gif, webp, svg. Vidéos: mp4, webm, ogg, mov'));
    }
  }
});

router.get('/users', authenticate, authorize('admin'), (req, res) => {
  const db = getDb();
  const result = db.exec("SELECT id, firstName, lastName, email, role, company, city, country, isVerified, createdAt FROM users ORDER BY createdAt DESC");
  let users = [];
  if (result[0]) {
    const columns = result[0].columns;
    users = result[0].values.map(row => {
      const user = {};
      columns.forEach((col, i) => { user[col] = row[i]; });
      return user;
    });
  }
  res.json(users);
});

router.delete('/users/:id', authenticate, authorize('admin'), (req, res) => {
  const db = getDb();
  db.run("DELETE FROM applications WHERE candidateId = ?", [req.params.id]);
  db.run("DELETE FROM notifications WHERE userId = ?", [req.params.id]);
  db.run("DELETE FROM saved_jobs WHERE userId = ?", [req.params.id]);
  db.run("DELETE FROM jobs WHERE recruiterId = ?", [req.params.id]);
  db.run("DELETE FROM users WHERE id = ? AND role != 'admin'", [req.params.id]);
  saveDatabase();
  res.json({ message: 'Utilisateur supprimé' });
});

router.get('/jobs', authenticate, authorize('admin'), (req, res) => {
  const db = getDb();
  const result = db.exec("SELECT j.*, u.firstName as recruiterName, u.company, (SELECT COUNT(*) FROM applications WHERE jobId = j.id) as appCount FROM jobs j JOIN users u ON j.recruiterId = u.id ORDER BY j.createdAt DESC");
  let jobs = [];
  if (result[0]) {
    const columns = result[0].columns;
    jobs = result[0].values.map(row => {
      const job = {};
      columns.forEach((col, i) => { job[col] = row[i]; });
      return job;
    });
  }
  res.json(jobs);
});

router.get('/stats', authenticate, authorize('admin'), (req, res) => {
  const db = getDb();
  const users = db.exec("SELECT COUNT(*) FROM users");
  const recruiters = db.exec("SELECT COUNT(*) FROM users WHERE role = 'recruiter'");
  const candidates = db.exec("SELECT COUNT(*) FROM users WHERE role = 'candidate'");
  const jobs = db.exec("SELECT COUNT(*) FROM jobs");
  const activeJobs = db.exec("SELECT COUNT(*) FROM jobs WHERE isActive = 1 AND expiresAt > datetime('now')");
  const applications = db.exec("SELECT COUNT(*) FROM applications");
  const ads = db.exec("SELECT COUNT(*) FROM advertisements WHERE isActive = 1");

  res.json({
    totalUsers: users[0] ? users[0].values[0][0] : 0,
    recruiters: recruiters[0] ? recruiters[0].values[0][0] : 0,
    candidates: candidates[0] ? candidates[0].values[0][0] : 0,
    totalJobs: jobs[0] ? jobs[0].values[0][0] : 0,
    activeJobs: activeJobs[0] ? activeJobs[0].values[0][0] : 0,
    applications: applications[0] ? applications[0].values[0][0] : 0,
    activeAds: ads[0] ? ads[0].values[0][0] : 0
  });
});

router.get('/ads', authenticate, authorize('admin'), (req, res) => {
  const db = getDb();
  const result = db.exec("SELECT * FROM advertisements ORDER BY createdAt DESC");
  let ads = [];
  if (result[0]) {
    const columns = result[0].columns;
    ads = result[0].values.map(row => {
      const ad = {};
      columns.forEach((col, i) => { ad[col] = row[i]; });
      return ad;
    });
  }
  res.json(ads);
});

router.post('/ads', authenticate, authorize('admin'), upload.single('media'), (req, res) => {
  try {
    const { title, linkUrl, position } = req.body;

    if (!title || !req.file) {
      return res.status(400).json({ message: 'Titre et fichier média requis' });
    }

    const mediaUrl = `/uploads/ads/${req.file.filename}`;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const videoExts = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    const mediaType = videoExts.includes(ext) ? 'video' : 'image';

    const db = getDb();
    db.run(
      "INSERT INTO advertisements (title, mediaUrl, mediaType, linkUrl, position) VALUES (?, ?, ?, ?, ?)",
      [title, mediaUrl, mediaType, linkUrl || null, position || 'banner']
    );
    saveDatabase();
    res.status(201).json({ message: 'Publicité ajoutée avec succès' });
  } catch (error) {
    console.error('Ad upload error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'upload' });
  }
});

router.put('/ads/:id', authenticate, authorize('admin'), (req, res) => {
  const { title, linkUrl, position, isActive } = req.body;
  const db = getDb();
  db.run("UPDATE advertisements SET title=?, linkUrl=?, position=?, isActive=? WHERE id=?",
    [title, linkUrl, position, isActive, req.params.id]);
  saveDatabase();
  res.json({ message: 'Publicité mise à jour' });
});

router.delete('/ads/:id', authenticate, authorize('admin'), (req, res) => {
  const db = getDb();
  const result = db.exec("SELECT mediaUrl FROM advertisements WHERE id = ?", [req.params.id]);
  if (result[0] && result[0].values.length > 0) {
    const mediaUrl = result[0].values[0][0];
    const filePath = path.join(__dirname, '..', mediaUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
  db.run("DELETE FROM advertisements WHERE id = ?", [req.params.id]);
  saveDatabase();
  res.json({ message: 'Publicité supprimée' });
});

router.get('/ads/public', (req, res) => {
  const db = getDb();
  const result = db.exec("SELECT id, title, mediaUrl, mediaType, linkUrl, position FROM advertisements WHERE isActive = 1");
  let ads = [];
  if (result[0]) {
    const columns = result[0].columns;
    ads = result[0].values.map(row => {
      const ad = {};
      columns.forEach((col, i) => { ad[col] = row[i]; });
      return ad;
    });
  }
  res.json(ads);
});

module.exports = router;
