// backend/routes/purchase.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  approvePurchaseOrder,
  cancelPurchaseOrder,
  deletePurchaseOrder
} = require('../controllers/purchaseController');

// Get all purchase orders
router.get('/', authenticate, getAllPurchaseOrders);

// Get purchase order by ID
router.get('/:id', authenticate, getPurchaseOrderById);

// Create new purchase order
router.post('/', authenticate, createPurchaseOrder);

// Approve purchase order (Admin, Manager only)
router.patch('/:id/approve', authenticate, authorize('admin', 'manager'), approvePurchaseOrder);

// Cancel purchase order (Admin, Manager only)
router.patch('/:id/cancel', authenticate, authorize('admin', 'manager'), cancelPurchaseOrder);

// Delete purchase order (Admin only)
router.delete('/:id', authenticate, authorize('admin'), deletePurchaseOrder);

module.exports = router;