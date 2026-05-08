const express = require('express');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get leaderboard
router.get('/', authenticate, (req, res) => {
  const leaderboard = db.getLeaderboard();
  res.json(leaderboard);
});

module.exports = router;
