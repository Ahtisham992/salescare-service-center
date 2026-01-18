// backend/routes/vendor.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAllVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor
} = require('../controllers/vendorController');

// Get all vendors
router.get('/', authenticate, getAllVendors);

// Get vendor by ID
router.get('/:id', authenticate, getVendorById);

// Create new vendor (Admin, Manager only)
router.post('/', authenticate, authorize('admin', 'manager'), createVendor);

// Update vendor (Admin, Manager only)
router.put('/:id', authenticate, authorize('admin', 'manager'), updateVendor);

// Delete vendor (Admin only)
router.delete('/:id', authenticate, authorize('admin'), deleteVendor);

module.exports = router;