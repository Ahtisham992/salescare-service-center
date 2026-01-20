// ============================================
// backend/routes/item.routes.js
// ============================================
const express = require('express');
const router = express.Router();
const { authenticate: auth, authorize: authz } = require('../middleware/auth');
const { itemController } = require('../controllers/productItemController');

router.get('/', auth, itemController.getAllItems);
router.get('/:id', auth, itemController.getItemById);
router.post('/', auth, authz('admin', 'manager'), itemController.createItem);
router.put('/:id', auth, authz('admin', 'manager'), itemController.updateItem);
router.delete('/:id', auth, authz('admin'), itemController.deleteItem);

module.exports = router;