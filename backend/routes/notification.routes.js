// backend/routes/notification.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification
} = require('../controllers/notificationController');

// Get user notifications
router.get('/', authenticate, getUserNotifications);

// Mark single notification as read
router.patch('/:id/read', authenticate, markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', authenticate, markAllAsRead);

// Delete notification
router.delete('/:id', authenticate, deleteNotification);

// Create notification (internal use)
router.post('/', authenticate, createNotification);

module.exports = router;