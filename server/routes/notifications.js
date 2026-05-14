const express = require('express');
const { db } = require('../db/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try { res.json(await db.getNotifications(req.user.id)); } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

router.get('/unread-count', authenticate, async (req, res) => {
  try { res.json({ count: await db.getUnreadCount(req.user.id) }); } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

router.post('/mark-read', authenticate, async (req, res) => {
  try { await db.markNotificationsRead(req.user.id); res.json({ message: 'Done' }); } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

router.get('/broadcast/latest', authenticate, async (req, res) => {
  try {
    const since = req.query.since || new Date(0).toISOString();
    const broadcast = await db.getLatestBroadcast(since);
    res.json({ broadcast });
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

module.exports = router;
