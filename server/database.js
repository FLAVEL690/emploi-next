const initSQL = require('sql.js');
const path = require('path');
const fs = require('fs');

let db = null;
const DB_PATH = path.join(__dirname, 'emploi.db');

async function initDatabase() {
  const SQL = await initSQL();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin','recruiter','candidate')),
    company TEXT,
    phone TEXT,
    avatar TEXT,
    cv TEXT,
    bio TEXT,
    city TEXT,
    country TEXT,
    isVerified INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recruiterId INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    company TEXT NOT NULL,
    category TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('full-time','part-time','contract','internship','freelance')),
    mode TEXT NOT NULL CHECK(mode IN ('on-site','remote','hybrid')),
    salary TEXT,
    country TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT,
    requirements TEXT,
    benefits TEXT,
    experienceLevel TEXT CHECK(experienceLevel IN ('junior','mid','senior','any')),
    expiresAt TEXT NOT NULL,
    isActive INTEGER DEFAULT 1,
    views INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (recruiterId) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jobId INTEGER NOT NULL,
    candidateId INTEGER NOT NULL,
    coverLetter TEXT,
    cv TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','reviewed','shortlisted','rejected','accepted')),
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (jobId) REFERENCES jobs(id),
    FOREIGN KEY (candidateId) REFERENCES users(id),
    UNIQUE(jobId, candidateId)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    relatedId INTEGER,
    isRead INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS advertisements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    mediaUrl TEXT NOT NULL,
    mediaType TEXT DEFAULT 'image' CHECK(mediaType IN ('image','video')),
    linkUrl TEXT,
    position TEXT DEFAULT 'banner' CHECK(position IN ('banner','sidebar','inline')),
    isActive INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS saved_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    jobId INTEGER NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (jobId) REFERENCES jobs(id),
    UNIQUE(userId, jobId)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    icon TEXT
  )`);

  const categories = [
    'Informatique & Tech', 'Marketing & Communication', 'Finance & Comptabilité',
    'Ressources Humaines', 'Commercial & Vente', 'Santé & Médical',
    'Éducation & Formation', 'Ingénierie', 'Design & Créatif',
    'Logistique & Transport', 'Juridique', 'Hôtellerie & Restauration',
    'BTP & Construction', 'Agriculture', 'Autre'
  ];

  const existingCats = db.exec("SELECT COUNT(*) as count FROM categories");
  if (existingCats[0] && existingCats[0].values[0][0] === 0) {
    categories.forEach(cat => {
      db.run("INSERT OR IGNORE INTO categories (name) VALUES (?)", [cat]);
    });
  }

  const adminExists = db.exec("SELECT COUNT(*) FROM users WHERE role = 'admin'");
  if (adminExists[0] && adminExists[0].values[0][0] === 0) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.run(
      "INSERT INTO users (firstName, lastName, email, password, role, isVerified) VALUES (?, ?, ?, ?, ?, ?)",
      ['Admin', 'Platform', 'admin@emploi.com', hashedPassword, 'admin', 1]
    );
  }

  saveDatabase();
  return db;
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

function getDb() {
  return db;
}

module.exports = { initDatabase, getDb, saveDatabase };
