const express = require('express');
const db = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { generateExcel } = require('../services/excel');

const router = express.Router();

// Update match result and settle bets
router.put('/matches/:id/result', authenticate, requireAdmin, (req, res) => {
  const { home_score, away_score } = req.body;
  const matchId = Number(req.params.id);

  if (home_score === undefined || away_score === undefined) {
    return res.status(400).json({ error: 'home_score and away_score are required.' });
  }

  const match = db.findMatchById(matchId);
  if (!match) {
    return res.status(404).json({ error: 'Match not found.' });
  }

  // Determine result
  let result;
  if (home_score > away_score) result = 'home';
  else if (home_score < away_score) result = 'away';
  else result = 'draw';

  // Update match
  db.updateMatch(matchId, {
    home_score: Number(home_score),
    away_score: Number(away_score),
    status: 'finished'
  });

  // Settle bets
  const bets = db.getPendingBetsByMatch(matchId);

  for (const bet of bets) {
    if (bet.prediction === result) {
      const payout = Math.round(bet.stake * bet.odds);
      db.updateBet(bet.id, { status: 'won', payout });
      db.addPoints(bet.user_id, payout);
    } else {
      db.updateBet(bet.id, { status: 'lost', payout: 0 });
    }
  }

  res.json({
    message: `Match settled. ${bets.length} bets processed.`,
    result,
    home_score,
    away_score
  });

  // Auto-update Excel after settling
  generateExcel().catch(err => console.error('Excel update failed:', err));
});

// Get all users (admin)
router.get('/users', authenticate, requireAdmin, (req, res) => {
  const users = db.getAllUsers();
  res.json(users);
});

// Get pending registrations (admin)
router.get('/pending-users', authenticate, requireAdmin, (req, res) => {
  const data = db.getData();
  const pending = data.users
    .filter(u => u.status === 'pending')
    .map(({ password, ...rest }) => rest);
  res.json(pending);
});

// Approve a user (admin)
router.post('/users/:id/approve', authenticate, requireAdmin, (req, res) => {
  const userId = Number(req.params.id);
  db.updateUserStatus(userId, 'approved');
  res.json({ message: 'User approved successfully.' });
  generateExcel().catch(err => console.error('Excel update failed:', err));
});

// Reject a user (admin)
router.post('/users/:id/reject', authenticate, requireAdmin, (req, res) => {
  const userId = Number(req.params.id);
  db.updateUserStatus(userId, 'rejected');
  res.json({ message: 'User rejected.' });
});

// Get all bets (admin) - see everyone's bets
router.get('/bets', authenticate, requireAdmin, (req, res) => {
  const data = db.getData();
  const bets = data.bets.map(bet => {
    const user = data.users.find(u => u.id === bet.user_id);
    const match = data.matches.find(m => m.id === bet.match_id);
    return {
      ...bet,
      user_name: user?.name || 'Unknown',
      user_email: user?.email || 'Unknown',
      home_team: match?.home_team,
      away_team: match?.away_team,
      match_date: match?.match_date,
      group_name: match?.group_name
    };
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(bets);
});

// Reset user points (admin)
router.post('/users/:id/reset-points', authenticate, requireAdmin, (req, res) => {
  const { points } = req.body;
  const userId = Number(req.params.id);
  db.updateUserPoints(userId, points || 20);
  res.json({ message: 'Points reset successfully.' });
});

// Reset user password (admin)
router.post('/users/:id/reset-password', authenticate, requireAdmin, (req, res) => {
  const { newPassword } = req.body;
  const userId = Number(req.params.id);

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  const bcrypt = require('bcryptjs');
  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  db.updateUserPassword(userId, hashedPassword);
  res.json({ message: 'Password reset successfully.' });
});

module.exports = router;
