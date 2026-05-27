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
  try {
    const users = await db.getAllUsersIncludingStatus();
    // Add referral count for each user
    const withReferrals = await Promise.all(users.map(async (u) => {
      const { rows } = await pool.query(
        "SELECT COUNT(*) as count FROM users WHERE referred_by = $1 AND status = 'approved'",
        [u.id]
      );
      return { ...u, referral_count: Number(rows[0].count) };
    }));
    res.json(withReferrals);
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
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

    // Notify referrer about new referral (no EP bonus, just tag upgrade tracking)
    if (user.referred_by) {
      await db.createNotification(user.referred_by, 'New Referral! 🎉', `${user.name} joined using your referral code! Your referral count has increased — keep referring to unlock better odds.`);
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
    const user = await db.findUserById(Number(req.params.id));
    await db.createNotification(referrer_id, 'New Referral! 🎉', `${user?.name || 'A new user'} was linked to your referral code! Your odds boost may have improved.`);
    // Update referred_by on the user
    await pool.query('UPDATE users SET referred_by = $1 WHERE id = $2', [referrer_id, Number(req.params.id)]);
    res.json({ message: 'Referral credited.' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error.' }); }
});

router.post('/users/:id/block', authenticate, requireAdmin, async (req, res) => {
  try {
    await db.updateUserStatus(Number(req.params.id), 'blocked');
    res.json({ message: 'User blocked.' });
  } catch (err) { res.status(500).json({ error: 'Failed to block user.' }); }
});

router.post('/users/:id/unblock', authenticate, requireAdmin, async (req, res) => {
  try {
    await db.updateUserStatus(Number(req.params.id), 'approved');
    res.json({ message: 'User unblocked.' });
  } catch (err) { res.status(500).json({ error: 'Failed to unblock user.' }); }
});

router.post('/users/:id/reset-points', authenticate, requireAdmin, async (req, res) => {
  try {
    const points = req.body.points || 100;
    await db.updateUserPoints(Number(req.params.id), points);
    await db.createNotification(Number(req.params.id), '🔄 Points Reset', `Admin has reset your points to ${points} EP. Please refresh the page to see your updated balance.`);
    res.json({ message: 'Points reset successfully.' });
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

router.post('/users/:id/add-points', authenticate, requireAdmin, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Amount must be positive.' });
    await db.addPoints(Number(req.params.id), Number(amount));
    const user = await db.findUserById(Number(req.params.id));
    await db.createNotification(Number(req.params.id), '🎁 Points Added!', `Admin added ${amount} EP to your account. New balance: ${user.points} EP. Please refresh the page to see your updated balance.`);
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

router.post('/bets/:id/void', authenticate, requireAdmin, async (req, res) => {
  try {
    const betId = Number(req.params.id);
    const { rows } = await pool.query('SELECT * FROM bets WHERE id = $1', [betId]);
    if (!rows[0]) return res.status(404).json({ error: 'Bet not found.' });
    const bet = rows[0];
    if (bet.status !== 'pending') return res.status(400).json({ error: 'Can only void pending bets.' });

    await pool.query("UPDATE bets SET status = 'voided', payout = 0 WHERE id = $1", [betId]);
    await db.addPoints(bet.user_id, bet.stake); // Refund
    await db.createNotification(bet.user_id, 'Bet Voided', `Your bet (${bet.stake} EP) has been voided by admin. Points refunded.`);
    res.json({ message: 'Bet voided and refunded.' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to void bet.' }); }
});

router.delete('/bets/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const betId = Number(req.params.id);
    const { rows } = await pool.query('SELECT * FROM bets WHERE id = $1', [betId]);
    if (!rows[0]) return res.status(404).json({ error: 'Bet not found.' });

    await pool.query('DELETE FROM bets WHERE id = $1', [betId]);
    res.json({ message: 'Bet deleted.' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to delete bet.' }); }
});

router.post('/bets/:id/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    const betId = Number(req.params.id);
    const { rows } = await pool.query('SELECT * FROM bets WHERE id = $1', [betId]);
    if (!rows[0]) return res.status(404).json({ error: 'Bet not found.' });
    const bet = rows[0];
    if (bet.status !== 'conditional') return res.status(400).json({ error: 'Can only approve conditional bets.' });

    await pool.query("UPDATE bets SET status = 'pending' WHERE id = $1", [betId]);
    await db.createNotification(bet.user_id, '✅ Bet Approved!', `Your bet ${bet.bet_number} (${bet.stake} EP) has been approved by admin. Good luck!`);
    res.json({ message: 'Bet approved.' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to approve bet.' }); }
});

router.post('/bets/:id/reject', authenticate, requireAdmin, async (req, res) => {
  try {
    const betId = Number(req.params.id);
    const { rows } = await pool.query('SELECT * FROM bets WHERE id = $1', [betId]);
    if (!rows[0]) return res.status(404).json({ error: 'Bet not found.' });
    const bet = rows[0];
    if (bet.status !== 'conditional') return res.status(400).json({ error: 'Can only reject conditional bets.' });

    await pool.query("UPDATE bets SET status = 'rejected' WHERE id = $1", [betId]);
    await db.addPoints(bet.user_id, bet.stake); // Refund
    await db.createNotification(bet.user_id, '❌ Bet Rejected', `Your bet ${bet.bet_number} (${bet.stake} EP) has been rejected by admin. Your ${bet.stake} EP has been refunded.`);
    res.json({ message: 'Bet rejected and refunded.' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to reject bet.' }); }
});

router.post('/generate-knockout', authenticate, requireAdmin, async (req, res) => {
  try {
    const { generateKnockoutRound } = require('../services/knockout');
    const result = await generateKnockoutRound();
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to generate knockout matches.' }); }
});

router.post('/unsettle-all', authenticate, requireAdmin, async (req, res) => {
  try {
    const matchRes = await pool.query("UPDATE matches SET status = 'upcoming', home_score = NULL, away_score = NULL WHERE status = 'finished'");
    const betRes = await pool.query("UPDATE bets SET status = 'pending', payout = 0 WHERE status IN ('won', 'lost')");
    const userRes = await pool.query("UPDATE users SET points = 100 WHERE role != 'admin'");
    res.json({ message: `Reset complete: ${matchRes.rowCount} match(es), ${betRes.rowCount} bet(s), ${userRes.rowCount} user(s) points reset to 100 EP.` });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to unsettle.' }); }
});

module.exports = router;
