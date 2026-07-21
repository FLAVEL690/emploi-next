const express = require('express');
const { getDb, saveDatabase } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { category, city, country, district, mode, type, search, page = 1, limit = 12 } = req.query;

    let query = "SELECT j.*, u.firstName as recruiterFirstName, u.lastName as recruiterLastName, u.avatar as recruiterAvatar FROM jobs j JOIN users u ON j.recruiterId = u.id WHERE j.isActive = 1 AND j.expiresAt > datetime('now')";
    const params = [];

    if (category) { query += " AND j.category = ?"; params.push(category); }
    if (city) { query += " AND j.city LIKE ?"; params.push(`%${city}%`); }
    if (country) { query += " AND j.country LIKE ?"; params.push(`%${country}%`); }
    if (district) { query += " AND j.district LIKE ?"; params.push(`%${district}%`); }
    if (mode) { query += " AND j.mode = ?"; params.push(mode); }
    if (type) { query += " AND j.type = ?"; params.push(type); }
    if (search) { query += " AND (j.title LIKE ? OR j.description LIKE ? OR j.company LIKE ?)"; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    query += " ORDER BY j.createdAt DESC";

    const countQuery = query.replace(/SELECT.*FROM/, "SELECT COUNT(*) as total FROM");
    const countResult = db.exec(countQuery, params);
    const total = countResult[0] ? countResult[0].values[0][0] : 0;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const result = db.exec(query, params);
    let jobs = [];
    if (result[0]) {
      const columns = result[0].columns;
      jobs = result[0].values.map(row => {
        const job = {};
        columns.forEach((col, i) => { job[col] = row[i]; });
        return job;
      });
    }

    res.json({ jobs, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/categories', (req, res) => {
  const db = getDb();
  const result = db.exec("SELECT * FROM categories ORDER BY name");
  let categories = [];
  if (result[0]) {
    categories = result[0].values.map(row => ({ id: row[0], name: row[1], icon: row[2] }));
  }
  res.json(categories);
});

router.get('/stats', (req, res) => {
  const db = getDb();
  const jobCount = db.exec("SELECT COUNT(*) FROM jobs WHERE isActive = 1 AND expiresAt > datetime('now')");
  const companyCount = db.exec("SELECT COUNT(DISTINCT company) FROM jobs WHERE isActive = 1");
  const candidateCount = db.exec("SELECT COUNT(*) FROM users WHERE role = 'candidate'");
  const applicationCount = db.exec("SELECT COUNT(*) FROM applications");

  res.json({
    jobs: jobCount[0] ? jobCount[0].values[0][0] : 0,
    companies: companyCount[0] ? companyCount[0].values[0][0] : 0,
    candidates: candidateCount[0] ? candidateCount[0].values[0][0] : 0,
    applications: applicationCount[0] ? applicationCount[0].values[0][0] : 0
  });
});

router.get('/recruiter/my-jobs', authenticate, authorize('recruiter', 'admin'), (req, res) => {
  try {
    const db = getDb();
    const result = db.exec(
      "SELECT j.*, (SELECT COUNT(*) FROM applications WHERE jobId = j.id) as applicationCount FROM jobs j WHERE j.recruiterId = ? ORDER BY j.createdAt DESC",
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
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const result = db.exec(
      "SELECT j.*, u.firstName as recruiterFirstName, u.lastName as recruiterLastName, u.email as recruiterEmail, u.company as recruiterCompany, u.avatar as recruiterAvatar FROM jobs j JOIN users u ON j.recruiterId = u.id WHERE j.id = ?",
      [req.params.id]
    );

    if (!result[0] || result[0].values.length === 0) {
      return res.status(404).json({ message: 'Offre non trouvée' });
    }

    const columns = result[0].columns;
    const row = result[0].values[0];
    const job = {};
    columns.forEach((col, i) => { job[col] = row[i]; });

    db.run("UPDATE jobs SET views = views + 1 WHERE id = ?", [req.params.id]);
    saveDatabase();

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.post('/', authenticate, authorize('recruiter', 'admin'), (req, res) => {
  try {
    const { title, description, category, type, mode, salary, country, city, district, requirements, benefits, experienceLevel, expiresAt } = req.body;

    if (!title || !description || !category || !type || !mode || !country || !city || !expiresAt) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' });
    }

    const db = getDb();
    const company = req.user.company || req.body.company || 'EmploiPro';

    db.run(
      "INSERT INTO jobs (recruiterId, title, description, company, category, type, mode, salary, country, city, district, requirements, benefits, experienceLevel, expiresAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [req.user.id, title, description, company, category, type, mode, salary || null, country, city, district || null, requirements || null, benefits || null, experienceLevel || 'any', expiresAt]
    );
    saveDatabase();

    const newJob = db.exec("SELECT last_insert_rowid()");
    const jobId = newJob[0].values[0][0];

    res.status(201).json({ message: 'Offre publiée avec succès', jobId });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.put('/:id', authenticate, authorize('recruiter', 'admin'), (req, res) => {
  try {
    const db = getDb();
    const existing = db.exec("SELECT recruiterId FROM jobs WHERE id = ?", [req.params.id]);
    if (!existing[0] || existing[0].values.length === 0) {
      return res.status(404).json({ message: 'Offre non trouvée' });
    }

    if (req.user.role !== 'admin' && existing[0].values[0][0] !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const { title, description, category, type, mode, salary, country, city, district, requirements, benefits, experienceLevel, expiresAt, isActive } = req.body;

    db.run(
      "UPDATE jobs SET title=?, description=?, category=?, type=?, mode=?, salary=?, country=?, city=?, district=?, requirements=?, benefits=?, experienceLevel=?, expiresAt=?, isActive=?, updatedAt=datetime('now') WHERE id=?",
      [title, description, category, type, mode, salary, country, city, district, requirements, benefits, experienceLevel, expiresAt, isActive !== undefined ? isActive : 1, req.params.id]
    );
    saveDatabase();

    res.json({ message: 'Offre mise à jour' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.delete('/:id', authenticate, authorize('recruiter', 'admin'), (req, res) => {
  try {
    const db = getDb();
    const existing = db.exec("SELECT recruiterId FROM jobs WHERE id = ?", [req.params.id]);
    if (!existing[0] || existing[0].values.length === 0) {
      return res.status(404).json({ message: 'Offre non trouvée' });
    }

    if (req.user.role !== 'admin' && existing[0].values[0][0] !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    db.run("DELETE FROM applications WHERE jobId = ?", [req.params.id]);
    db.run("DELETE FROM saved_jobs WHERE jobId = ?", [req.params.id]);
    db.run("DELETE FROM jobs WHERE id = ?", [req.params.id]);
    saveDatabase();

    res.json({ message: 'Offre supprimée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
