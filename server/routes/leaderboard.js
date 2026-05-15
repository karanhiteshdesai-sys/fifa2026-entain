const express = require('express');
const { db, pool } = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { getUserTag } = require('../utils/tags');
const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const leaderboard = await db.getLeaderboard();

    // Add tag info for each player
    const withTags = await Promise.all(leaderboard.map(async (player) => {
      const { rows } = await pool.query(
        "SELECT COUNT(*) as count FROM users WHERE referred_by = $1 AND status = 'approved'",
        [player.id]
      );
      const tagInfo = getUserTag(Number(rows[0].count));
      return { ...player, tag: tagInfo.tag, tagEmoji: tagInfo.emoji };
    }));

    res.json(withTags);
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

module.exports = router;
