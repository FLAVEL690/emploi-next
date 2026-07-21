const express = require('express');
const { getDb, saveDatabase } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');
const { sendNotificationEmail } = require('../emailService');

const router = express.Router();

router.post('/', authenticate, authorize('candidate'), (req, res) => {
  try {
    const { jobId, coverLetter } = req.body;
    const db = getDb();

    const job = db.exec("SELECT j.*, u.email as recruiterEmail, u.firstName as recruiterFirstName FROM jobs j JOIN users u ON j.recruiterId = u.id WHERE j.id = ? AND j.isActive = 1 AND j.expiresAt > datetime('now')", [jobId]);
    if (!job[0] || job[0].values.length === 0) {
      return res.status(404).json({ message: "Cette offre n'est plus disponible" });
    }

    const existing = db.exec("SELECT id FROM applications WHERE jobId = ? AND candidateId = ?", [jobId, req.user.id]);
    if (existing[0] && existing[0].values.length > 0) {
      return res.status(400).json({ message: 'Vous avez déjà postulé à cette offre' });
    }

    const candidate = db.exec("SELECT cv FROM users WHERE id = ?", [req.user.id]);
    const cv = candidate[0] ? candidate[0].values[0][0] : null;

    db.run(
      "INSERT INTO applications (jobId, candidateId, coverLetter, cv) VALUES (?, ?, ?, ?)",
      [jobId, req.user.id, coverLetter || null, cv]
    );

    const jobColumns = job[0].columns;
    const jobRow = job[0].values[0];
    const jobData = {};
    jobColumns.forEach((col, i) => { jobData[col] = jobRow[i]; });

    db.run(
      "INSERT INTO notifications (userId, type, message, relatedId) VALUES (?, ?, ?, ?)",
      [jobData.recruiterId, 'new_application', `Nouvelle candidature pour "${jobData.title}" de ${req.user.firstName} ${req.user.lastName}`, jobId]
    );

    saveDatabase();

    sendNotificationEmail(
      jobData.recruiterEmail,
      'Nouvelle candidature reçue',
      `Bonjour ${jobData.recruiterFirstName},\n\nVous avez reçu une nouvelle candidature pour le poste "${jobData.title}" de la part de ${req.user.firstName} ${req.user.lastName}.\n\nConnectez-vous à votre dashboard pour la consulter.\n\nCordialement,\nL'équipe EmploiPro`
    );

    res.status(201).json({ message: 'Candidature envoyée avec succès' });
  } catch (error) {
    console.error('Apply error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/my-applications', authenticate, authorize('candidate'), (req, res) => {
  try {
    const db = getDb();
    const result = db.exec(
      "SELECT a.*, j.title, j.company, j.city, j.country, j.type, j.mode FROM applications a JOIN jobs j ON a.jobId = j.id WHERE a.candidateId = ? ORDER BY a.createdAt DESC",
      [req.user.id]
    );

    let applications = [];
    if (result[0]) {
      const columns = result[0].columns;
      applications = result[0].values.map(row => {
        const app = {};
        columns.forEach((col, i) => { app[col] = row[i]; });
        return app;
      });
    }
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/job/:jobId', authenticate, authorize('recruiter', 'admin'), (req, res) => {
  try {
    const db = getDb();
    const job = db.exec("SELECT recruiterId FROM jobs WHERE id = ?", [req.params.jobId]);
    if (!job[0] || job[0].values.length === 0) {
      return res.status(404).json({ message: 'Offre non trouvée' });
    }
    if (req.user.role !== 'admin' && job[0].values[0][0] !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const result = db.exec(
      "SELECT a.*, u.firstName, u.lastName, u.email, u.phone, u.cv as userCv, u.city, u.country, u.bio FROM applications a JOIN users u ON a.candidateId = u.id WHERE a.jobId = ? ORDER BY a.createdAt DESC",
      [req.params.jobId]
    );

    let applications = [];
    if (result[0]) {
      const columns = result[0].columns;
      applications = result[0].values.map(row => {
        const app = {};
        columns.forEach((col, i) => { app[col] = row[i]; });
        return app;
      });
    }
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.put('/:id/status', authenticate, authorize('recruiter', 'admin'), (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'reviewed', 'shortlisted', 'rejected', 'accepted'].includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    const db = getDb();
    db.run("UPDATE applications SET status=?, updatedAt=datetime('now') WHERE id=?", [status, req.params.id]);

    const app = db.exec("SELECT candidateId, jobId FROM applications WHERE id = ?", [req.params.id]);
    if (app[0] && app[0].values.length > 0) {
      const candidateId = app[0].values[0][0];
      const jobId = app[0].values[0][1];
      const job = db.exec("SELECT title FROM jobs WHERE id = ?", [jobId]);
      const jobTitle = job[0] ? job[0].values[0][0] : '';

      const statusMessages = {
        reviewed: 'a été consultée',
        shortlisted: 'a été présélectionnée',
        rejected: "n'a pas été retenue",
        accepted: 'a été acceptée'
      };

      if (statusMessages[status]) {
        db.run(
          "INSERT INTO notifications (userId, type, message, relatedId) VALUES (?, ?, ?, ?)",
          [candidateId, 'application_update', `Votre candidature pour "${jobTitle}" ${statusMessages[status]}`, jobId]
        );
      }
    }

    saveDatabase();
    res.json({ message: 'Statut mis à jour' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
