const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { JWT_SECRET, authenticate } = require('../middleware/auth');
const { generateExcel } = require('../services/excel');

const router = express.Router();

// Register - creates account in "pending" status, needs admin approval
router.post('/register', (req, res) => {
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

  const hashedPassword = bcrypt.hashSync(password, 10);
  db.createUser({
    name,
    email,
    password: hashedPassword,
    role: 'user',
    status: 'pending',
    points: 20
  });

  res.status(201).json({
    message: 'Registration submitted! Please wait for admin approval before you can log in.'
  });

  generateExcel().catch(err => console.error('Excel update failed:', err));
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
