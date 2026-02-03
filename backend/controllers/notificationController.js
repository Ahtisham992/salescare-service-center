// backend/controllers/notificationController.js
const { query } = require('../config/database');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { limit = 20, offset = 0 } = req.query;

    // Get notifications
    const result = await query(`
      SELECT 
        notification_id,
        user_id,
        type,
        title,
        message,
        reference_type,
        reference_id,
        is_read,
        created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    // Get unread count
    const countResult = await query(`
      SELECT COUNT(*) as unread_count
      FROM notifications
      WHERE user_id = $1 AND is_read = false
    `, [userId]);

    res.json({
      success: true,
      data: {
        notifications: result.rows,
        unread_count: parseInt(countResult.rows[0].unread_count)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    await query(`
      UPDATE notifications
      SET is_read = true
      WHERE notification_id = $1 AND user_id = $2
    `, [id, userId]);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/mark-all-read
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.user_id;

    await query(`
      UPDATE notifications
      SET is_read = true
      WHERE user_id = $1 AND is_read = false
    `, [userId]);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    await query(`
      DELETE FROM notifications
      WHERE notification_id = $1 AND user_id = $2
    `, [id, userId]);

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
};

// @desc    Create notification (internal)
// @route   POST /api/notifications
// @access  Private
const createNotification = async (req, res) => {
  try {
    const {
      user_id,
      type = 'info',
      title,
      message,
      reference_type,
      reference_id
    } = req.body;

    const result = await query(`
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        reference_type,
        reference_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [user_id, type, title, message, reference_type, reference_id]);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification'
    });
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification
};