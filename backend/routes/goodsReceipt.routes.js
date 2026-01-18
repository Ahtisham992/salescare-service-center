// backend/routes/goodsReceipt.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAllGoodsReceipts,
  getGoodsReceiptById,
  createGoodsReceipt,
  deleteGoodsReceipt
} = require('../controllers/goodsReceiptController');

// Get all goods receipts
router.get('/', authenticate, getAllGoodsReceipts);

// Get goods receipt by ID
router.get('/:id', authenticate, getGoodsReceiptById);

// Create new goods receipt
router.post('/', authenticate, createGoodsReceipt);

// Delete goods receipt (Admin only)
router.delete('/:id', authenticate, authorize('admin'), deleteGoodsReceipt);

module.exports = router;