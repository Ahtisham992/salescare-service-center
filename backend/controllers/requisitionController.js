// backend/controllers/requisitionController.js
const { query, transaction } = require('../config/database');
const { generateMRQSNumber, generateMRTSNumber } = require('../utils/autoNumber');
const { validateMRQS, validateMRTS } = require('../utils/validators');
const { checkStockAvailability, processMRQSIssue, processMRTSReturn } = require('../services/inventoryService');
const { logApprovalAction } = require('./approvalController');

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
        oa.area_name,
        u.full_name as technician_name,
        (SELECT COALESCE(SUM(mi.amount), 0) FROM mrqs_items mi WHERE mi.mrqs_id = m.mrqs_id) as total_amount
      FROM material_requisitions m
      JOIN complaints c ON m.complaint_id = c.complaint_id
      JOIN customers cust ON c.customer_id = cust.customer_id
      JOIN products p ON c.product_id = p.product_id
      JOIN operational_areas oa ON m.area_id = oa.area_id
      LEFT JOIN users u ON m.technician_id = u.user_id
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
    console.error('Get MRQS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch MRQS list'
    });
  }
};

// @desc    Get MRQS by ID
// @route   GET /api/requisitions/mrqs/:id
// @access  Private
const getMRQSById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get MRQS details
    const mrqsResult = await query(`
      SELECT 
        m.*,
        c.complaint_number,
        c.warranty_status,
        cust.name as customer_name,
        p.product_name,
        oa.area_name,
        u.full_name as technician_name
      FROM material_requisitions m
      JOIN complaints c ON m.complaint_id = c.complaint_id
      JOIN customers cust ON c.customer_id = cust.customer_id
      JOIN products p ON c.product_id = p.product_id
      JOIN operational_areas oa ON m.area_id = oa.area_id
      LEFT JOIN users u ON m.technician_id = u.user_id
      WHERE m.mrqs_id = $1
    `, [id]);

    if (mrqsResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'MRQS not found'
      });
    }

    // Get items with current master price for display
    const itemsResult = await query(`
      SELECT 
        mi.*,
        it.item_code,
        it.description,
        it.category,
        it.unit_price as current_master_price,
        it.markup_percentage
      FROM mrqs_items mi
      JOIN items it ON mi.item_id = it.item_id
      WHERE mi.mrqs_id = $1
      ORDER BY mi.mrqs_item_id
    `, [id]);

    // Fix: If saved price is 0 (old data), recalculate with current prices
    const items = itemsResult.rows.map(item => {
        const effectivePrice = parseFloat(item.unit_price) === 0 
            ? parseFloat(item.current_master_price) 
            : parseFloat(item.unit_price);
            
        return {
            ...item,
            unit_price: effectivePrice,
            amount: parseFloat(item.amount) === 0 ? (effectivePrice * item.quantity) : parseFloat(item.amount)
        };
    });

    res.json({
      success: true,
      data: {
        ...mrqsResult.rows[0],
        items: items
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
    const { complaint_id, area_id, items, technician_id } = req.body;

    const validation = validateMRQS(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

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

    let assignedTechnician = req.user.user_id;
    if (['admin', 'manager'].includes(req.user.role) && technician_id) {
      assignedTechnician = technician_id;
    }

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

    // ✅ FIX #1: Fetch items with SELLING PRICE (cost + markup)
    const itemChecks = await Promise.all(
      items.map(item => 
        query(
          `SELECT 
             item_id, 
             unit_price as cost_price,
             markup_percentage,
             ROUND(unit_price * (1 + COALESCE(markup_percentage, 0) / 100.0), 2) as selling_price
           FROM items WHERE item_id = $1`,
          [item.item_id]
        )
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

    // Check stock availability
    const stockCheck = await checkStockAvailability(items, area_id);
    if (!stockCheck.available) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock',
        insufficientItems: stockCheck.insufficientItems
      });
    }

    const mrqsNumber = await generateMRQSNumber(area_id);

    const result = await transaction(async (client) => {
      const mrqsResult = await client.query(`
        INSERT INTO material_requisitions (
          mrqs_number,
          complaint_id,
          technician_id,
          area_id,
          status
        ) VALUES ($1, $2, $3, $4, 'Pending')
        RETURNING *
      `, [mrqsNumber, complaint_id, assignedTechnician, area_id]);

      const mrqsId = mrqsResult.rows[0].mrqs_id;

      const mrqsItems = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemData = itemChecks[i].rows[0];
        
        // ✅ FIX: Use SELLING PRICE instead of cost price
        const sellingPrice = parseFloat(itemData.selling_price);
        const amount = item.quantity * sellingPrice;

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
        `, [mrqsId, item.item_id, item.quantity, sellingPrice, item.item_status, amount]);

        mrqsItems.push(itemResult.rows[0]);
      }

      // Log approval action - commented out due to DB constraint issues
      // The approval_history table has a CHECK constraint that may not include 'Submitted'
      // await logApprovalAction({
      //   documentType: 'MRQS',
      //   documentId: mrqsId,
      //   documentNumber: mrqsNumber,
      //   action: 'Submitted',
      //   previousStatus: null,
      //   newStatus: 'Pending',
      //   performedBy: req.user.user_id,
      //   comments: 'MRQS created and pending approval'
      // });

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
    const { comments } = req.body;

    const mrqsCheck = await query(`
      SELECT mrqs_id, mrqs_number, status FROM material_requisitions WHERE mrqs_id = $1
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
        message: `Cannot approve MRQS with status: ${mrqs.status}`
      });
    }

    // ✅ FIX #2: Update status and return the updated MRQS
    const result = await transaction(async (client) => {
      // Update MRQS status
      const updateResult = await client.query(`
        UPDATE material_requisitions
        SET status = 'Approved'
        WHERE mrqs_id = $1
        RETURNING *
      `, [id]);

      // Log approval action (non-blocking - won't fail the approval if logging fails)
      try {
        await logApprovalAction({
          documentType: 'MRQS',
          documentId: id,
          documentNumber: mrqs.mrqs_number,
          action: 'Approved',
          previousStatus: 'Pending',
          newStatus: 'Approved',
          performedBy: req.user.user_id,
          comments: comments
        });
      } catch (logError) {
        console.error('Failed to log approval action (non-critical):', logError.message);
      }

      // Fetch complete MRQS data to return
      const completeResult = await client.query(`
        SELECT 
          m.*,
          c.complaint_number,
          p.product_name,
          oa.area_name,
          u.full_name as technician_name
        FROM material_requisitions m
        JOIN complaints c ON m.complaint_id = c.complaint_id
        JOIN products p ON c.product_id = p.product_id
        JOIN operational_areas oa ON m.area_id = oa.area_id
        LEFT JOIN users u ON m.technician_id = u.user_id
        WHERE m.mrqs_id = $1
      `, [id]);

      return completeResult.rows[0];
    });

    res.json({
      success: true,
      message: 'MRQS Approved Successfully',
      data: result
    });

  } catch (error) {
    console.error('Approve MRQS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve MRQS'
    });
  }
};

// @desc    Reject MRQS
// @route   PATCH /api/requisitions/mrqs/:id/reject
// @access  Private (Admin, Manager)
const rejectMRQS = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    if (!rejection_reason || !rejection_reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const mrqsCheck = await query(`
      SELECT mrqs_id, mrqs_number, status FROM material_requisitions WHERE mrqs_id = $1
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
        message: `Cannot reject MRQS with status: ${mrqs.status}`
      });
    }

    // ✅ FIX #2: Update status and return the updated MRQS
    const result = await transaction(async (client) => {
      // Update MRQS status
      const updateResult = await client.query(`
        UPDATE material_requisitions
        SET status = 'Rejected'
        WHERE mrqs_id = $1
        RETURNING *
      `, [id]);

      // Log approval action (non-blocking - won't fail the rejection if logging fails)
      try {
        await logApprovalAction({
          documentType: 'MRQS',
          documentId: id,
          documentNumber: mrqs.mrqs_number,
          action: 'Rejected',
          previousStatus: 'Pending',
          newStatus: 'Rejected',
          performedBy: req.user.user_id,
          rejectionReason: rejection_reason
        });
      } catch (logError) {
        console.error('Failed to log approval action (non-critical):', logError.message);
      }

      // Fetch complete MRQS data to return
      const completeResult = await client.query(`
        SELECT 
          m.*,
          c.complaint_number,
          p.product_name,
          oa.area_name,
          u.full_name as technician_name
        FROM material_requisitions m
        JOIN complaints c ON m.complaint_id = c.complaint_id
        JOIN products p ON c.product_id = p.product_id
        JOIN operational_areas oa ON m.area_id = oa.area_id
        LEFT JOIN users u ON m.technician_id = u.user_id
        WHERE m.mrqs_id = $1
      `, [id]);

      return completeResult.rows[0];
    });

    res.json({
      success: true,
      message: 'MRQS Rejected',
      data: result
    });

  } catch (error) {
    console.error('Reject MRQS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject MRQS'
    });
  }
};

// @desc    Issue materials for MRQS
// @route   PATCH /api/requisitions/mrqs/:id/issue
// @access  Private (Admin, Manager)
const issueMRQS = async (req, res) => {
  try {
    const { id } = req.params;

    const mrqsCheck = await query(`
      SELECT 
        m.mrqs_id,
        m.mrqs_number,
        m.status,
        m.complaint_id,
        m.area_id
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
        message: `Cannot issue MRQS with status: ${mrqs.status}. Must be Approved first.`
      });
    }

    const itemsResult = await query(`
      SELECT * FROM mrqs_items WHERE mrqs_id = $1
    `, [id]);

    const stockCheck = await checkStockAvailability(
      itemsResult.rows.map(item => ({
        item_id: item.item_id,
        quantity: item.quantity
      })),
      mrqs.area_id
    );

    if (!stockCheck.available) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock to issue',
        insufficientItems: stockCheck.insufficientItems
      });
    }

    const result = await transaction(async (client) => {
      await client.query(`
        UPDATE material_requisitions
        SET status = 'Issued'
        WHERE mrqs_id = $1
      `, [id]);

      await processMRQSIssue(
        mrqs.mrqs_id,
        mrqs.mrqs_number,
        itemsResult.rows,
        mrqs.area_id,
        req.user.user_id
      );

      const totalAmount = itemsResult.rows.reduce(
        (sum, item) => sum + parseFloat(item.amount),
        0
      );

      await client.query(`
        UPDATE complaints
        SET 
          parts_amount = COALESCE(parts_amount, 0) + $1,
          total_service_amount = COALESCE(selected_service_charge, 0) + COALESCE(parts_amount, 0) + $1
        WHERE complaint_id = $2
      `, [totalAmount, mrqs.complaint_id]);

      // Note: No approval log for 'Issued' action as it's an operational step, not an approval step

      return { success: true };
    });

    res.json({
      success: true,
      message: 'Materials issued successfully. Inventory and complaint updated.'
    });

  } catch (error) {
    console.error('Issue MRQS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to issue materials'
    });
  }
};

// ============================================
// MRTS (Material Return Slip) Operations
// ============================================

// @desc    Get all MRTS
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

// ✅ NEW FUNCTION: Calculate Net Returnable Quantity (Issued - Returned)
const getReturnableItems = async (req, res) => {
  try {
    const { complaintId } = req.params;

    const result = await query(`
      WITH issued_items AS (
        SELECT mi.item_id, SUM(mi.quantity) as total_issued
        FROM mrqs_items mi
        JOIN material_requisitions m ON mi.mrqs_id = m.mrqs_id
        WHERE m.complaint_id = $1 AND m.status = 'Issued'
        GROUP BY mi.item_id
      ),
      returned_items AS (
        SELECT mti.item_id, SUM(mti.quantity) as total_returned
        FROM mrts_items mti
        JOIN material_returns m ON mti.mrts_id = m.mrts_id
        WHERE m.complaint_id = $1
        GROUP BY mti.item_id
      )
      SELECT 
        i.item_id, 
        i.item_code, 
        i.description, 
        i.unit_price,
        i.markup_percentage,
        ROUND(i.unit_price * (1 + COALESCE(i.markup_percentage, 0) / 100.0), 2) as selling_price,
        COALESCE(iss.total_issued, 0) as issued_qty,
        COALESCE(ret.total_returned, 0) as returned_qty,
        (COALESCE(iss.total_issued, 0) - COALESCE(ret.total_returned, 0)) as remaining_qty
      FROM issued_items iss
      LEFT JOIN returned_items ret ON iss.item_id = ret.item_id
      JOIN items i ON iss.item_id = i.item_id
      WHERE (COALESCE(iss.total_issued, 0) - COALESCE(ret.total_returned, 0)) > 0
    `, [complaintId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get returnable items error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch returnable items' });
  }
};

// @desc    Create new MRTS
// ✅ UPDATED: Validates that you cannot return more than you issued
const createMRTS = async (req, res) => {
  try {
    const { complaint_id, area_id, items } = req.body;
    const validation = validateMRTS(req.body);
    if (!validation.isValid) return res.status(400).json({ success: false, message: 'Validation failed', errors: validation.errors });

    // 1. Validation: Check if items are actually returnable
    for (const item of items) {
      const check = await query(`
        WITH stats AS (
          SELECT 
            COALESCE((SELECT SUM(quantity) FROM mrqs_items mi JOIN material_requisitions m ON mi.mrqs_id = m.mrqs_id WHERE m.complaint_id = $1 AND m.status = 'Issued' AND mi.item_id = $2), 0) as issued,
            COALESCE((SELECT SUM(quantity) FROM mrts_items mti JOIN material_returns m ON mti.mrts_id = m.mrts_id WHERE m.complaint_id = $1 AND mti.item_id = $2), 0) as returned
        )
        SELECT issued, returned, (issued - returned) as remaining FROM stats
      `, [complaint_id, item.item_id]);

      const remaining = parseFloat(check.rows[0]?.remaining || 0);
      
      if (item.quantity > remaining) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid Return: Item ID ${item.item_id}. You are returning ${item.quantity}, but only ${remaining} is available from previous issuance.` 
        });
      }
    }

    // 2. Fetch Prices
    const itemChecks = await Promise.all(items.map(item => 
      query(`
        SELECT item_id, unit_price, markup_percentage,
        ROUND(unit_price * (1 + COALESCE(markup_percentage, 0) / 100.0), 2) as selling_price
        FROM items WHERE item_id = $1
      `, [item.item_id])
    ));

    const mrtsNumber = await generateMRTSNumber();

    const result = await transaction(async (client) => {
      // 3. Create Header
      const mrtsResult = await client.query(`
        INSERT INTO material_returns (mrts_number, complaint_id, technician_id, area_id) 
        VALUES ($1, $2, $3, $4) RETURNING *
      `, [mrtsNumber, complaint_id, req.user.user_id, area_id]);

      const mrtsId = mrtsResult.rows[0].mrts_id;
      const mrtsItems = [];

      // 4. Create Items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemData = itemChecks[i].rows[0];

        // Refund Logic
        let priceToRefund;
        if (item.item_status === 'OPB' || item.item_status === 'Con P') {
           priceToRefund = parseFloat(itemData.selling_price);
        } else {
           priceToRefund = 0; 
        }

        const amount = item.quantity * priceToRefund;

        const itemResult = await client.query(`
          INSERT INTO mrts_items (mrts_id, item_id, quantity, unit_price, item_status, amount) 
          VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
        `, [mrtsId, item.item_id, item.quantity, priceToRefund, item.item_status, amount]);

        mrtsItems.push(itemResult.rows[0]);
      }
      return { mrts: mrtsResult.rows[0], items: mrtsItems };
    });

    // 5. Stock Back
    await processMRTSReturn(result.mrts.mrts_id, result.mrts.mrts_number, result.items, area_id, req.user.user_id);

    // 6. Update Financials
    const totalReturnAmount = result.items.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    if (totalReturnAmount > 0) {
      await query(`
        UPDATE complaints
        SET 
          parts_amount = GREATEST(COALESCE(parts_amount, 0) - $1, 0),
          total_service_amount = COALESCE(selected_service_charge, 0) + GREATEST(COALESCE(parts_amount, 0) - $1, 0)
        WHERE complaint_id = $2
      `, [totalReturnAmount, complaint_id]);
    }

    res.status(201).json({ success: true, message: 'MRTS created successfully', data: result });
  } catch (error) {
    console.error('Create MRTS error:', error);
    res.status(500).json({ success: false, message: 'Failed to create MRTS' });
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
  createMRTS,
  getReturnableItems 

};