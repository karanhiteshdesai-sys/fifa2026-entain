const express = require('express');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { generateExcel } = require('../services/excel');

const router = express.Router();

// Place a bet
router.post('/', authenticate, (req, res) => {
  const { match_id, bet_type, prediction, stake } = req.body;

  if (!match_id || !bet_type || !prediction || !stake) {
    return res.status(400).json({ error: 'match_id, bet_type, prediction, and stake are required.' });
  }

  if (stake <= 0) {
    return res.status(400).json({ error: 'Stake must be positive.' });
  }

  // Check match exists and is upcoming
  const match = db.findMatchById(match_id);
  if (!match) {
    return res.status(404).json({ error: 'Match not found.' });
  }
  if (match.status !== 'upcoming') {
    return res.status(400).json({ error: 'Cannot bet on a match that has already started or finished.' });
  }

  // Check user has enough points
  const user = db.findUserById(req.user.id);
  if (user.points < stake) {
    return res.status(400).json({ error: 'Insufficient Entain Points.' });
  }

  // Determine odds based on prediction
  let odds;
  if (prediction === 'home') odds = match.home_odds;
  else if (prediction === 'draw') odds = match.draw_odds;
  else if (prediction === 'away') odds = match.away_odds;
  else {
    return res.status(400).json({ error: 'Prediction must be home, draw, or away.' });
  }

  // Deduct points and place bet
  db.deductPoints(req.user.id, stake);

  const bet = db.createBet({
    user_id: req.user.id,
    match_id,
    bet_type,
    prediction,
    stake,
    odds,
    status: 'pending',
    payout: 0
  });

  res.status(201).json({
    id: bet.id,
    match_id,
    bet_type,
    prediction,
    stake,
    odds,
    potential_payout: Math.round(stake * odds),
    status: 'pending'
  });

  // Auto-update Excel on new bet
  generateExcel().catch(err => console.error('Excel update failed:', err));
});

// Get user's bets
router.get('/', authenticate, (req, res) => {
  const bets = db.getBetsByUser(req.user.id);
  res.json(bets);
});

module.exports = router;
