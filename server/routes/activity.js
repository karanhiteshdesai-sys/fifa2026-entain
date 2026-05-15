const express = require('express');
const { db, pool } = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// In-memory activity tracking (resets on server restart)
const activeUsers = new Map(); // userId -> { name, email, lastSeen, currentPage }

// Client heartbeat — called every 30s by logged-in users
router.post('/heartbeat', authenticate, async (req, res) => {
  try {
    const { page } = req.body;
    const user = await db.findUserById(req.user.id);
    if (!user) return res.json({ ok: true });

    activeUsers.set(req.user.id, {
      id: req.user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastSeen: Date.now(),
      currentPage: page || 'unknown'
    });

    res.json({ ok: true });
  } catch (err) {
    res.json({ ok: true }); // Don't fail the client
  }
});

// Admin: get activity stats
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const now = Date.now();
    const ACTIVE_THRESHOLD = 60000; // 60 seconds — if no heartbeat in 60s, user is offline

    // Clean stale entries
    for (const [userId, data] of activeUsers) {
      if (now - data.lastSeen > 5 * 60 * 1000) { // Remove after 5 min inactive
        activeUsers.delete(userId);
      }
    }

    // Active users (heartbeat within last 60s)
    const onlineUsers = [];
    for (const [userId, data] of activeUsers) {
      if (now - data.lastSeen <= ACTIVE_THRESHOLD) {
        onlineUsers.push({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          currentPage: data.currentPage,
          lastSeen: data.lastSeen
        });
      }
    }

    // Page breakdown
    const pageBreakdown = {};
    for (const user of onlineUsers) {
      const page = user.currentPage || 'unknown';
      pageBreakdown[page] = (pageBreakdown[page] || 0) + 1;
    }

    // DB stats
    const [totalUsersRes, approvedUsersRes, totalBetsRes, pendingBetsRes, todayBetsRes, todayLoginsRes] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users WHERE role != $1', ['admin']),
      pool.query("SELECT COUNT(*) as count FROM users WHERE role != $1 AND status = 'approved'", ['admin']),
      pool.query('SELECT COUNT(*) as count FROM bets'),
      pool.query("SELECT COUNT(*) as count FROM bets WHERE status = 'pending'"),
      pool.query("SELECT COUNT(*) as count FROM bets WHERE created_at > NOW() - INTERVAL '24 hours'"),
      pool.query("SELECT COUNT(DISTINCT user_id) as count FROM bets WHERE created_at > NOW() - INTERVAL '24 hours'")
    ]);

    // Users who have placed bets (all time)
    const bettingUsersRes = await pool.query('SELECT COUNT(DISTINCT user_id) as count FROM bets');

    // Recent bets (last 10)
    const recentBetsRes = await pool.query(`
      SELECT b.id, b.stake, b.prediction, b.created_at, u.name as user_name, m.home_team, m.away_team
      FROM bets b
      JOIN users u ON b.user_id = u.id
      JOIN matches m ON b.match_id = m.id
      ORDER BY b.created_at DESC
      LIMIT 10
    `);

    res.json({
      online: {
        count: onlineUsers.length,
        users: onlineUsers,
        pageBreakdown
      },
      stats: {
        totalUsers: Number(totalUsersRes.rows[0].count),
        approvedUsers: Number(approvedUsersRes.rows[0].count),
        totalBets: Number(totalBetsRes.rows[0].count),
        pendingBets: Number(pendingBetsRes.rows[0].count),
        betsToday: Number(todayBetsRes.rows[0].count),
        activeBettorsToday: Number(todayLoginsRes.rows[0].count),
        totalBettingUsers: Number(bettingUsersRes.rows[0].count)
      },
      recentBets: recentBetsRes.rows
    });
  } catch (err) {
    console.error('Activity stats error:', err);
    res.status(500).json({ error: 'Failed to fetch activity stats.' });
  }
});

module.exports = router;
