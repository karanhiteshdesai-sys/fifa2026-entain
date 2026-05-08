const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  syncResults,
  simulateMatch,
  simulateAll,
  simulateNext,
  startPolling,
  stopPolling
} = require('../services/liveResults');

const router = express.Router();

// Manually trigger live results sync (admin)
router.post('/sync', authenticate, requireAdmin, async (req, res) => {
  const result = await syncResults();
  res.json(result);
});

// Start auto-polling for live results (admin)
router.post('/polling/start', authenticate, requireAdmin, (req, res) => {
  const interval = req.body.interval || 120000; // default 2 min
  startPolling(interval);
  res.json({ message: `Live polling started (every ${interval / 1000}s)` });
});

// Stop auto-polling (admin)
router.post('/polling/stop', authenticate, requireAdmin, (req, res) => {
  stopPolling();
  res.json({ message: 'Live polling stopped.' });
});

// Simulate a single match result (admin - for testing)
router.post('/simulate/:id', authenticate, requireAdmin, async (req, res) => {
  const matchId = Number(req.params.id);
  const result = simulateMatch(matchId);
  if (!result) {
    return res.status(400).json({ error: 'Match not found or already finished.' });
  }
  const { generateExcel } = require('../services/excel');
  await generateExcel();
  res.json(result);
});

// Simulate next N matches (admin - for testing)
router.post('/simulate-next', authenticate, requireAdmin, async (req, res) => {
  const count = req.body.count || 1;
  const results = await simulateNext(count);
  res.json({ message: `Simulated ${results.length} match(es)`, results });
});

// Simulate ALL remaining matches (admin - for testing)
router.post('/simulate-all', authenticate, requireAdmin, async (req, res) => {
  const results = await simulateAll();
  res.json({ message: `Simulated ${results.length} match(es)`, results });
});

module.exports = router;
