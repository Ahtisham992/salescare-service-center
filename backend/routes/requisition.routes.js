// backend/routes/requisition.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAllMRQS,
  getMRQSById,
  createMRQS,
  approveMRQS,
  issueMRQS,
  rejectMRQS,
  getAllMRTS,
  getMRTSById,
  createMRTS,
  getReturnableItems // ✅ Import New Controller
} = require('../controllers/requisitionController');

// ============================================
// MRQS Routes (Keep existing)
// ============================================
router.get('/mrqs', authenticate, getAllMRQS);
router.get('/mrqs/:id', authenticate, getMRQSById);
router.post('/mrqs', authenticate, createMRQS);
router.patch('/mrqs/:id/approve', authenticate, authorize('admin', 'manager'), approveMRQS);
router.patch('/mrqs/:id/issue', authenticate, authorize('admin', 'manager'), issueMRQS);
router.patch('/mrqs/:id/reject', authenticate, authorize('admin', 'manager'), rejectMRQS);

// ============================================
// MRTS Routes
// ============================================
router.get('/mrts', authenticate, getAllMRTS);
router.get('/mrts/:id', authenticate, getMRTSById);
router.post('/mrts', authenticate, createMRTS);

// ✅ NEW ROUTE: Get items available for return for a specific complaint
router.get('/mrts/returnable/:complaintId', authenticate, getReturnableItems);

module.exports = router;