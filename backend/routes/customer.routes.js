// ============================================
// backend/routes/customer.routes.js
// ============================================
const express = require('express');
const router = express.Router();
const { authenticate: auth2 } = require('../middleware/auth');
const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customerController');

router.get('/', auth2, getAllCustomers);
router.get('/:id', auth2, getCustomerById);
router.post('/', auth2, createCustomer);
router.put('/:id', auth2, updateCustomer);
router.delete('/:id', auth2, deleteCustomer);

module.exports = router;