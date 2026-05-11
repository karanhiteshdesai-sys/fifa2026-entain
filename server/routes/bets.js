const express = require('express');
const { db } = require('../db/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.post('/', authenticate, async (req, res) => {
  try {
    const { match_id, bet_type, prediction, stake } = req.body;
    if (!match_id || !bet_type || !prediction || !stake) return res.status(400).json({ error: 'All fields required.' });
    if (stake <= 0) return res.status(400).json({ error: 'Stake must be positive.' });

    const match = await db.findMatchById(match_id);
    if (!match) return res.status(404).json({ error: 'Match not found.' });
    if (match.status !== 'upcoming') return res.status(400).json({ error: 'Cannot bet on a match that has already started or finished.' });

    const user = await db.findUserById(req.user.id);
    if (user.points < stake) return res.status(400).json({ error: 'Insufficient Entain Points.' });

    let odds;
    if (prediction === 'home') odds = match.home_odds;
    else if (prediction === 'draw') odds = match.draw_odds;
    else if (prediction === 'away') odds = match.away_odds;
    else return res.status(400).json({ error: 'Prediction must be home, draw, or away.' });

    await db.deductPoints(req.user.id, stake);
    const bet = await db.createBet({ user_id: req.user.id, match_id, bet_type, prediction, stake, odds, status: 'pending', payout: 0 });

    res.status(201).json({ id: bet.id, match_id, bet_type, prediction, stake, odds, potential_payout: Math.round(stake * odds), status: 'pending' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error.' }); }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const bets = await db.getBetsByUser(req.user.id);
    res.json(bets);
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

module.exports = router;
