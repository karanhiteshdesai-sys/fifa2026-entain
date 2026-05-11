const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/excel', authenticate, requireAdmin, async (req, res) => {
  try {
    res.json({ message: 'Excel export temporarily disabled during database migration.' });
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

module.exports = router;
