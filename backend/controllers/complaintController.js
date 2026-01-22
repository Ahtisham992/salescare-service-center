// backend/controllers/complaintController.js - COMPLETE WORKING VERSION
const { query, transaction } = require('../config/database');
const { generateComplaintNumber } = require('../utils/autoNumber');
const { validateComplaint } = require('../utils/validators');

// @desc    Get all complaints with filters and pagination
// @route   GET /api/complaints
// @access  Private
const getComplaints = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      warranty_status,
      technician_id,
      customer_id,
      area_id,
      search,
      date_from,
      date_to,
      sort_by = 'complaint_date',
      sort_order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;

    // Build WHERE clause dynamically
    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (status) {
      conditions.push(`c.status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    if (priority) {
      conditions.push(`c.priority = $${paramCount}`);
      params.push(priority);
      paramCount++;
    }

    if (warranty_status) {
      conditions.push(`c.warranty_status = $${paramCount}`);
      params.push(warranty_status);
      paramCount++;
    }

    if (technician_id) {
      conditions.push(`c.assigned_technician = $${paramCount}`);
      params.push(technician_id);
      paramCount++;
    }

    if (customer_id) {
      conditions.push(`c.customer_id = $${paramCount}`);
      params.push(customer_id);
      paramCount++;
    }

    if (area_id) {
      conditions.push(`c.area_id = $${paramCount}`);
      params.push(area_id);
      paramCount++;
    }

    if (search) {
      conditions.push(`(
        c.complaint_number ILIKE $${paramCount} OR
        cust.name ILIKE $${paramCount} OR
        p.product_name ILIKE $${paramCount} OR
        c.complaint_description ILIKE $${paramCount}
      )`);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (date_from) {
      conditions.push(`c.complaint_date >= $${paramCount}`);
      params.push(date_from);
      paramCount++;
    }

    if (date_to) {
      conditions.push(`c.complaint_date <= $${paramCount}`);
      params.push(date_to);
      paramCount++;
    }

    // Role-based filtering
    if (req.user.role === 'technician') {
      conditions.push(`c.assigned_technician = $${paramCount}`);
      params.push(req.user.user_id);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM complaints c
      JOIN customers cust ON c.customer_id = cust.customer_id
      JOIN products p ON c.product_id = p.product_id
      ${whereClause}
    `;
    const countResult = await query(countQuery, params);
    const totalComplaints = parseInt(countResult.rows[0].total);

    // Get complaints - note paramCount is already the next number to use
    const complaintsQuery = `
      SELECT 
        c.complaint_id,
        c.complaint_number,
        c.complaint_date,
        c.complaint_type,
        c.complaint_description,
        c.status,
        c.warranty_status,
        c.priority,
        c.serial_number,
        c.purchase_date,
        c.scheduled_date,
        c.completion_date,
        c.selected_service_charge,
        c.parts_amount,
        c.total_service_amount,
        cust.customer_id,
        cust.name as customer_name,
        cust.phone as customer_phone,
        cust.address as customer_address,
        p.product_id,
        p.product_name,
        oa.area_id,
        oa.area_name,
        tech.user_id as technician_id,
        tech.full_name as technician_name,
        tech.phone as technician_phone,
        creator.full_name as created_by_name,
        c.created_at,
        c.updated_at
      FROM complaints c
      JOIN customers cust ON c.customer_id = cust.customer_id
      JOIN products p ON c.product_id = p.product_id
      JOIN operational_areas oa ON c.area_id = oa.area_id
      LEFT JOIN users tech ON c.assigned_technician = tech.user_id
      LEFT JOIN users creator ON c.created_by = creator.user_id
      ${whereClause}
      ORDER BY c.${sort_by} ${sort_order}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    // Add limit and offset to params
    const mainQueryParams = [...params, limit, offset];
    const result = await query(complaintsQuery, mainQueryParams);

    res.json({
      success: true,
      data: {
        complaints: result.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalComplaints / limit),
          total_items: totalComplaints,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaints'
    });
  }
};

// @desc    Get single complaint by ID
// @route   GET /api/complaints/:id
// @access  Private
const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        c.*,
        cust.name as customer_name,
        cust.phone as customer_phone,
        cust.alternate_phone as customer_alternate_phone,
        cust.address as customer_address,
        cust.email as customer_email,
        cust.cnic as customer_cnic,
        p.product_name,
        p.product_code,
        oa.area_name,
        oa.area_code,
        tech.user_id as technician_id,
        tech.full_name as technician_name,
        tech.phone as technician_phone,
        creator.full_name as created_by_name,
        st.visit_charges_24h,
        st.visit_charges_48h,
        st.gas_charges,
        st.inspection_charges_csc,
        st.washing_charges,
        st.transport_charges_per_km,
        st.dismantling_charges,
        st.reinstallation_charges
      FROM complaints c
      JOIN customers cust ON c.customer_id = cust.customer_id
      JOIN products p ON c.product_id = p.product_id
      JOIN operational_areas oa ON c.area_id = oa.area_id
      LEFT JOIN users tech ON c.assigned_technician = tech.user_id
      LEFT JOIN users creator ON c.created_by = creator.user_id
      LEFT JOIN service_tariffs st ON c.service_tariff_id = st.tariff_id
      WHERE c.complaint_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check if technician can only view their own complaints
    if (req.user.role === 'technician' && 
        result.rows[0].assigned_technician !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your assigned complaints.'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaint details'
    });
  }
};

// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Private
const createComplaint = async (req, res) => {
  try {
    const {
      customer_id,
      product_id,
      area_id,
      serial_number,
      warranty_status,
      purchase_date,
      complaint_type,
      complaint_description,
      priority = 'Medium',
      scheduled_date
    } = req.body;

    // Validation
    const validation = validateComplaint(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Verify customer exists
    const customerCheck = await query(
      'SELECT customer_id FROM customers WHERE customer_id = $1',
      [customer_id]
    );
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Verify product exists
    const productCheck = await query(
      'SELECT product_id FROM products WHERE product_id = $1',
      [product_id]
    );
    if (productCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Verify area exists
    const areaCheck = await query(
      'SELECT area_id FROM operational_areas WHERE area_id = $1',
      [area_id]
    );
    if (areaCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Operational area not found'
      });
    }

    // Get area code for complaint number
    const areaData = await query(
      'SELECT area_code FROM operational_areas WHERE area_id = $1',
      [area_id]
    );
    const areaCode = areaData.rows[0].area_code;

    // Generate complaint number
    const complaintNumber = await generateComplaintNumber(areaCode);

    // Get service tariff for product
    const tariffResult = await query(
      'SELECT tariff_id FROM service_tariffs WHERE product_id = $1',
      [product_id]
    );
    const serviceTariffId = tariffResult.rows.length > 0 ? 
      tariffResult.rows[0].tariff_id : null;

    // Create complaint in transaction
    const result = await transaction(async (client) => {
      const complaint = await client.query(`
        INSERT INTO complaints (
          complaint_number,
          customer_id,
          product_id,
          area_id,
          serial_number,
          warranty_status,
          purchase_date,
          complaint_type,
          complaint_description,
          priority,
          status,
          service_tariff_id,
          scheduled_date,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `, [
        complaintNumber,
        customer_id,
        product_id,
        area_id,
        serial_number,
        warranty_status,
        purchase_date,
        complaint_type,
        complaint_description,
        priority,
        'Open',
        serviceTariffId,
        scheduled_date,
        req.user.user_id
      ]);

      return complaint.rows[0];
    });

    // Fetch complete complaint data
    const completeComplaint = await query(`
      SELECT 
        c.*,
        cust.name as customer_name,
        p.product_name,
        oa.area_name
      FROM complaints c
      JOIN customers cust ON c.customer_id = cust.customer_id
      JOIN products p ON c.product_id = p.product_id
      JOIN operational_areas oa ON c.area_id = oa.area_id
      WHERE c.complaint_id = $1
    `, [result.complaint_id]);

    res.status(201).json({
      success: true,
      message: 'Complaint created successfully',
      data: completeComplaint.rows[0]
    });

  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create complaint'
    });
  }
};

// @desc    Update complaint
// @route   PUT /api/complaints/:id
// @access  Private
const updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      complaint_type,
      complaint_description,
      priority,
      scheduled_date,
      selected_service_charge,
      parts_amount
    } = req.body;

    // Check if complaint exists
    const existingComplaint = await query(
      'SELECT * FROM complaints WHERE complaint_id = $1',
      [id]
    );

    if (existingComplaint.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramCount = 1;

    if (complaint_type !== undefined) {
      updates.push(`complaint_type = $${paramCount}`);
      params.push(complaint_type);
      paramCount++;
    }

    if (complaint_description !== undefined) {
      updates.push(`complaint_description = $${paramCount}`);
      params.push(complaint_description);
      paramCount++;
    }

    if (priority !== undefined) {
      updates.push(`priority = $${paramCount}`);
      params.push(priority);
      paramCount++;
    }

    if (scheduled_date !== undefined) {
      updates.push(`scheduled_date = $${paramCount}`);
      params.push(scheduled_date);
      paramCount++;
    }

    if (selected_service_charge !== undefined) {
      updates.push(`selected_service_charge = $${paramCount}`);
      params.push(selected_service_charge);
      paramCount++;
    }

    if (parts_amount !== undefined) {
      updates.push(`parts_amount = $${paramCount}`);
      params.push(parts_amount);
      paramCount++;
    }

    // Calculate total service amount
    const serviceCharge = selected_service_charge || existingComplaint.rows[0].selected_service_charge || 0;
    const partsCharge = parts_amount || existingComplaint.rows[0].parts_amount || 0;
    const totalAmount = parseFloat(serviceCharge) + parseFloat(partsCharge);

    updates.push(`total_service_amount = $${paramCount}`);
    params.push(totalAmount);
    paramCount++;

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length === 1) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(id);

    const result = await query(`
      UPDATE complaints 
      SET ${updates.join(', ')}
      WHERE complaint_id = $${paramCount}
      RETURNING *
    `, params);

    res.json({
      success: true,
      message: 'Complaint updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update complaint'
    });
  }
};

// @desc    Assign technician to complaint
// @route   PATCH /api/complaints/:id/assign
// @access  Private (Admin, Manager)
const assignTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    const { technician_id } = req.body;

    if (!technician_id) {
      return res.status(400).json({
        success: false,
        message: 'Technician ID is required'
      });
    }

    // Verify technician exists and has correct role
    const techCheck = await query(
      'SELECT user_id, full_name, role, is_active FROM users WHERE user_id = $1',
      [technician_id]
    );

    if (techCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Technician not found'
      });
    }

    const technician = techCheck.rows[0];

    if (technician.role !== 'technician') {
      return res.status(400).json({
        success: false,
        message: 'Selected user is not a technician'
      });
    }

    if (!technician.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Technician account is inactive'
      });
    }

    // Check if complaint exists
    const complaintCheck = await query(
      'SELECT complaint_id, status FROM complaints WHERE complaint_id = $1',
      [id]
    );

    if (complaintCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Update complaint
    const result = await query(`
      UPDATE complaints 
      SET 
        assigned_technician = $1,
        status = CASE 
          WHEN status = 'Open' THEN 'Assigned'
          ELSE status
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE complaint_id = $2
      RETURNING *
    `, [technician_id, id]);

    res.json({
      success: true,
      message: `Complaint assigned to ${technician.full_name}`,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Assign technician error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign technician'
    });
  }
};

// @desc    Update complaint status
// @route   PATCH /api/complaints/:id/status
// @access  Private
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Open', 'Assigned', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Check complaint exists
    const complaintCheck = await query(
      'SELECT complaint_id, assigned_technician FROM complaints WHERE complaint_id = $1',
      [id]
    );

    if (complaintCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // If technician, can only update their assigned complaints
    if (req.user.role === 'technician' && 
        complaintCheck.rows[0].assigned_technician !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update status of your assigned complaints'
      });
    }

    // Update with completion date if status is Completed
    const updateQuery = status === 'Completed' ? `
      UPDATE complaints 
      SET 
        status = $1,
        completion_date = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE complaint_id = $2
      RETURNING *
    ` : `
      UPDATE complaints 
      SET 
        status = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE complaint_id = $2
      RETURNING *
    `;

    const result = await query(updateQuery, [status, id]);

    res.json({
      success: true,
      message: 'Complaint status updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update complaint status'
    });
  }
};

// @desc    Delete complaint
// @route   DELETE /api/complaints/:id
// @access  Private (Admin only)
const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if complaint exists
    const complaintCheck = await query(
      'SELECT complaint_id FROM complaints WHERE complaint_id = $1',
      [id]
    );

    if (complaintCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check if complaint has related invoices
    const invoiceCheck = await query(
      'SELECT invoice_id FROM invoices WHERE complaint_id = $1',
      [id]
    );

    if (invoiceCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete complaint with associated invoices'
      });
    }

    // Delete complaint
    await query('DELETE FROM complaints WHERE complaint_id = $1', [id]);

    res.json({
      success: true,
      message: 'Complaint deleted successfully'
    });

  } catch (error) {
    console.error('Delete complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete complaint'
    });
  }
};

// @desc    Get complaint statistics
// @route   GET /api/complaints/stats
// @access  Private
const getComplaintStats = async (req, res) => {
  try {
    const { area_id, technician_id } = req.query;

    let whereClause = '';
    const params = [];

    if (area_id) {
      whereClause = 'WHERE area_id = $1';
      params.push(area_id);
    } else if (technician_id) {
      whereClause = 'WHERE assigned_technician = $1';
      params.push(technician_id);
    } else if (req.user.role === 'technician') {
      whereClause = 'WHERE assigned_technician = $1';
      params.push(req.user.user_id);
    }

    const stats = await query(`
      SELECT 
        COUNT(*) as total_complaints,
        COUNT(CASE WHEN status = 'Open' THEN 1 END) as open,
        COUNT(CASE WHEN status = 'Assigned' THEN 1 END) as assigned,
        COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'On Hold' THEN 1 END) as on_hold,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN warranty_status = 'In Warranty' THEN 1 END) as in_warranty,
        COUNT(CASE WHEN warranty_status = 'Out of Warranty' THEN 1 END) as out_of_warranty,
        AVG(CASE WHEN completion_date IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (completion_date - complaint_date))/3600 
          END) as avg_resolution_hours
      FROM complaints
      ${whereClause}
    `, params);

    res.json({
      success: true,
      data: stats.rows[0]
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaint statistics'
    });
  }
};

module.exports = {
  getComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  assignTechnician,
  updateStatus,
  deleteComplaint,
  getComplaintStats
};