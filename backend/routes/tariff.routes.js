// ============================================
// backend/routes/tariff.routes.js
// ============================================
const express = require('express');
const router = express.Router();
const { authenticate: auth, authorize: authz } = require('../middleware/auth');
const { tariffController } = require('../controllers/areaTariffController');

router.get('/', auth, tariffController.getAllTariffs);
router.get('/:id', auth, tariffController.getTariffById);
router.post('/', auth, authz('admin', 'manager'), tariffController.createTariff);
router.put('/:id', auth, authz('admin', 'manager'), tariffController.updateTariff);
router.delete('/:id', auth, authz('admin'), tariffController.deleteTariff);

module.exports = router;