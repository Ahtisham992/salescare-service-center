// backend/controllers/requisitionController.js
const { query, transaction } = require('../config/database');
const { generateMRQSNumber, generateMRTSNumber } = require('../utils/autoNumber');
const { validateMRQS, validateMRTS } = require('../utils/validators');
const { checkStockAvailability, processMRQSIssue, processMRTSReturn } = require('../services/inventoryService');

// ============================================
// MRQS (Material Requisition Slip) Operations
// ============================================

// @desc    Get all MRQS with filters
// @route   GET /api/requisitions/mrqs
// @access  Private
const getAllMRQS = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      complaint_id,
      technician_id,
      area_id,
      date_from,
      date_to
    } = req.query;

    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (status) {
      conditions.push(`m.status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    if (complaint_id) {
      conditions.push(`m.complaint_id = $${paramCount}`);
      params.push(complaint_id);
      paramCount++;
    }

    if (technician_id) {
      conditions.push(`m.technician_id = $${paramCount}`);
      params.push(technician_id);
      paramCount++;
    }

    if (area_id) {
      conditions.push(`m.area_id = $${paramCount}`);
      params.push(area_id);
      paramCount++;
    }

    if (date_from) {
      conditions.push(`m.mrqs_date >= $${paramCount}`);
      params.push(date_from);
      paramCount++;
    }

    if (date_to) {
      conditions.push(`m.mrqs_date <= $${paramCount}`);
      params.push(date_to);
      paramCount++;
    }

    // Technicians can only see their own MRQS
    if (req.user.role === 'technician') {
      conditions.push(`m.technician_id = $${paramCount}`);
      params.push(req.user.user_id);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total FROM material_requisitions m ${whereClause}
    `, params);

    const totalMRQS = parseInt(countResult.rows[0].total);

    // Get MRQS list
    params.push(limit, offset);

    const result = await query(`
      SELECT 
        m.mrqs_id,
        m.mrqs_number,
        m.complaint_id,
        m.status,
        m.mrqs_date,
        m.created_at,
        c.complaint_number,
        c.status as complaint_status,
        cust.name as customer_name,
        p.product_name,
        tech.full_name as technician_name,
        oa.area_name,
        (
          SELECT SUM(mi.amount)
          FROM mrqs_items mi
          WHERE mi.mrqs_id = m.mrqs_id
        ) as total_amount,
        (
          SELECT COUNT(*)
          FROM mrqs_items mi
          WHERE mi.mrqs_id = m.mrqs_id
        ) as items_count
      FROM material_requisitions m
      JOIN complaints c ON m.complaint_id = c.complaint_id
      JOIN customers cust ON c.customer_id = cust.customer_id
      JOIN products p ON c.product_id = p.product_id
      JOIN users tech ON m.technician_id = tech.user_id
      JOIN operational_areas oa ON m.area_id = oa.area_id
      ${whereClause}
      ORDER BY m.mrqs_date DESC, m.mrqs_id DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `, params);

    res.json({
      success: true,
      data: {
        mrqs_list: result.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalMRQS / limit),
          total_items: totalMRQS,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all MRQS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch MRQS list'
    });
  }
};

// @desc    Get single MRQS by ID
// @route   GET /api/requisitions/mrqs/:id
// @access  Private
const getMRQSById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get MRQS header
    const mrqsResult = await query(`
      SELECT 
        m.*,
        c.complaint_number,
        c.complaint_description,
        cust.name as customer_name,
        cust.phone as customer_phone,
        p.product_name,
        tech.full_name as technician_name,
        tech.phone as technician_phone,
        oa.area_name
      FROM material_requisitions m
      JOIN complaints c ON m.complaint_id = c.complaint_id
      JOIN customers cust ON c.customer_id = cust.customer_id
      JOIN products p ON c.product_id = p.product_id
      JOIN users tech ON m.technician_id = tech.user_id
      JOIN operational_areas oa ON m.area_id = oa.area_id
      WHERE m.mrqs_id = $1
    `, [id]);

    if (mrqsResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'MRQS not found'
      });
    }

    // Get MRQS items
    const itemsResult = await query(`
      SELECT 
        mi.*,
        it.item_code,
        it.description,
        it.category
      FROM mrqs_items mi
      JOIN items it ON mi.item_id = it.item_id
      WHERE mi.mrqs_id = $1
      ORDER BY mi.mrqs_item_id
    `, [id]);

    res.json({
      success: true,
      data: {
        ...mrqsResult.rows[0],
        items: itemsResult.rows
      }
    });

  } catch (error) {
    console.error('Get MRQS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch MRQS details'
    });
  }
};

// @desc    Create new MRQS
// @route   POST /api/requisitions/mrqs
// @access  Private
const createMRQS = async (req, res) => {
  try {
    const { complaint_id, area_id, items } = req.body;

    // Validation
    const validation = validateMRQS(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Verify complaint exists and get details
    const complaintCheck = await query(`
      SELECT c.complaint_id, c.status, c.area_id
      FROM complaints c
      WHERE c.complaint_id = $1
    `, [complaint_id]);

    if (complaintCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    const complaint = complaintCheck.rows[0];

    if (complaint.status === 'Completed' || complaint.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot create MRQS for completed or cancelled complaint'
      });
    }

    // Verify area
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

    // Verify all items exist and get prices
    const itemChecks = await Promise.all(
      items.map(item => 
        query('SELECT item_id, unit_price FROM items WHERE item_id = $1', [item.item_id])
      )
    );

    for (let i = 0; i < itemChecks.length; i++) {
      if (itemChecks[i].rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Item with ID ${items[i].item_id} not found`
        });
      }
    }

    // Generate MRQS number
    const mrqsNumber = await generateMRQSNumber();

    // Create MRQS in transaction
    const result = await transaction(async (client) => {
      // Insert MRQS header
      const mrqsResult = await client.query(`
        INSERT INTO material_requisitions (
          mrqs_number,
          complaint_id,
          technician_id,
          area_id,
          status
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [mrqsNumber, complaint_id, req.user.user_id, area_id, 'Pending']);

      const mrqsId = mrqsResult.rows[0].mrqs_id;

      // Insert MRQS items
      const mrqsItems = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const unitPrice = itemChecks[i].rows[0].unit_price;
        const amount = item.quantity * unitPrice;

        const itemResult = await client.query(`
          INSERT INTO mrqs_items (
            mrqs_id,
            item_id,
            quantity,
            unit_price,
            item_status,
            amount
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `, [mrqsId, item.item_id, item.quantity, unitPrice, item.item_status, amount]);

        mrqsItems.push(itemResult.rows[0]);
      }

      return {
        mrqs: mrqsResult.rows[0],
        items: mrqsItems
      };
    });

    res.status(201).json({
      success: true,
      message: 'MRQS created successfully',
      data: result
    });

  } catch (error) {
    console.error('Create MRQS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create MRQS'
    });
  }
};

// @desc    Approve MRQS
// @route   PATCH /api/requisitions/mrqs/:id/approve
// @access  Private (Admin, Manager)
const approveMRQS = async (req, res) => {
  try {
    const { id } = req.params;

    // Get MRQS details
    const mrqsCheck = await query(`
      SELECT m.*, 
        (SELECT json_agg(mi.*) FROM mrqs_items mi WHERE mi.mrqs_id = m.mrqs_id) as items
      FROM material_requisitions m
      WHERE m.mrqs_id = $1
    `, [id]);

    if (mrqsCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'MRQS not found'
      });
    }

    const mrqs = mrqsCheck.rows[0];

    if (mrqs.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `MRQS is already ${mrqs.status.toLowerCase()}`
      });
    }

    // Check stock availability
    const stockCheck = await checkStockAvailability(mrqs.items, mrqs.area_id);

    if (!stockCheck.available) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock for some items',
        data: {
          unavailable_items: stockCheck.unavailableItems
        }
      });
    }

    // Update status to Approved
    await query(`
      UPDATE material_requisitions
      SET status = 'Approved'
      WHERE mrqs_id = $1
    `, [id]);

    res.json({
      success: true,
      message: 'MRQS approved successfully. Ready to issue materials.'
    });

  } catch (error) {
    console.error('Approve MRQS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve MRQS'
    });
  }
};

// @desc    Issue materials (deduct from inventory)
// @route   PATCH /api/requisitions/mrqs/:id/issue
// @access  Private (Admin, Manager)
const issueMRQS = async (req, res) => {
  try {
    const { id } = req.params;

    // Get MRQS details
    const mrqsCheck = await query(`
      SELECT m.*, 
        (SELECT json_agg(mi.*) FROM mrqs_items mi WHERE mi.mrqs_id = m.mrqs_id) as items
      FROM material_requisitions m
      WHERE m.mrqs_id = $1
    `, [id]);

    if (mrqsCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'MRQS not found'
      });
    }

    const mrqs = mrqsCheck.rows[0];

    if (mrqs.status !== 'Approved') {
      return res.status(400).json({
        success: false,
        message: 'MRQS must be approved before issuing materials'
      });
    }

    // Process inventory deduction
    const inventoryResults = await processMRQSIssue(
      mrqs.mrqs_id,
      mrqs.mrqs_number,
      mrqs.items,
      mrqs.area_id,
      req.user.user_id
    );

    // Update MRQS status to Issued
    await query(`
      UPDATE material_requisitions
      SET status = 'Issued'
      WHERE mrqs_id = $1
    `, [id]);

    // Update complaint parts amount
    const totalPartsAmount = mrqs.items.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    
    await query(`
      UPDATE complaints
      SET 
        parts_amount = COALESCE(parts_amount, 0) + $1,
        total_service_amount = COALESCE(selected_service_charge, 0) + COALESCE(parts_amount, 0) + $1
      WHERE complaint_id = $2
    `, [totalPartsAmount, mrqs.complaint_id]);

    res.json({
      success: true,
      message: 'Materials issued successfully. Inventory updated.',
      data: {
        inventory_changes: inventoryResults
      }
    });

  } catch (error) {
    console.error('Issue MRQS error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to issue materials'
    });
  }
};

// @desc    Reject MRQS
// @route   PATCH /api/requisitions/mrqs/:id/reject
// @access  Private (Admin, Manager)
const rejectMRQS = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      UPDATE material_requisitions
      SET status = 'Rejected'
      WHERE mrqs_id = $1 AND status = 'Pending'
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'MRQS not found or already processed'
      });
    }

    res.json({
      success: true,
      message: 'MRQS rejected',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Reject MRQS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject MRQS'
    });
  }
};

// ============================================
// MRTS (Material Return Slip) Operations
// ============================================

// @desc    Get all MRTS with filters
// @route   GET /api/requisitions/mrts
// @access  Private
const getAllMRTS = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      complaint_id,
      technician_id,
      area_id,
      date_from,
      date_to
    } = req.query;

    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (complaint_id) {
      conditions.push(`m.complaint_id = $${paramCount}`);
      params.push(complaint_id);
      paramCount++;
    }

    if (technician_id) {
      conditions.push(`m.technician_id = $${paramCount}`);
      params.push(technician_id);
      paramCount++;
    }

    if (area_id) {
      conditions.push(`m.area_id = $${paramCount}`);
      params.push(area_id);
      paramCount++;
    }

    if (date_from) {
      conditions.push(`m.mrts_date >= $${paramCount}`);
      params.push(date_from);
      paramCount++;
    }

    if (date_to) {
      conditions.push(`m.mrts_date <= $${paramCount}`);
      params.push(date_to);
      paramCount++;
    }

    if (req.user.role === 'technician') {
      conditions.push(`m.technician_id = $${paramCount}`);
      params.push(req.user.user_id);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(`
      SELECT COUNT(*) as total FROM material_returns m ${whereClause}
    `, params);

    const totalMRTS = parseInt(countResult.rows[0].total);

    params.push(limit, offset);

    const result = await query(`
      SELECT 
        m.mrts_id,
        m.mrts_number,
        m.complaint_id,
        m.mrts_date,
        m.created_at,
        c.complaint_number,
        cust.name as customer_name,
        p.product_name,
        tech.full_name as technician_name,
        oa.area_name,
        (SELECT SUM(mi.amount) FROM mrts_items mi WHERE mi.mrts_id = m.mrts_id) as total_amount,
        (SELECT COUNT(*) FROM mrts_items mi WHERE mi.mrts_id = m.mrts_id) as items_count
      FROM material_returns m
      JOIN complaints c ON m.complaint_id = c.complaint_id
      JOIN customers cust ON c.customer_id = cust.customer_id
      JOIN products p ON c.product_id = p.product_id
      JOIN users tech ON m.technician_id = tech.user_id
      JOIN operational_areas oa ON m.area_id = oa.area_id
      ${whereClause}
      ORDER BY m.mrts_date DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `, params);

    res.json({
      success: true,
      data: {
        mrts_list: result.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalMRTS / limit),
          total_items: totalMRTS,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all MRTS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch MRTS list'
    });
  }
};

// @desc    Get single MRTS by ID
// @route   GET /api/requisitions/mrts/:id
// @access  Private
const getMRTSById = async (req, res) => {
  try {
    const { id } = req.params;

    const mrtsResult = await query(`
      SELECT 
        m.*,
        c.complaint_number,
        cust.name as customer_name,
        p.product_name,
        tech.full_name as technician_name,
        oa.area_name
      FROM material_returns m
      JOIN complaints c ON m.complaint_id = c.complaint_id
      JOIN customers cust ON c.customer_id = cust.customer_id
      JOIN products p ON c.product_id = p.product_id
      JOIN users tech ON m.technician_id = tech.user_id
      JOIN operational_areas oa ON m.area_id = oa.area_id
      WHERE m.mrts_id = $1
    `, [id]);

    if (mrtsResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'MRTS not found'
      });
    }

    const itemsResult = await query(`
      SELECT 
        mi.*,
        it.item_code,
        it.description
      FROM mrts_items mi
      JOIN items it ON mi.item_id = it.item_id
      WHERE mi.mrts_id = $1
    `, [id]);

    res.json({
      success: true,
      data: {
        ...mrtsResult.rows[0],
        items: itemsResult.rows
      }
    });

  } catch (error) {
    console.error('Get MRTS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch MRTS details'
    });
  }
};

// @desc    Create new MRTS
// @route   POST /api/requisitions/mrts
// @access  Private
const createMRTS = async (req, res) => {
  try {
    const { complaint_id, area_id, items } = req.body;

    const validation = validateMRTS(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Verify complaint
    const complaintCheck = await query(
      'SELECT complaint_id FROM complaints WHERE complaint_id = $1',
      [complaint_id]
    );

    if (complaintCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Verify items and get prices
    const itemChecks = await Promise.all(
      items.map(item => 
        query('SELECT item_id, unit_price FROM items WHERE item_id = $1', [item.item_id])
      )
    );

    for (let i = 0; i < itemChecks.length; i++) {
      if (itemChecks[i].rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Item with ID ${items[i].item_id} not found`
        });
      }
    }

    const mrtsNumber = await generateMRTSNumber();

    // Create MRTS and add back to inventory
    const result = await transaction(async (client) => {
      // Insert MRTS header
      const mrtsResult = await client.query(`
        INSERT INTO material_returns (
          mrts_number,
          complaint_id,
          technician_id,
          area_id
        ) VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [mrtsNumber, complaint_id, req.user.user_id, area_id]);

      const mrtsId = mrtsResult.rows[0].mrts_id;

      // Insert MRTS items
      const mrtsItems = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const unitPrice = itemChecks[i].rows[0].unit_price;
        const amount = item.quantity * unitPrice;

        const itemResult = await client.query(`
          INSERT INTO mrts_items (
            mrts_id,
            item_id,
            quantity,
            unit_price,
            item_status,
            amount
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `, [mrtsId, item.item_id, item.quantity, unitPrice, item.item_status, amount]);

        mrtsItems.push(itemResult.rows[0]);
      }

      return {
        mrts: mrtsResult.rows[0],
        items: mrtsItems
      };
    });

    // Process inventory return (add back)
    await processMRTSReturn(
      result.mrts.mrts_id,
      result.mrts.mrts_number,
      result.items,
      area_id,
      req.user.user_id
    );

    // Update complaint parts amount
    const totalReturnAmount = result.items.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    
    await query(`
      UPDATE complaints
      SET 
        parts_amount = GREATEST(COALESCE(parts_amount, 0) - $1, 0),
        total_service_amount = COALESCE(selected_service_charge, 0) + GREATEST(COALESCE(parts_amount, 0) - $1, 0)
      WHERE complaint_id = $2
    `, [totalReturnAmount, complaint_id]);

    res.status(201).json({
      success: true,
      message: 'MRTS created successfully. Inventory updated.',
      data: result
    });

  } catch (error) {
    console.error('Create MRTS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create MRTS'
    });
  }
};

module.exports = {
  // MRQS
  getAllMRQS,
  getMRQSById,
  createMRQS,
  approveMRQS,
  issueMRQS,
  rejectMRQS,
  
  // MRTS
  getAllMRTS,
  getMRTSById,
  createMRTS
};