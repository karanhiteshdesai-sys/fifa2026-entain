const express = require('express');
const { db } = require('../db/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const leaderboard = await db.getLeaderboard();
    res.json(leaderboard);
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

module.exports = router;
