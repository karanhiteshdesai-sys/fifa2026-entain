const express = require('express');
const { db } = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Admin sends a direct message to a user
router.post('/send', authenticate, requireAdmin, async (req, res) => {
  try {
    const { to_user_id, message } = req.body;
    if (!to_user_id || !message || !message.trim()) {
      return res.status(400).json({ error: 'Recipient and message are required.' });
    }
    if (message.length > 1000) {
      return res.status(400).json({ error: 'Message too long (max 1000 chars).' });
    }

    const recipient = await db.findUserById(Number(to_user_id));
    if (!recipient) return res.status(404).json({ error: 'User not found.' });

    const dm = await db.sendDirectMessage(req.user.id, Number(to_user_id), message.trim());

    // Also create a notification so the user sees it
    await db.createNotification(Number(to_user_id), '✉️ Message from Admin', message.trim().substring(0, 150));

    res.status(201).json(dm);
  } catch (err) {
    console.error('DM send error:', err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// Get conversation between current user and another user
router.get('/conversation/:userId', authenticate, async (req, res) => {
  try {
    const otherUserId = Number(req.params.userId);
    const messages = await db.getConversation(req.user.id, otherUserId);

    // Mark messages as read
    await db.markDirectMessagesRead(req.user.id, otherUserId);

    res.json(messages);
  } catch (err) {
    console.error('DM fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// Get all DM conversations for current user (inbox)
router.get('/inbox', authenticate, async (req, res) => {
  try {
    const messages = await db.getDirectMessages(req.user.id);

    // Group by conversation partner
    const conversations = {};
    for (const msg of messages) {
      const partnerId = msg.from_user_id === req.user.id ? msg.to_user_id : msg.from_user_id;
      const partnerName = msg.from_user_id === req.user.id ? msg.to_name : msg.from_name;
      if (!conversations[partnerId]) {
        conversations[partnerId] = {
          partner_id: partnerId,
          partner_name: partnerName,
          partner_role: msg.from_user_id === req.user.id ? 'user' : msg.from_role,
          last_message: msg.message,
          last_message_at: msg.created_at,
          unread: msg.to_user_id === req.user.id && !msg.read ? 1 : 0
        };
      } else if (msg.to_user_id === req.user.id && !msg.read) {
        conversations[partnerId].unread++;
      }
    }

    res.json(Object.values(conversations));
  } catch (err) {
    console.error('DM inbox error:', err);
    res.status(500).json({ error: 'Failed to fetch inbox.' });
  }
});

// Get unread DM count
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const count = await db.getUnreadDMCount(req.user.id);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// User replies to admin (any authenticated user can reply in an existing conversation)
router.post('/reply', authenticate, async (req, res) => {
  try {
    const { to_user_id, message } = req.body;
    if (!to_user_id || !message || !message.trim()) {
      return res.status(400).json({ error: 'Recipient and message are required.' });
    }
    if (message.length > 1000) {
      return res.status(400).json({ error: 'Message too long (max 1000 chars).' });
    }

    const recipient = await db.findUserById(Number(to_user_id));
    if (!recipient) return res.status(404).json({ error: 'User not found.' });

    const dm = await db.sendDirectMessage(req.user.id, Number(to_user_id), message.trim());

    const sender = await db.findUserById(req.user.id);
    await db.createNotification(Number(to_user_id), `✉️ Reply from ${sender.name}`, message.trim().substring(0, 150));

    res.status(201).json(dm);
  } catch (err) {
    console.error('DM reply error:', err);
    res.status(500).json({ error: 'Failed to send reply.' });
  }
});

module.exports = router;
