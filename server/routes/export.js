const express = require('express');
const path = require('path');
const { generateExcel, EXCEL_PATH } = require('../services/excel');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Generate and download Excel report
router.get('/excel', authenticate, requireAdmin, async (req, res) => {
  try {
    await generateExcel();
    res.download(EXCEL_PATH, 'FIFA2026_Entain_Report.xlsx');
  } catch (err) {
    console.error('Excel generation failed:', err);
    res.status(500).json({ error: 'Failed to generate Excel report.' });
  }
});

// Regenerate Excel (without download)
router.post('/excel/refresh', authenticate, requireAdmin, async (req, res) => {
  try {
    const filePath = await generateExcel();
    res.json({ message: 'Excel report updated.', path: filePath });
  } catch (err) {
    res.status(500).json({ error: 'Failed to refresh Excel report.' });
  }
});

module.exports = router;
