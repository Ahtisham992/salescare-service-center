// backend/routes/complaint.routes.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  assignTechnician,
  updateStatus,
  deleteComplaint,
  getComplaintStats,
  autoAssignTechnician
} = require('../controllers/complaintController');

// ⚠️ CRITICAL: Specific routes MUST come BEFORE parameterized routes like /:id
// Otherwise /auto-assign will be treated as /:id with id="auto-assign"

// Stats endpoint - before /:id
router.get('/stats', authenticate, getComplaintStats);

// Auto-assign endpoint - MUST be before /:id route
router.get('/auto-assign', authenticate, authorize('admin', 'manager', 'receptionist'), autoAssignTechnician);

// Get all complaints
router.get('/', authenticate, getComplaints);

// Get single complaint - MUST come AFTER all specific routes
router.get('/:id', authenticate, getComplaintById);

// Create new complaint
router.post('/', authenticate, createComplaint);

// Update complaint
router.put('/:id', authenticate, updateComplaint);

// Assign technician
router.patch('/:id/assign', authenticate, authorize('admin', 'manager', 'receptionist'), assignTechnician);

// Update status
router.patch('/:id/status', authenticate, updateStatus);

// Delete complaint
router.delete('/:id', authenticate, authorize('admin'), deleteComplaint);

module.exports = router;