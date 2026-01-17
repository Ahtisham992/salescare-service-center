// backend/routes/report.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  res.json({ success: true, message: 'Report routes - Coming soon' });
});

module.exports = router;