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
  createMRTS
} = require('../controllers/requisitionController');

// ============================================
// MRQS Routes
// ============================================

// Get all MRQS
router.get('/mrqs', authenticate, getAllMRQS);

// Get single MRQS
router.get('/mrqs/:id', authenticate, getMRQSById);

// Create new MRQS
router.post('/mrqs', authenticate, createMRQS);

// Approve MRQS (Admin, Manager only)
router.patch('/mrqs/:id/approve', authenticate, authorize('admin', 'manager'), approveMRQS);

// Issue materials (Admin, Manager only)
router.patch('/mrqs/:id/issue', authenticate, authorize('admin', 'manager'), issueMRQS);

// Reject MRQS (Admin, Manager only)
router.patch('/mrqs/:id/reject', authenticate, authorize('admin', 'manager'), rejectMRQS);

// ============================================
// MRTS Routes
// ============================================

// Get all MRTS
router.get('/mrts', authenticate, getAllMRTS);

// Get single MRTS
router.get('/mrts/:id', authenticate, getMRTSById);

// Create new MRTS
router.post('/mrts', authenticate, createMRTS);

module.exports = router;