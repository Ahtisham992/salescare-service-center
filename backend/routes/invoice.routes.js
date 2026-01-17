// backend/routes/invoice.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  res.json({ success: true, message: 'Invoice routes - Coming soon' });
});

module.exports = router;