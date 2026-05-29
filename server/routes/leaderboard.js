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
      // Admin: get full referral tree for all users
      const { rows } = await pool.query(`
        SELECT id, name, department, referred_by, status, created_at
        FROM users WHERE role != 'admin'
        ORDER BY created_at ASC
      `);

      // Build tree: root nodes are users with no referrer
      const buildTree = (parentId) => {
        return rows
          .filter(u => u.referred_by === parentId && u.status === 'approved')
          .map(u => ({
            id: u.id,
            name: u.name,
            department: u.department,
            joined: u.created_at,
            children: buildTree(u.id)
          }));
      };

      // Root nodes: users who referred others but weren't referred themselves, OR top-level referrers
      const referrers = [...new Set(rows.filter(u => u.referred_by).map(u => u.referred_by))];
      const rootIds = referrers.filter(id => {
        const user = rows.find(u => u.id === id);
        return !user || !user.referred_by;
      });

      const tree = rootIds.map(id => {
        const rootUser = rows.find(u => u.id === id);
        return {
          id,
          name: rootUser ? rootUser.name : 'Unknown',
          department: rootUser ? rootUser.department : '',
          joined: rootUser ? rootUser.created_at : null,
          children: buildTree(id)
        };
      });

      // Also include users who have referrals but are admin
      const adminReferrals = buildTree(req.user.id);
      if (adminReferrals.length > 0) {
        tree.unshift({
          id: req.user.id,
          name: user.name + ' (You)',
          department: user.department,
          joined: user.created_at,
          children: adminReferrals
        });
      }

      res.json({ tree, totalReferrals: rows.filter(u => u.referred_by && u.status === 'approved').length });
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
