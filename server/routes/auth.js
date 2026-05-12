const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db/database');
const { JWT_SECRET, authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, department, referral_code } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required.' });

    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail.endsWith('@entaingroup.com')) return res.status(400).json({ error: 'Please use your company email address (@entaingroup.com) only.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const existing = await db.findUserByEmail(normalizedEmail);
    if (existing) return res.status(409).json({ error: 'You have already registered. Please login instead.' });

    // Validate referral code if provided
    let referrerId = null;
    if (referral_code && referral_code.trim()) {
      const code = referral_code.trim().toUpperCase();
      // Look up referrer by matching the deterministic code formula (include ALL users)
      const { rows: allUsers } = await require('../db/database').pool.query(
        'SELECT id, name, email FROM users'
      );
      const referrer = allUsers.find(u => {
        const prefix = u.name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
        const idPart = (u.id * 7919).toString(36).substring(0, 4).toUpperCase();
        return `FIFA-${prefix}${idPart}` === code;
      });
      if (!referrer) return res.status(400).json({ error: 'Invalid referral code. Please check and try again.' });
      if (referrer.email === normalizedEmail) return res.status(400).json({ error: 'You cannot refer yourself.' });
      referrerId = referrer.id;
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    await db.createUser({ name, email: normalizedEmail, password: hashedPassword, department: department || '', role: 'user', status: 'pending', points: 20, referred_by: referrerId });

    res.status(201).json({ message: 'Registration submitted! Please wait for admin approval before you can log in.' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error.' }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const user = await db.findUserByEmail(email.toLowerCase().trim());
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
    if (user.status === 'pending') return res.status(403).json({ error: 'Your account is pending admin approval. Please wait.' });
    if (user.status === 'rejected') return res.status(403).json({ error: 'Your account has been rejected. Contact admin.' });

    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials.' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, points: user.points } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error.' }); }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await db.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

router.get('/referrals', authenticate, async (req, res) => {
  try {
    const user = await db.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Deterministic referral code from user data
    const prefix = user.name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    const idPart = (user.id * 7919).toString(36).substring(0, 4).toUpperCase();
    const referralCode = `FIFA-${prefix}${idPart}`;

    let referrals = [];
    try {
      referrals = await db.getReferralsByUser(req.user.id);
    } catch (e) { /* referred_by column may not exist */ }

    res.json({ referralCode, referrals, totalBonus: referrals.length * 25 });
  } catch (err) { console.error('Referral error:', err); res.status(500).json({ error: 'Server error.' }); }
});

router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current password and new password are required.' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters.' });

    const user = await db.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (!bcrypt.compareSync(currentPassword, user.password)) return res.status(401).json({ error: 'Current password is incorrect.' });

    await db.updateUserPassword(req.user.id, bcrypt.hashSync(newPassword, 10));
    res.json({ message: 'Password changed successfully.' });
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

module.exports = router;
