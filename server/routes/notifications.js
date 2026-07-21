const express = require('express');
const { getDb, saveDatabase } = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const db = getDb();
  const result = db.exec(
    "SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 50",
    [req.user.id]
  );
  let notifications = [];
  if (result[0]) {
    const columns = result[0].columns;
    notifications = result[0].values.map(row => {
      const n = {};
      columns.forEach((col, i) => { n[col] = row[i]; });
      return n;
    });
  }
  res.json(notifications);
});

router.get('/unread-count', authenticate, (req, res) => {
  const db = getDb();
  const result = db.exec("SELECT COUNT(*) FROM notifications WHERE userId = ? AND isRead = 0", [req.user.id]);
  const count = result[0] ? result[0].values[0][0] : 0;
  res.json({ count });
});

router.put('/read-all', authenticate, (req, res) => {
  const db = getDb();
  db.run("UPDATE notifications SET isRead = 1 WHERE userId = ?", [req.user.id]);
  saveDatabase();
  res.json({ message: 'Toutes les notifications marquées comme lues' });
});

router.put('/:id/read', authenticate, (req, res) => {
  const db = getDb();
  db.run("UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?", [req.params.id, req.user.id]);
  saveDatabase();
  res.json({ message: 'Notification marquée comme lue' });
});

module.exports = router;
