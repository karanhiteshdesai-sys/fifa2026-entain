const express = require('express');
const { db, pool } = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { getUserTag, applyOddsBoost } = require('../utils/tags');
const router = express.Router();

// Recalculate match_result odds based on bet distribution
async function adjustOdds(matchId) {
  const match = await db.findMatchById(matchId);
  if (!match) return;

  // Get total stakes per outcome for this match
  const { rows } = await pool.query(
    `SELECT prediction, COALESCE(SUM(stake), 0) as total_stake 
     FROM bets WHERE match_id = $1 AND bet_type = 'match_result' AND status = 'pending'
     GROUP BY prediction`,
    [matchId]
  );

  const stakes = { home: 0, draw: 0, away: 0 };
  rows.forEach(r => { if (stakes.hasOwnProperty(r.prediction)) stakes[r.prediction] = Number(r.total_stake); });

  const totalStake = stakes.home + stakes.draw + stakes.away;
  if (totalStake < 5) return; // Don't adjust until meaningful volume

  // Base odds from the original seeded values (stored as initial reference)
  const baseHome = match.home_odds;
  const baseDraw = match.draw_odds;
  const baseAway = match.away_odds;

  // Calculate implied probabilities from current bets
  // More bets on an outcome = lower odds (shorter price)
  const homeShare = stakes.home / totalStake || 0.33;
  const drawShare = stakes.draw / totalStake || 0.33;
  const awayShare = stakes.away / totalStake || 0.33;

  // Shift factor: odds decrease as more money goes on that outcome
  // Formula: new_odds = base_odds * (1 - shift) where shift is proportional to bet share
  const shiftStrength = 0.3; // How aggressively odds move (0.3 = moderate)

  let newHome = baseHome * (1 - (homeShare - 0.33) * shiftStrength);
  let newDraw = baseDraw * (1 - (drawShare - 0.33) * shiftStrength);
  let newAway = baseAway * (1 - (awayShare - 0.33) * shiftStrength);

  // Clamp odds to reasonable range (minimum 1.1, maximum 30.0)
  newHome = Math.max(1.1, Math.min(30.0, newHome));
  newDraw = Math.max(1.1, Math.min(30.0, newDraw));
  newAway = Math.max(1.1, Math.min(30.0, newAway));

  // Round to 1 decimal
  newHome = Math.round(newHome * 10) / 10;
  newDraw = Math.round(newDraw * 10) / 10;
  newAway = Math.round(newAway * 10) / 10;

  await pool.query(
    'UPDATE matches SET home_odds = $1, draw_odds = $2, away_odds = $3 WHERE id = $4',
    [newHome, newDraw, newAway, matchId]
  );
}

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

    // Apply tag odds boost based on user's referral count
    const { rows: refRows } = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE referred_by = $1 AND status = 'approved'",
      [req.user.id]
    );
    const tagInfo = getUserTag(Number(refRows[0].count));
    if (tagInfo.boost > 0) {
      odds = applyOddsBoost(odds, tagInfo.boost);
    }

    const bet = await db.createBet({ user_id: req.user.id, match_id, bet_type, prediction, stake, odds, status: 'pending', payout: 0 });

    // Adjust odds dynamically after bet is placed (match_result only)
    if (bet_type === 'match_result') {
      await adjustOdds(match_id);
    }

    res.status(201).json({ id: bet.id, match_id, bet_type, prediction, stake, odds, potential_payout: Math.round(stake * odds), status: 'pending' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error.' }); }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const bets = await db.getBetsByUser(req.user.id);
    res.json(bets);
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

router.post('/responsible-gambling-alert', authenticate, async (req, res) => {
  try {
    const user = await db.findUserById(req.user.id);
    // Only notify admins if the user is not an admin themselves
    if (user.role !== 'admin') {
      const { rows: admins } = await pool.query("SELECT id FROM users WHERE role = 'admin'");
      for (const admin of admins) {
        await db.createNotification(
          admin.id,
          '⚠️ Responsible Gambling Alert',
          `${user.name} (${user.email}) is staking 80%+ of their balance (${user.points} EP). Consider blocking or sending a message.`
        );
      }
    }
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

module.exports = router;
