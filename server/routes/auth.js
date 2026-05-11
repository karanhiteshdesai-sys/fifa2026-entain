const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { JWT_SECRET, authenticate } = require('../middleware/auth');
const { generateExcel } = require('../services/excel');
const { sendOTP, generateOTP } = require('../services/email');

const router = express.Router();

// In-memory store for pending OTP verifications
const pendingOTPs = new Map();

// Step 1: Register - sends OTP to email
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  if (!email.endsWith('@entaingroup.com')) {
    return res.status(400).json({ error: 'Please use your company email address (@entaingroup.com) only.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const existing = db.findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered.' });
  }

  // Generate OTP
  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  pendingOTPs.set(email, {
    name,
    email,
    password,
    otp,
    expiresAt,
    attempts: 0
  });

  // Send OTP email
  try {
    await sendOTP(email, otp, name);
    res.json({ message: 'Verification code sent to your email.', email });
  } catch (err) {
    console.error('Failed to send OTP:', err.message);
    pendingOTPs.delete(email);
    res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
  }
});

// Step 2: Verify OTP - creates account in "pending" status (needs admin approval)
router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and verification code are required.' });
  }

  const pending = pendingOTPs.get(email);
  if (!pending) {
    return res.status(400).json({ error: 'No pending registration found. Please register again.' });
  }

  if (Date.now() > pending.expiresAt) {
    pendingOTPs.delete(email);
    return res.status(400).json({ error: 'Verification code expired. Please register again.' });
  }

  if (pending.attempts >= 5) {
    pendingOTPs.delete(email);
    return res.status(400).json({ error: 'Too many attempts. Please register again.' });
  }

  if (pending.otp !== otp) {
    pending.attempts++;
    return res.status(400).json({ error: 'Invalid verification code.' });
  }

  // OTP verified — create account in pending status (needs admin approval)
  const hashedPassword = bcrypt.hashSync(pending.password, 10);
  const user = db.createUser({
    name: pending.name,
    email: pending.email,
    password: hashedPassword,
    role: 'user',
    status: 'pending',
    points: 20
  });

  pendingOTPs.delete(email);

  res.status(201).json({
    message: 'Email verified! Your account is pending admin approval. You will be able to log in once approved.'
  });

  generateExcel().catch(err => console.error('Excel update failed:', err));
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;

  const pending = pendingOTPs.get(email);
  if (!pending) {
    return res.status(400).json({ error: 'No pending registration found. Please register again.' });
  }

  const otp = generateOTP();
  pending.otp = otp;
  pending.expiresAt = Date.now() + 10 * 60 * 1000;
  pending.attempts = 0;

  try {
    await sendOTP(email, otp, pending.name);
    res.json({ message: 'New verification code sent.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resend verification email.' });
  }
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  if (user.status === 'pending') {
    return res.status(403).json({ error: 'Your account is pending admin approval. Please wait.' });
  }

  if (user.status === 'rejected') {
    return res.status(403).json({ error: 'Your account has been rejected. Contact admin.' });
  }

  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, points: user.points }
  });
});

// Get current user profile
router.get('/me', authenticate, (req, res) => {
  const user = db.findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  const { password, ...safeUser } = user;
  res.json(safeUser);
});

// Change password
router.put('/change-password', authenticate, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  const user = db.findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const validPassword = bcrypt.compareSync(currentPassword, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  db.updateUserPassword(req.user.id, hashedPassword);

  res.json({ message: 'Password changed successfully.' });
});

module.exports = router;
