// backend/routes/approval.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getPendingApprovals,
  getApprovalHistory,
  getApprovalStats
} = require('../controllers/approvalController');

// Get all pending approvals (Manager, Admin only)
router.get('/pending', authenticate, authorize('admin', 'manager'), getPendingApprovals);

// Get approval history for a document
router.get('/history/:type/:id', authenticate, getApprovalHistory);

// Get approval statistics
router.get('/stats', authenticate, authorize('admin', 'manager'), getApprovalStats);

module.exports = router;