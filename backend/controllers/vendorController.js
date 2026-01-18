// backend/controllers/vendorController.js
const { query } = require('../config/database');

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Private
const getAllVendors = async (req, res) => {
  try {
    const {
      vendor_type,
      is_active,
      search
    } = req.query;

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (vendor_type) {
      conditions.push(`vendor_type = $${paramCount}`);
      params.push(vendor_type);
      paramCount++;
    }

    if (is_active !== undefined) {
      conditions.push(`is_active = $${paramCount}`);
      params.push(is_active === 'true');
      paramCount++;
    }

    if (search) {
      conditions.push(`(
        vendor_code ILIKE $${paramCount} OR
        vendor_name ILIKE $${paramCount} OR
        contact_person ILIKE $${paramCount}
      )`);
      params.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(`
      SELECT 
        vendor_id,
        vendor_code,
        vendor_name,
        vendor_type,
        contact_person,
        phone,
        email,
        address,
        is_active,
        created_at
      FROM vendors
      ${whereClause}
      ORDER BY vendor_name
    `, params);

    res.json({
      success: true,
      data: {
        vendors: result.rows,
        count: result.rows.length
      }
    });

  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendors'
    });
  }
};

// @desc    Get vendor by ID
// @route   GET /api/vendors/:id
// @access  Private
const getVendorById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        v.*,
        COUNT(po.po_id) as total_pos,
        COALESCE(SUM(po.total_amount), 0) as total_purchase_value
      FROM vendors v
      LEFT JOIN purchase_orders po ON v.vendor_id = po.vendor_id
      WHERE v.vendor_id = $1
      GROUP BY v.vendor_id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Get vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor details'
    });
  }
};

// @desc    Create new vendor
// @route   POST /api/vendors
// @access  Private (Admin, Manager)
const createVendor = async (req, res) => {
  try {
    const {
      vendor_code,
      vendor_name,
      vendor_type,
      contact_person,
      phone,
      email,
      address
    } = req.body;

    // Validation
    if (!vendor_code || !vendor_name || !vendor_type) {
      return res.status(400).json({
        success: false,
        message: 'Vendor code, name, and type are required'
      });
    }

    const validTypes = ['LPR', 'Vendor'];
    if (!validTypes.includes(vendor_type)) {
      return res.status(400).json({
        success: false,
        message: `Vendor type must be one of: ${validTypes.join(', ')}`
      });
    }

    // Check if vendor code already exists
    const existingVendor = await query(
      'SELECT vendor_id FROM vendors WHERE vendor_code = $1',
      [vendor_code]
    );

    if (existingVendor.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Vendor code already exists'
      });
    }

    const result = await query(`
      INSERT INTO vendors (
        vendor_code,
        vendor_name,
        vendor_type,
        contact_person,
        phone,
        email,
        address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [vendor_code, vendor_name, vendor_type, contact_person, phone, email, address]);

    res.status(201).json({
      success: true,
      message: 'Vendor created successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Create vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create vendor'
    });
  }
};

// @desc    Update vendor
// @route   PUT /api/vendors/:id
// @access  Private (Admin, Manager)
const updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      vendor_name,
      vendor_type,
      contact_person,
      phone,
      email,
      address,
      is_active
    } = req.body;

    // Check if vendor exists
    const vendorCheck = await query(
      'SELECT vendor_id FROM vendors WHERE vendor_id = $1',
      [id]
    );

    if (vendorCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (vendor_name !== undefined) {
      updates.push(`vendor_name = $${paramCount}`);
      params.push(vendor_name);
      paramCount++;
    }

    if (vendor_type !== undefined) {
      const validTypes = ['LPR', 'Vendor'];
      if (!validTypes.includes(vendor_type)) {
        return res.status(400).json({
          success: false,
          message: `Vendor type must be one of: ${validTypes.join(', ')}`
        });
      }
      updates.push(`vendor_type = $${paramCount}`);
      params.push(vendor_type);
      paramCount++;
    }

    if (contact_person !== undefined) {
      updates.push(`contact_person = $${paramCount}`);
      params.push(contact_person);
      paramCount++;
    }

    if (phone !== undefined) {
      updates.push(`phone = $${paramCount}`);
      params.push(phone);
      paramCount++;
    }

    if (email !== undefined) {
      updates.push(`email = $${paramCount}`);
      params.push(email);
      paramCount++;
    }

    if (address !== undefined) {
      updates.push(`address = $${paramCount}`);
      params.push(address);
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

    params.push(id);

    const result = await query(`
      UPDATE vendors
      SET ${updates.join(', ')}
      WHERE vendor_id = $${paramCount}
      RETURNING *
    `, params);

    res.json({
      success: true,
      message: 'Vendor updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vendor'
    });
  }
};

// @desc    Delete vendor
// @route   DELETE /api/vendors/:id
// @access  Private (Admin only)
const deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if vendor has purchase orders
    const poCheck = await query(
      'SELECT po_id FROM purchase_orders WHERE vendor_id = $1 LIMIT 1',
      [id]
    );

    if (poCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete vendor with existing purchase orders. Deactivate instead.'
      });
    }

    const result = await query(
      'DELETE FROM vendors WHERE vendor_id = $1 RETURNING vendor_code, vendor_name',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.json({
      success: true,
      message: `Vendor ${result.rows[0].vendor_name} deleted successfully`
    });

  } catch (error) {
    console.error('Delete vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete vendor'
    });
  }
};

module.exports = {
  getAllVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor
};