const express = require('express');
const { db } = require('../db/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { stage, status, group } = req.query;
    const matches = await db.getAllMatches({ stage, status, group });
    res.json(matches);
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const match = await db.findMatchById(Number(req.params.id));
    if (!match) return res.status(404).json({ error: 'Match not found.' });
    res.json(match);
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

module.exports = router;
