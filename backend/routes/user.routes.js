// ============================================
// backend/routes/user.routes.js
// ============================================
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  resetUserPassword,
  deleteUser
} = require('../controllers/userController');

router.get('/', authenticate, authorize('admin', 'manager'), getAllUsers);
router.get('/:id', authenticate, authorize('admin', 'manager'), getUserById);
router.post('/', authenticate, authorize('admin'), createUser);
router.put('/:id', authenticate, authorize('admin'), updateUser);
router.patch('/:id/reset-password', authenticate, authorize('admin'), resetUserPassword);
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

module.exports = router;