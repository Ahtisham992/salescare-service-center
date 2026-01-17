// backend/routes/inventory.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getStockInHand,
  getTransactions,
  getItemStock,
  getValuationReport,
  getLowStock,
  getInventoryStats
} = require('../controllers/inventoryController');

// Get inventory statistics
router.get('/stats', authenticate, getInventoryStats);

// Get stock in hand
router.get('/stock', authenticate, getStockInHand);

// Get low stock items
router.get('/low-stock', authenticate, getLowStock);

// Get inventory valuation (Admin, Manager only)
router.get('/valuation', authenticate, authorize('admin', 'manager'), getValuationReport);

// Get inventory transactions history
router.get('/transactions', authenticate, getTransactions);

// Get stock for specific item in area
router.get('/stock/:itemId/:areaId', authenticate, getItemStock);

module.exports = router;