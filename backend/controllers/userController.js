// backend/controllers/userController.js
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin, Manager)
const getAllUsers = async (req, res) => {
  try {
    const { role, is_active, search } = req.query;

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (role) {
      conditions.push(`role = $${paramCount}`);
      params.push(role);
      paramCount++;
    }

    if (is_active !== undefined) {
      conditions.push(`is_active = $${paramCount}`);
      params.push(is_active === 'true');
      paramCount++;
    }

    if (search) {
      conditions.push(`(
        username ILIKE $${paramCount} OR
        full_name ILIKE $${paramCount} OR
        email ILIKE $${paramCount}
      )`);
      params.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(`
      SELECT 
        user_id,
        username,
        full_name,
        email,
        phone,
        role,
        is_active,
        created_at,
        updated_at
      FROM users
      ${whereClause}
      ORDER BY full_name
    `, params);

    res.json({
      success: true,
      data: {
        users: result.rows,
        count: result.rows.length
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Admin, Manager)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        user_id,
        username,
        full_name,
        email,
        phone,
        role,
        is_active,
        created_at,
        updated_at
      FROM users
      WHERE user_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details'
    });
  }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Admin only)
const createUser = async (req, res) => {
  try {
    const {
      username,
      password,
      full_name,
      email,
      phone,
      role
    } = req.body;

    // Validation
    if (!username || !password || !full_name || !role) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, full name, and role are required'
      });
    }

    const validRoles = ['admin', 'technician', 'receptionist', 'manager'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Role must be one of: ${validRoles.join(', ')}`
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if username already exists
    const existingUser = await query(
      'SELECT user_id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query(`
      INSERT INTO users (
        username,
        password_hash,
        full_name,
        email,
        phone,
        role
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING user_id, username, full_name, email, phone, role, is_active, created_at
    `, [username, hashedPassword, full_name, email, phone, role]);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      full_name,
      email,
      phone,
      role,
      is_active
    } = req.body;

    // Check if user exists
    const userCheck = await query(
      'SELECT user_id FROM users WHERE user_id = $1',
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (full_name !== undefined) {
      updates.push(`full_name = $${paramCount}`);
      params.push(full_name);
      paramCount++;
    }

    if (email !== undefined) {
      updates.push(`email = $${paramCount}`);
      params.push(email);
      paramCount++;
    }

    if (phone !== undefined) {
      updates.push(`phone = $${paramCount}`);
      params.push(phone);
      paramCount++;
    }

    if (role !== undefined) {
      const validRoles = ['admin', 'technician', 'receptionist', 'manager'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: `Role must be one of: ${validRoles.join(', ')}`
        });
      }
      updates.push(`role = $${paramCount}`);
      params.push(role);
      paramCount++;
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      params.push(is_active);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const result = await query(`
      UPDATE users
      SET ${updates.join(', ')}
      WHERE user_id = $${paramCount}
      RETURNING user_id, username, full_name, email, phone, role, is_active, updated_at
    `, params);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
};

// @desc    Reset user password
// @route   PATCH /api/users/:id/reset-password
// @access  Private (Admin only)
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    const result = await query(`
      UPDATE users
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
      RETURNING username, full_name
    `, [hashedPassword, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `Password reset successfully for ${result.rows[0].full_name}`
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (parseInt(id) === req.user.user_id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Check if user has assigned complaints
    const complaintCheck = await query(
      'SELECT complaint_id FROM complaints WHERE assigned_technician = $1 AND status NOT IN (\'Completed\', \'Cancelled\') LIMIT 1',
      [id]
    );

    if (complaintCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with active assigned complaints. Deactivate instead.'
      });
    }

    const result = await query(
      'DELETE FROM users WHERE user_id = $1 RETURNING username, full_name',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User ${result.rows[0].full_name} deleted successfully`
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  resetUserPassword,
  deleteUser
};