// ============================================
// backend/routes/area.routes.js
// ============================================
const express = require('express');
const router = express.Router();
const { authenticate: auth, authorize: authz } = require('../middleware/auth');
const { areaController } = require('../controllers/areaTariffController');

router.get('/', auth, areaController.getAllAreas);
router.get('/:id', auth, areaController.getAreaById);
router.post('/', auth, authz('admin', 'manager'), areaController.createArea);
router.put('/:id', auth, authz('admin', 'manager'), areaController.updateArea);
router.delete('/:id', auth, authz('admin'), areaController.deleteArea);

module.exports = router;