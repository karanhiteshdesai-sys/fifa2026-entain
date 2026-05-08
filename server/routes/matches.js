const express = require('express');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get all matches
router.get('/', authenticate, (req, res) => {
  const { stage, status, group } = req.query;
  const matches = db.getAllMatches({ stage, status, group });
  res.json(matches);
});

// Get single match
router.get('/:id', authenticate, (req, res) => {
  const match = db.findMatchById(Number(req.params.id));
  if (!match) {
    return res.status(404).json({ error: 'Match not found.' });
  }
  res.json(match);
});

module.exports = router;
