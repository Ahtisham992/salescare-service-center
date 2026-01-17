// backend/routes/complaint.routes.js
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
  getComplaintStats
} = require('../controllers/complaintController');

// Public stats (for dashboard)
router.get('/stats', authenticate, getComplaintStats);

// Get all complaints (with filters & pagination)
router.get('/', authenticate, getComplaints);

// Get single complaint
router.get('/:id', authenticate, getComplaintById);

// Create new complaint
router.post('/', authenticate, createComplaint);

// Update complaint
router.put('/:id', authenticate, updateComplaint);

// Assign technician (Admin & Manager only)
router.patch('/:id/assign', authenticate, authorize('admin', 'manager'), assignTechnician);

// Update status
router.patch('/:id/status', authenticate, updateStatus);

// Delete complaint (Admin only)
router.delete('/:id', authenticate, authorize('admin'), deleteComplaint);

module.exports = router;