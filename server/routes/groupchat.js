const express = require('express');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get recent messages
router.get('/', authenticate, (req, res) => {
  const data = db.getData();
  if (!data.chatMessages) {
    data.chatMessages = [];
    db.saveData(data);
  }

  // Return last 100 messages
  const messages = data.chatMessages.slice(-100).map(msg => ({
    id: msg.id,
    user_id: msg.user_id,
    user_name: msg.user_name,
    user_role: msg.user_role,
    message: msg.message,
    created_at: msg.created_at
  }));

  res.json(messages);
});

// Send a message
router.post('/', authenticate, (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  if (message.length > 500) {
    return res.status(400).json({ error: 'Message too long (max 500 characters).' });
  }

  const user = db.findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const data = db.getData();
  if (!data.chatMessages) {
    data.chatMessages = [];
  }
  if (!data.nextId.chatMessages) {
    data.nextId.chatMessages = 1;
  }

  const newMessage = {
    id: data.nextId.chatMessages++,
    user_id: user.id,
    user_name: user.name,
    user_role: user.role,
    message: message.trim(),
    created_at: new Date().toISOString()
  };

  data.chatMessages.push(newMessage);

  // Keep only last 500 messages
  if (data.chatMessages.length > 500) {
    data.chatMessages = data.chatMessages.slice(-500);
  }

  db.saveData(data);

  res.status(201).json(newMessage);
});

module.exports = router;
