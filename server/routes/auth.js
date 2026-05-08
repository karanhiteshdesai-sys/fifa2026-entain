const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { JWT_SECRET, authenticate } = require('../middleware/auth');
const { generateExcel } = require('../services/excel');
const { sendOTP, generateOTP } = require('../services/email');

const router = express.Router();

// In-memory store for pending registrations (OTP verification)
const pendingRegistrations = new Map();

// Step 1: Request registration (sends OTP)
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  if (!email.endsWith('@entaingroup.com')) {
    return res.status(400).json({ error: 'Only @entaingroup.com email addresses are allowed.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const existing = db.findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered.' });
  }

  // Generate OTP and store pending registration
  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  pendingRegistrations.set(email, {
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
    res.json({ message: 'Verification code sent to your email.', email, requiresOTP: true });
  } catch (err) {
    console.error('Failed to send OTP:', err.message);
    // Fallback: create account without OTP if email service is unavailable
    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = db.createUser({
      name,
      email,
      password: hashedPassword,
      role: 'user',
      points: 20
    });
    pendingRegistrations.delete(email);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: user.id, name, email, role: 'user', points: 20 },
      requiresOTP: false
    });

    generateExcel().catch(e => console.error('Excel update failed:', e));
  }
});

// Step 2: Verify OTP and complete registration
router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and verification code are required.' });
  }

  const pending = pendingRegistrations.get(email);
  if (!pending) {
    return res.status(400).json({ error: 'No pending registration found. Please register again.' });
  }

  // Check expiry
  if (Date.now() > pending.expiresAt) {
    pendingRegistrations.delete(email);
    return res.status(400).json({ error: 'Verification code expired. Please register again.' });
  }

  // Check attempts
  if (pending.attempts >= 5) {
    pendingRegistrations.delete(email);
    return res.status(400).json({ error: 'Too many attempts. Please register again.' });
  }

  // Verify OTP
  if (pending.otp !== otp) {
    pending.attempts++;
    return res.status(400).json({ error: 'Invalid verification code.' });
  }

  // OTP verified — create the user
  const hashedPassword = bcrypt.hashSync(pending.password, 10);
  const user = db.createUser({
    name: pending.name,
    email: pending.email,
    password: hashedPassword,
    role: 'user',
    points: 20
  });

  // Clean up
  pendingRegistrations.delete(email);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: 'user' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: 'user', points: 20 }
  });

  // Auto-update Excel on new registration
  generateExcel().catch(err => console.error('Excel update failed:', err));
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;

  const pending = pendingRegistrations.get(email);
  if (!pending) {
    return res.status(400).json({ error: 'No pending registration found. Please register again.' });
  }

  // Generate new OTP
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
