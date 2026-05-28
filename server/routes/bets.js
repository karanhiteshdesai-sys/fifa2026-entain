const express = require('express');
const { db, pool } = require('../db/database');
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

    // Betting closes 1 minute before kickoff
    const kickoff = new Date(match.match_date).getTime();
    if (Date.now() >= kickoff - 60000) return res.status(400).json({ error: 'Betting is closed. Bets must be placed at least 1 minute before kickoff.' });

    const user = await db.findUserById(req.user.id);
    if (user.status === 'blocked') return res.status(403).json({ error: 'Your account is blocked. Please contact Karan Desai.' });
    if (user.points < stake) return res.status(400).json({ error: 'Insufficient Entain Points.' });

    let odds;
    if (bet_type === 'match_result') {
      if (prediction === 'home') odds = match.home_odds;
      else if (prediction === 'draw') odds = match.draw_odds;
      else if (prediction === 'away') odds = match.away_odds;
      else return res.status(400).json({ error: 'Prediction must be home, draw, or away.' });
    } else if (bet_type === 'correct_score') {
      if (!/^\d+-\d+$/.test(prediction)) return res.status(400).json({ error: 'Correct score format must be like 2-1.' });
      const [h, a] = prediction.split('-').map(Number);
      if (h > 9 || a > 9) return res.status(400).json({ error: 'Invalid score.' });
      const totalGoals = h + a;
      if (prediction === '0-0') odds = 8.0;
      else if (prediction === '1-0' || prediction === '0-1') odds = 6.0;
      else if (prediction === '1-1') odds = 5.5;
      else if (prediction === '2-1' || prediction === '1-2') odds = 7.0;
      else if (prediction === '2-0' || prediction === '0-2') odds = 7.5;
      else if (totalGoals <= 3) odds = 9.0;
      else if (totalGoals <= 5) odds = 15.0;
      else odds = 25.0;
    } else if (bet_type === 'total_goals') {
      if (!['over_1.5', 'under_1.5', 'over_2.5', 'under_2.5', 'over_3.5', 'under_3.5'].includes(prediction)) {
        return res.status(400).json({ error: 'Invalid total goals prediction.' });
      }
      if (prediction === 'over_1.5') odds = 1.5;
      else if (prediction === 'under_1.5') odds = 2.5;
      else if (prediction === 'over_2.5') odds = 1.9;
      else if (prediction === 'under_2.5') odds = 1.9;
      else if (prediction === 'over_3.5') odds = 2.8;
      else if (prediction === 'under_3.5') odds = 1.4;
    } else if (bet_type === 'both_teams_score') {
      if (!['yes', 'no'].includes(prediction)) return res.status(400).json({ error: 'Prediction must be yes or no.' });
      odds = prediction === 'yes' ? 1.8 : 2.0;
    } else if (bet_type === 'first_to_score') {
      if (!['home', 'away', 'no_goal'].includes(prediction)) return res.status(400).json({ error: 'Prediction must be home, away, or no_goal.' });
      if (prediction === 'home') odds = 1.8;
      else if (prediction === 'away') odds = 2.2;
      else odds = 9.0;
    } else {
      return res.status(400).json({ error: 'Invalid bet type.' });
    }

    await db.deductPoints(req.user.id, stake);

    const bet = await db.createBet({ user_id: req.user.id, match_id, bet_type, prediction, stake, odds, status: 'pending', payout: 0 });

    res.status(201).json({ id: bet.id, bet_number: bet.bet_number, match_id, bet_type, prediction, stake, odds, potential_payout: Math.round(stake * odds), status: 'pending' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error.' }); }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const bets = await db.getBetsByUser(req.user.id);
    res.json(bets);
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

module.exports = router;
