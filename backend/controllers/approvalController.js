// backend/controllers/approvalController.js
const { query } = require('../config/database');

// @desc    Get all pending approvals for current user
// @route   GET /api/approvals/pending
// @access  Private (Manager, Admin)
const getPendingApprovals = async (req, res) => {
  try {
    const { document_type } = req.query;

    let whereClause = '';
    const params = [];

    if (document_type) {
      whereClause = 'WHERE document_type = $1';
      params.push(document_type);
    }

    const result = await query(`
      SELECT * FROM pending_approvals_summary
      ${whereClause}
      ORDER BY created_at DESC
    `, params);

    res.json({
      success: true,
      data: {
        pending_approvals: result.rows,
        count: result.rows.length
      }
    });

  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending approvals'
    });
  }
};

// @desc    Get approval history for a document
// @route   GET /api/approvals/history/:type/:id
// @access  Private
const getApprovalHistory = async (req, res) => {
  try {
    const { type, id } = req.params;

    // Validate document type
    const validTypes = ['MRQS', 'PO', 'Invoice', 'GR'];
    if (!validTypes.includes(type.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type'
      });
    }

    const result = await query(`
      SELECT * FROM get_approval_history($1, $2)
    `, [type.toUpperCase(), id]);

    res.json({
      success: true,
      data: {
        history: result.rows
      }
    });

  } catch (error) {
    console.error('Get approval history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch approval history'
    });
  }
};

// @desc    Log approval action (used internally by other controllers)
// @access  Internal
const logApprovalAction = async (data) => {
  try {
    const {
      documentType,
      documentId,
      documentNumber,
      action,
      previousStatus,
      newStatus,
      performedBy,
      comments = null,
      rejectionReason = null
    } = data;

    const result = await query(`
      SELECT log_approval_action($1, $2, $3, $4, $5, $6, $7, $8, $9) as approval_id
    `, [
      documentType,
      documentId,
      documentNumber,
      action,
      previousStatus,
      newStatus,
      performedBy,
      comments,
      rejectionReason
    ]);

    return result.rows[0].approval_id;

  } catch (error) {
    console.error('Log approval action error:', error);
    throw error;
  }
};

// @desc    Get approval statistics
// @route   GET /api/approvals/stats
// @access  Private (Manager, Admin)
const getApprovalStats = async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        document_type,
        COUNT(*) as total_pending
      FROM pending_approvals_summary
      GROUP BY document_type
    `);

    const recentActions = await query(`
      SELECT 
        ah.approval_id,
        ah.document_type,
        ah.document_number,
        ah.action,
        ah.new_status,
        ah.performed_at,
        u.full_name as performed_by_name
      FROM approval_history ah
      LEFT JOIN users u ON ah.performed_by = u.user_id
      WHERE ah.performed_at >= NOW() - INTERVAL '7 days'
      ORDER BY ah.performed_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        pending_by_type: stats.rows,
        recent_actions: recentActions.rows
      }
    });

  } catch (error) {
    console.error('Get approval stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch approval statistics'
    });
  }
};

module.exports = {
  getPendingApprovals,
  getApprovalHistory,
  logApprovalAction,
  getApprovalStats
};