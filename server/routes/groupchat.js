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
    res.status(201).json(msg);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error.' }); }
});

module.exports = router;
