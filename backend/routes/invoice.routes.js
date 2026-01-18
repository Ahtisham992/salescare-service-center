// backend/routes/invoice.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAllInvoices,
  getInvoiceById,
  createComplaintInvoice,
  createCounterSaleInvoice,
  updateInvoiceStatus,
  getInvoiceStats
} = require('../controllers/invoiceController');

// Get invoice statistics
router.get('/stats', authenticate, getInvoiceStats);

// Get all invoices
router.get('/', authenticate, getAllInvoices);

// Get invoice by ID
router.get('/:id', authenticate, getInvoiceById);

// Create complaint service invoice
router.post('/complaint', authenticate, createComplaintInvoice);

// Create counter sale invoice
router.post('/counter-sale', authenticate, createCounterSaleInvoice);

// Update invoice status (Admin, Manager only)
router.patch('/:id/status', authenticate, authorize('admin', 'manager'), updateInvoiceStatus);

module.exports = router;