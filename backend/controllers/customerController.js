// backend/controllers/customerController.js
const { query } = require('../config/database');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getAllCustomers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search
    } = req.query;

    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (search) {
      conditions.push(`(
        name ILIKE $${paramCount} OR
        phone ILIKE $${paramCount} OR
        cnic ILIKE $${paramCount} OR
        email ILIKE $${paramCount}
      )`);
      params.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total FROM customers ${whereClause}
    `, params);

    const totalCustomers = parseInt(countResult.rows[0].total);

    // Get customers
    params.push(limit, offset);

    const result = await query(`
      SELECT 
        c.customer_id,
        c.name,
        c.phone,
        c.alternate_phone,
        c.address,
        c.cnic,
        c.email,
        c.created_at,
        c.updated_at,
        COUNT(DISTINCT comp.complaint_id) as total_complaints,
        COUNT(DISTINCT CASE WHEN comp.status = 'Completed' THEN comp.complaint_id END) as completed_complaints
      FROM customers c
      LEFT JOIN complaints comp ON c.customer_id = comp.customer_id
      ${whereClause}
      GROUP BY c.customer_id
      ORDER BY c.name
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `, params);

    res.json({
      success: true,
      data: {
        customers: result.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalCustomers / limit),
          total_items: totalCustomers,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers'
    });
  }
};

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        c.*,
        COUNT(DISTINCT comp.complaint_id) as total_complaints,
        COUNT(DISTINCT CASE WHEN comp.status = 'Completed' THEN comp.complaint_id END) as completed_complaints,
        COUNT(DISTINCT CASE WHEN comp.status IN ('Open', 'Assigned', 'In Progress') THEN comp.complaint_id END) as active_complaints
      FROM customers c
      LEFT JOIN complaints comp ON c.customer_id = comp.customer_id
      WHERE c.customer_id = $1
      GROUP BY c.customer_id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer details'
    });
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res) => {
  try {
    const {
      name,
      phone,
      alternate_phone,
      address,
      cnic,
      email
    } = req.body;

    // Validation
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required'
      });
    }

    const result = await query(`
      INSERT INTO customers (
        name,
        phone,
        alternate_phone,
        address,
        cnic,
        email
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, phone, alternate_phone, address, cnic, email]);

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create customer'
    });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      alternate_phone,
      address,
      cnic,
      email
    } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      params.push(name);
      paramCount++;
    }

    if (phone !== undefined) {
      updates.push(`phone = $${paramCount}`);
      params.push(phone);
      paramCount++;
    }

    if (alternate_phone !== undefined) {
      updates.push(`alternate_phone = $${paramCount}`);
      params.push(alternate_phone);
      paramCount++;
    }

    if (address !== undefined) {
      updates.push(`address = $${paramCount}`);
      params.push(address);
      paramCount++;
    }

    if (cnic !== undefined) {
      updates.push(`cnic = $${paramCount}`);
      params.push(cnic);
      paramCount++;
    }

    if (email !== undefined) {
      updates.push(`email = $${paramCount}`);
      params.push(email);
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
      UPDATE customers
      SET ${updates.join(', ')}
      WHERE customer_id = $${paramCount}
      RETURNING *
    `, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update customer'
    });
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private (Admin only)
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer has complaints
    const complaintCheck = await query(
      'SELECT complaint_id FROM complaints WHERE customer_id = $1 LIMIT 1',
      [id]
    );

    if (complaintCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete customer with existing complaints'
      });
    }

    const result = await query(
      'DELETE FROM customers WHERE customer_id = $1 RETURNING name',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      message: `Customer ${result.rows[0].name} deleted successfully`
    });

  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer'
    });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};