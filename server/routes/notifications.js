const express = require('express');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get user's notifications
router.get('/', authenticate, (req, res) => {
  const data = db.getData();
  if (!data.notifications) return res.json([]);

  const userNotifs = data.notifications
    .filter(n => n.user_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 50);

  res.json(userNotifs);
});

// Get unread count
router.get('/unread-count', authenticate, (req, res) => {
  const data = db.getData();
  if (!data.notifications) return res.json({ count: 0 });

  const count = data.notifications.filter(n => n.user_id === req.user.id && !n.read).length;
  res.json({ count });
});

// Mark all as read
router.post('/mark-read', authenticate, (req, res) => {
  const data = db.getData();
  if (!data.notifications) return res.json({ message: 'Done' });

  data.notifications.forEach(n => {
    if (n.user_id === req.user.id) n.read = true;
  });
  db.saveData(data);
  res.json({ message: 'All notifications marked as read.' });
});

module.exports = router;
