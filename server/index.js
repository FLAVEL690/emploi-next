require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const { initDatabase, getDb, saveDatabase } = require('./database');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const savedRoutes = require('./routes/saved');

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/saved', savedRoutes);

app.get('/api/ads/public', (req, res) => {
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

cron.schedule('0 * * * *', () => {
  try {
    const db = getDb();
    db.run("UPDATE jobs SET isActive = 0 WHERE expiresAt <= datetime('now') AND isActive = 1");
    saveDatabase();
    console.log('Expired jobs deactivated');
  } catch (error) {
    console.error('Cron error:', error);
  }
});

const PORT = process.env.PORT || 5000;

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
