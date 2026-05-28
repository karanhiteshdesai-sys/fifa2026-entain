const express = require('express');
const router = express.Router();

// Odds are static — no external sync or dynamic adjustment.
// The seeded odds in the database are final and never change.

router.get('/status', (req, res) => {
  res.json({
    mode: 'static',
    message: 'Odds are fixed and do not change.'
  });
});

// No-op: kept so server startup doesn't break
function startAutoSync() {
  console.log('📊 Odds are static — no auto-sync.');
}

module.exports = router;
module.exports.startAutoSync = startAutoSync;
