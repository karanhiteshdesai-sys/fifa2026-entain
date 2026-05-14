const express = require('express');
const { db } = require('../db/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// In-memory typing indicators (ephemeral, no DB needed)
const typingUsers = {}; // { userId: { name, timestamp } }

router.get('/', authenticate, async (req, res) => {
  try { res.json(await db.getChatMessages()); } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

router.post('/typing', authenticate, async (req, res) => {
  try {
    const user = await db.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    typingUsers[user.id] = { name: user.name, role: user.role, timestamp: Date.now() };
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

router.get('/typing', authenticate, (req, res) => {
  // Return users who typed in the last 3 seconds (excluding current user)
  const now = Date.now();
  const active = Object.entries(typingUsers)
    .filter(([id, data]) => Number(id) !== req.user.id && (now - data.timestamp) < 3000)
    .map(([, data]) => ({ name: data.name, role: data.role }));
  res.json(active);
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: 'Message cannot be empty.' });
    if (message.length > 500) return res.status(400).json({ error: 'Message too long.' });

    const user = await db.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Clear typing indicator when message is sent
    delete typingUsers[user.id];

    const msg = await db.createChatMessage({ user_id: user.id, user_name: user.name, user_role: user.role, message: message.trim() });

    // Notify all other users about the new message
    const allUsers = await db.getAllUsers();
    for (const u of allUsers) {
      if (u.id !== user.id) {
        await db.createNotification(u.id, `💬 ${user.name}`, message.trim().substring(0, 100));
      }
    }

    res.status(201).json(msg);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error.' }); }
});

module.exports = router;
