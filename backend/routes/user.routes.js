// backend/routes/user.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  res.json({ success: true, message: 'User routes - Coming soon' });
});

module.exports = router;