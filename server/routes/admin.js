const express = require('express');
const bcrypt = require('bcryptjs');
const { db, pool } = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.put('/matches/:id/result', authenticate, requireAdmin, async (req, res) => {
  try {
    const { home_score, away_score } = req.body;
    const matchId = Number(req.params.id);
    if (home_score === undefined || away_score === undefined) return res.status(400).json({ error: 'Scores required.' });

    const match = await db.findMatchById(matchId);
    if (!match) return res.status(404).json({ error: 'Match not found.' });

    let result = home_score > away_score ? 'home' : home_score < away_score ? 'away' : 'draw';
    await db.updateMatch(matchId, { home_score: Number(home_score), away_score: Number(away_score), status: 'finished' });

    const bets = await db.getPendingBetsByMatch(matchId);
    for (const bet of bets) {
      if (bet.prediction === result) {
        const payout = Math.round(bet.stake * bet.odds);
        await db.updateBet(bet.id, { status: 'won', payout });
        await db.addPoints(bet.user_id, payout);
        await db.createNotification(bet.user_id, 'Bet Won!', `You won ${payout} EP! Match ended ${home_score}-${away_score}.`);
      } else {
        await db.updateBet(bet.id, { status: 'lost', payout: 0 });
        await db.createNotification(bet.user_id, 'Bet Lost', `Your bet lost. Match ended ${home_score}-${away_score}.`);
      }
    }

    res.json({ message: `Match settled. ${bets.length} bets processed.`, result, home_score, away_score });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error.' }); }
});

router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try { res.json(await db.getAllUsersIncludingStatus()); } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

router.get('/pending-users', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await db.getAllUsersIncludingStatus();
    res.json(users.filter(u => u.status === 'pending'));
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

router.post('/users/:id/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const user = await db.findUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    await db.updateUserStatus(userId, 'approved');
    await db.createNotification(userId, 'Account Approved', 'Your account has been approved! You can now log in and start placing bets.');

    // Award referral bonus if user was referred
    if (user.referred_by) {
      await db.addPoints(user.referred_by, 25);
      await db.createNotification(user.referred_by, 'Referral Bonus! 🎉', `You earned 25 EP for referring ${user.name}! Keep sharing your referral code.`);
    }

    res.json({ message: 'User approved successfully.' });
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

router.post('/users/:id/reject', authenticate, requireAdmin, async (req, res) => {
  try {
    await db.updateUserStatus(Number(req.params.id), 'rejected');
    res.json({ message: 'User rejected.' });
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

router.post('/users/:id/credit-referral', authenticate, requireAdmin, async (req, res) => {
  try {
    const { referrer_id } = req.body;
    if (!referrer_id) return res.status(400).json({ error: 'referrer_id required.' });
    await db.addPoints(referrer_id, 25);
    const user = await db.findUserById(Number(req.params.id));
    await db.createNotification(referrer_id, 'Referral Bonus! 🎉', `You earned 25 EP for referring ${user?.name || 'a new user'}! Keep sharing your referral code.`);
    // Update referred_by on the user
    await pool.query('UPDATE users SET referred_by = $1 WHERE id = $2', [referrer_id, Number(req.params.id)]);
    res.json({ message: 'Referral bonus credited.' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error.' }); }
});

router.post('/users/:id/reset-points', authenticate, requireAdmin, async (req, res) => {
  try {
    await db.updateUserPoints(Number(req.params.id), req.body.points || 20);
    res.json({ message: 'Points reset successfully.' });
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

router.post('/users/:id/add-points', authenticate, requireAdmin, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Amount must be positive.' });
    await db.addPoints(Number(req.params.id), Number(amount));
    const user = await db.findUserById(Number(req.params.id));
    await db.createNotification(Number(req.params.id), 'Points Added! 🎁', `Admin added ${amount} EP to your account. New balance: ${user.points} EP.`);
    res.json({ message: `${amount} EP added successfully.` });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error.' }); }
});

router.post('/users/:id/reset-password', authenticate, requireAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    await db.updateUserPassword(Number(req.params.id), bcrypt.hashSync(newPassword, 10));
    res.json({ message: 'Password reset successfully.' });
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

router.delete('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await db.deleteUser(Number(req.params.id));
    res.json({ message: 'User deleted successfully.' });
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

router.get('/bets', authenticate, requireAdmin, async (req, res) => {
  try { res.json(await db.getAllBets()); } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

router.post('/broadcast', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) return res.status(400).json({ error: 'Title and message are required.' });

    // Store broadcast for real-time polling
    await db.createBroadcast(title, message);

    const { rows: allUsers } = await pool.query(
      'SELECT id FROM users WHERE status != $1 OR status IS NULL', ['rejected']
    );

    let sent = 0;
    for (const user of allUsers) {
      await db.createNotification(user.id, title, message);
      sent++;
    }
    res.json({ message: `Broadcast sent to ${sent} user(s).` });
  } catch (err) { console.error('Broadcast error:', err); res.status(500).json({ error: 'Broadcast failed: ' + err.message }); }
});

router.post('/unsettle-all', authenticate, requireAdmin, async (req, res) => {
  try {
    const matchRes = await pool.query("UPDATE matches SET status = 'upcoming', home_score = NULL, away_score = NULL WHERE status = 'finished'");
    const betRes = await pool.query("UPDATE bets SET status = 'pending', payout = 0 WHERE status IN ('won', 'lost')");
    const userRes = await pool.query("UPDATE users SET points = 20 WHERE role != 'admin'");
    res.json({ message: `Reset complete: ${matchRes.rowCount} match(es), ${betRes.rowCount} bet(s), ${userRes.rowCount} user(s) points reset to 20 EP.` });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to unsettle.' }); }
});

module.exports = router;
