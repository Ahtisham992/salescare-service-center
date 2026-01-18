// backend/routes/delivery.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAllDeliveryOrders,
  getDeliveryOrderById,
  createDeliveryOrder,
  markAsDelivered,
  cancelDeliveryOrder,
  deleteDeliveryOrder
} = require('../controllers/deliveryController.js');

// Get all delivery orders
router.get('/', authenticate, getAllDeliveryOrders);

// Get delivery order by ID
router.get('/:id', authenticate, getDeliveryOrderById);

// Create new delivery order
router.post('/', authenticate, createDeliveryOrder);

// Mark as delivered (Admin, Manager only)
router.patch('/:id/deliver', authenticate, authorize('admin', 'manager'), markAsDelivered);

// Cancel delivery order (Admin, Manager only)
router.patch('/:id/cancel', authenticate, authorize('admin', 'manager'), cancelDeliveryOrder);

// Delete delivery order (Admin only)
router.delete('/:id', authenticate, authorize('admin'), deleteDeliveryOrder);

module.exports = router;