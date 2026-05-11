const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { simulateMatch, simulateAll, simulateNext, startPolling, stopPolling } = require('../services/liveResults');
const router = express.Router();

router.post('/simulate/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await simulateMatch(Number(req.params.id));
    if (!result) return res.status(400).json({ error: 'Match not found or already finished.' });
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error.' }); }
});

router.post('/simulate-next', authenticate, requireAdmin, async (req, res) => {
  try {
    const results = await simulateNext(req.body.count || 1);
    res.json({ message: `Simulated ${results.length} match(es)`, results });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error.' }); }
});

router.post('/simulate-all', authenticate, requireAdmin, async (req, res) => {
  try {
    const results = await simulateAll();
    res.json({ message: `Simulated ${results.length} match(es)`, results });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error.' }); }
});

router.post('/polling/start', authenticate, requireAdmin, (req, res) => { startPolling(); res.json({ message: 'Polling started.' }); });
router.post('/polling/stop', authenticate, requireAdmin, (req, res) => { stopPolling(); res.json({ message: 'Polling stopped.' }); });

module.exports = router;
