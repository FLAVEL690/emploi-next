const jwt = require('jsonwebtoken');
const { getDb } = require('../database');

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authentification requise' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDb();
    const result = db.exec("SELECT id, firstName, lastName, email, role, company FROM users WHERE id = ?", [decoded.id]);
    if (!result[0] || result[0].values.length === 0) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }
    const row = result[0].values[0];
    req.user = {
      id: row[0],
      firstName: row[1],
      lastName: row[2],
      email: row[3],
      role: row[4],
      company: row[5]
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
