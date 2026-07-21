const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb, saveDatabase } = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, company, phone, city, country } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis' });
    }

    if (!['candidate', 'recruiter'].includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide' });
    }

    if (role === 'recruiter' && !company) {
      return res.status(400).json({ message: "Le nom de l'entreprise est requis pour les recruteurs" });
    }

    const db = getDb();
    const existing = db.exec("SELECT id FROM users WHERE email = ?", [email]);
    if (existing[0] && existing[0].values.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      "INSERT INTO users (firstName, lastName, email, password, role, company, phone, city, country, isVerified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [firstName, lastName, email, hashedPassword, role, company || null, phone || null, city || null, country || null, 1]
    );
    saveDatabase();

    const newUser = db.exec("SELECT id, firstName, lastName, email, role, company FROM users WHERE email = ?", [email]);
    const row = newUser[0].values[0];

    const token = jwt.sign({ id: row[0], role: row[4] }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Inscription réussie',
      token,
      user: { id: row[0], firstName: row[1], lastName: row[2], email: row[3], role: row[4], company: row[5] }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    const db = getDb();
    const result = db.exec("SELECT * FROM users WHERE email = ?", [email]);

    if (!result[0] || result[0].values.length === 0) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const columns = result[0].columns;
    const row = result[0].values[0];
    const user = {};
    columns.forEach((col, i) => { user[col] = row[i]; });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        company: user.company,
        phone: user.phone,
        avatar: user.avatar,
        bio: user.bio,
        city: user.city,
        country: user.country
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/me', authenticate, (req, res) => {
  const db = getDb();
  const result = db.exec("SELECT id, firstName, lastName, email, role, company, phone, avatar, bio, city, country, cv FROM users WHERE id = ?", [req.user.id]);
  if (!result[0] || result[0].values.length === 0) {
    return res.status(404).json({ message: 'Utilisateur non trouvé' });
  }
  const columns = result[0].columns;
  const row = result[0].values[0];
  const user = {};
  columns.forEach((col, i) => { user[col] = row[i]; });
  res.json(user);
});

router.put('/profile', authenticate, async (req, res) => {
  try {
    const { firstName, lastName, phone, bio, city, country, company } = req.body;
    const db = getDb();
    db.run(
      "UPDATE users SET firstName=?, lastName=?, phone=?, bio=?, city=?, country=?, company=?, updatedAt=datetime('now') WHERE id=?",
      [firstName, lastName, phone || null, bio || null, city || null, country || null, company || null, req.user.id]
    );
    saveDatabase();
    res.json({ message: 'Profil mis à jour' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const db = getDb();
    const result = db.exec("SELECT password FROM users WHERE id = ?", [req.user.id]);
    const storedPassword = result[0].values[0][0];

    const isMatch = await bcrypt.compare(currentPassword, storedPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.run("UPDATE users SET password=?, updatedAt=datetime('now') WHERE id=?", [hashedPassword, req.user.id]);
    saveDatabase();
    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
