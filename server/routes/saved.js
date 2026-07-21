const express = require('express');
const { getDb, saveDatabase } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/:jobId', authenticate, authorize('candidate'), (req, res) => {
  try {
    const db = getDb();
    const existing = db.exec("SELECT id FROM saved_jobs WHERE userId = ? AND jobId = ?", [req.user.id, req.params.jobId]);
    if (existing[0] && existing[0].values.length > 0) {
      db.run("DELETE FROM saved_jobs WHERE userId = ? AND jobId = ?", [req.user.id, req.params.jobId]);
      saveDatabase();
      return res.json({ saved: false, message: 'Offre retirée des favoris' });
    }
    db.run("INSERT INTO saved_jobs (userId, jobId) VALUES (?, ?)", [req.user.id, req.params.jobId]);
    saveDatabase();
    res.json({ saved: true, message: 'Offre sauvegardée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/', authenticate, authorize('candidate'), (req, res) => {
  const db = getDb();
  const result = db.exec(
    "SELECT j.*, s.createdAt as savedAt FROM saved_jobs s JOIN jobs j ON s.jobId = j.id WHERE s.userId = ? ORDER BY s.createdAt DESC",
    [req.user.id]
  );
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

router.get('/check/:jobId', authenticate, (req, res) => {
  const db = getDb();
  const result = db.exec("SELECT id FROM saved_jobs WHERE userId = ? AND jobId = ?", [req.user.id, req.params.jobId]);
  res.json({ saved: result[0] && result[0].values.length > 0 });
});

module.exports = router;
