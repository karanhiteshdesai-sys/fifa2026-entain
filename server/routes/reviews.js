const express = require('express');
const { pool } = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Check if current user has already reviewed
router.get('/mine', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM reviews WHERE user_id = $1', [req.user.id]);
    res.json({ hasReviewed: rows.length > 0, review: rows[0] || null });
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

// Submit a review
router.post('/', authenticate, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5.' });

    // Check if already reviewed
    const { rows: existing } = await pool.query('SELECT id FROM reviews WHERE user_id = $1', [req.user.id]);
    if (existing.length > 0) return res.status(409).json({ error: 'You have already submitted a review.' });

    await pool.query(
      'INSERT INTO reviews (user_id, rating, comment) VALUES ($1, $2, $3)',
      [req.user.id, rating, (comment || '').trim().substring(0, 200)]
    );
    res.status(201).json({ message: 'Thank you for your review!' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error.' }); }
});

// Admin: get all reviews
router.get('/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.*, u.name as user_name, u.department
      FROM reviews r JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `);
    const { rows: stats } = await pool.query('SELECT COUNT(*) as count, AVG(rating) as avg_rating FROM reviews');
    res.json({
      reviews: rows,
      totalReviews: Number(stats[0].count),
      averageRating: stats[0].avg_rating ? Math.round(Number(stats[0].avg_rating) * 10) / 10 : 0
    });
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

module.exports = router;
