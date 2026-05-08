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

// Reset user points (admin)
router.post('/users/:id/reset-points', authenticate, requireAdmin, (req, res) => {
  const { points } = req.body;
  const userId = Number(req.params.id);
  db.updateUserPoints(userId, points || 20);
  res.json({ message: 'Points reset successfully.' });
});

module.exports = router;
