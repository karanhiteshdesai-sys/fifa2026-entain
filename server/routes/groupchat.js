const express = require('express');
const { db } = require('../db/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try { res.json(await db.getChatMessages()); } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: 'Message cannot be empty.' });
    if (message.length > 500) return res.status(400).json({ error: 'Message too long.' });

    const user = await db.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

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
