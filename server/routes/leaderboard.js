const express = require('express');
const { db, pool } = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { getUserTag } = require('../utils/tags');
const router = express.Router();

// Main leaderboard (EP + Win Rate)
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

// Referral leaderboard — ranked by number of approved referrals
router.get('/referrals', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.name, u.department, COUNT(r.id) as referral_count
      FROM users u
      LEFT JOIN users r ON r.referred_by = u.id AND r.status = 'approved'
      WHERE u.status = 'approved'
      GROUP BY u.id, u.name, u.department
      HAVING COUNT(r.id) > 0
      ORDER BY referral_count DESC
    `);

    const withTags = rows.map(player => {
      const tagInfo = getUserTag(Number(player.referral_count));
      return {
        id: player.id,
        name: player.name,
        department: player.department,
        referral_count: Number(player.referral_count),
        tag: tagInfo.tag,
        tagEmoji: tagInfo.emoji,
      };
    });

    res.json(withTags);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error.' }); }
});

module.exports = router;
