// ============================================
// backend/routes/product.routes.js
// ============================================
const express = require('express');
const router = express.Router();
const { authenticate: auth, authorize: authz } = require('../middleware/auth');
const { productController } = require('../controllers/productItemController');

router.get('/', auth, productController.getAllProducts);
router.get('/:id', auth, productController.getProductById);
router.post('/', auth, authz('admin', 'manager'), productController.createProduct);
router.put('/:id', auth, authz('admin', 'manager'), productController.updateProduct);
router.delete('/:id', auth, authz('admin'), productController.deleteProduct);

module.exports = router;