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

// Referral tree — user sees their own tree, admin sees everyone's
router.get('/referral-tree', authenticate, async (req, res) => {
  try {
    const user = await db.findUserById(req.user.id);
    const isAdmin = user.role === 'admin';

    if (isAdmin) {
      // Admin: get full referral tree for all users (include admin to avoid "Unknown")
      const { rows } = await pool.query(`
        SELECT id, name, department, referred_by, status, role, created_at
        FROM users
        ORDER BY created_at ASC
      `);

      // Build tree: recursively find children of a given parent
      const buildTree = (parentId) => {
        return rows
          .filter(u => u.referred_by === parentId && u.status === 'approved' && u.role !== 'admin')
          .map(u => ({
            id: u.id,
            name: u.name,
            department: u.department,
            joined: u.created_at,
            children: buildTree(u.id)
          }));
      };

      // Find all users who have referred someone (root referrers)
      const referredUserIds = rows.filter(u => u.referred_by && u.status === 'approved' && u.role !== 'admin').map(u => u.referred_by);
      const uniqueReferrerIds = [...new Set(referredUserIds)];

      // Root nodes: referrers who were NOT referred by anyone else (top of the chain)
      const rootIds = uniqueReferrerIds.filter(id => {
        const u = rows.find(r => r.id === id);
        return u && !u.referred_by;
      });

      const tree = rootIds.map(id => {
        const rootUser = rows.find(u => u.id === id);
        return {
          id,
          name: rootUser.id === req.user.id ? rootUser.name + ' (You)' : rootUser.name,
          department: rootUser.department,
          joined: rootUser.created_at,
          children: buildTree(id)
        };
      });

      const totalReferrals = rows.filter(u => u.referred_by && u.status === 'approved' && u.role !== 'admin').length;
      res.json({ tree, totalReferrals });
    } else {
      // Regular user: only their own referral tree
      const { rows } = await pool.query(`
        SELECT id, name, department, referred_by, status, created_at
        FROM users WHERE status = 'approved'
        ORDER BY created_at ASC
      `);

      const buildTree = (parentId) => {
        return rows
          .filter(u => u.referred_by === parentId)
          .map(u => ({
            id: u.id,
            name: u.name,
            department: u.department,
            joined: u.created_at,
            children: buildTree(u.id)
          }));
      };

      const tree = [{
        id: user.id,
        name: user.name + ' (You)',
        department: user.department,
        joined: user.created_at,
        children: buildTree(user.id)
      }];

      const countNodes = (nodes) => nodes.reduce((sum, n) => sum + 1 + countNodes(n.children), 0);
      const totalReferrals = countNodes(tree[0].children);

      res.json({ tree, totalReferrals });
    }
  } catch (err) { console.error('Referral tree error:', err); res.status(500).json({ error: 'Server error.' }); }
});

module.exports = router;
