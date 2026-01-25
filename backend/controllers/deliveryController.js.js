// backend/controllers/deliveryController.js
const { query, transaction } = require('../config/database');
const { generateDONumber } = require('../utils/autoNumber');
const { processDOIssue, checkStockAvailability } = require('../services/inventoryService');

// @desc    Get all delivery orders
// @route   GET /api/delivery-orders
// @access  Private
const getAllDeliveryOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      area_id,
      date_from,
      date_to,
      search
    } = req.query;

    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (status) {
      conditions.push(`d.status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    if (area_id) {
      conditions.push(`d.area_id = $${paramCount}`);
      params.push(area_id);
      paramCount++;
    }

    if (date_from) {
      conditions.push(`d.do_date >= $${paramCount}`);
      params.push(date_from);
      paramCount++;
    }

    if (date_to) {
      conditions.push(`d.do_date <= $${paramCount}`);
      params.push(date_to);
      paramCount++;
    }

    if (search) {
      conditions.push(`(
        d.do_number ILIKE $${paramCount} OR
        d.customer_name ILIKE $${paramCount} OR
        d.phone ILIKE $${paramCount}
      )`);
      params.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total FROM delivery_orders d ${whereClause}
    `, params);

    const totalDOs = parseInt(countResult.rows[0].total);

    // Get delivery orders
    params.push(limit, offset);

    const result = await query(`
      SELECT 
        d.do_id,
        d.do_number,
        d.customer_name,
        d.phone,
        d.address,
        d.do_date,
        d.status,
        d.total_amount,
        oa.area_name,
        u.full_name as created_by_name,
        d.created_at,
        (SELECT COUNT(*) FROM do_items WHERE do_id = d.do_id) as items_count
      FROM delivery_orders d
      JOIN operational_areas oa ON d.area_id = oa.area_id
      LEFT JOIN users u ON d.created_by = u.user_id
      ${whereClause}
      ORDER BY d.do_date DESC, d.do_id DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `, params);

    res.json({
      success: true,
      data: {
        delivery_orders: result.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalDOs / limit),
          total_items: totalDOs,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get delivery orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery orders'
    });
  }
};

// @desc    Get delivery order by ID
// @route   GET /api/delivery-orders/:id
// @access  Private
const getDeliveryOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get DO header
    const doResult = await query(`
      SELECT 
        d.*,
        oa.area_name,
        oa.area_code,
        u.full_name as created_by_name
      FROM delivery_orders d
      JOIN operational_areas oa ON d.area_id = oa.area_id
      LEFT JOIN users u ON d.created_by = u.user_id
      WHERE d.do_id = $1
    `, [id]);

    if (doResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery order not found'
      });
    }

    // Get DO items
    const itemsResult = await query(`
      SELECT 
        di.*,
        it.item_code,
        it.description,
        it.category
      FROM do_items di
      JOIN items it ON di.item_id = it.item_id
      WHERE di.do_id = $1
      ORDER BY di.do_item_id
    `, [id]);

    res.json({
      success: true,
      data: {
        ...doResult.rows[0],
        items: itemsResult.rows
      }
    });

  } catch (error) {
    console.error('Get delivery order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery order details'
    });
  }
};

// @desc    Create delivery order
// @route   POST /api/delivery-orders
// @access  Private

const createDeliveryOrder = async (req, res) => {
  try {
    const {
      customer_name,
      phone,
      address,
      cnic,
      area_id,
      items // [{ item_id, quantity, unit_price, gst_percentage }]
    } = req.body;

    // Validation
    if (!customer_name || !phone || !area_id || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, phone, area, and items are required'
      });
    }

    // STEP 1: Check if customer exists in customers table
    let customerId;
    
    const existingCustomer = await query(
      'SELECT customer_id FROM customers WHERE phone = $1',
      [phone]
    );

    if (existingCustomer.rows.length > 0) {
      // Customer exists, use existing customer_id
      customerId = existingCustomer.rows[0].customer_id;
      
      // Optionally update customer info if it changed
      await query(`
        UPDATE customers 
        SET name = $1, address = $2, cnic = $3, updated_at = CURRENT_TIMESTAMP
        WHERE customer_id = $4
      `, [customer_name, address, cnic, customerId]);
      
    } else {
      // STEP 2: Customer doesn't exist - CREATE NEW CUSTOMER
      const newCustomer = await query(`
        INSERT INTO customers (name, phone, address, cnic)
        VALUES ($1, $2, $3, $4)
        RETURNING customer_id
      `, [customer_name, phone, address, cnic]);
      
      customerId = newCustomer.rows[0].customer_id;
    }

    // Get area code for DO number
    const areaData = await query(
      'SELECT area_code FROM operational_areas WHERE area_id = $1',
      [area_id]
    );

    if (areaData.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Area not found'
      });
    }

    const areaCode = areaData.rows[0].area_code;

    // Generate DO number
    const doNumber = await generateDONumber(areaCode);

    // Calculate totals
    let totalAmount = 0;
    const processedItems = items.map(item => {
      const amount = parseFloat(item.quantity) * parseFloat(item.unit_price);
      const gstAmount = amount * (parseFloat(item.gst_percentage || 0) / 100);
      const lineTotal = amount + gstAmount;
      totalAmount += lineTotal;

      return {
        ...item,
        amount,
        gst_amount: gstAmount,
        line_total: lineTotal
      };
    });

    // Create DO in transaction
    const result = await transaction(async (client) => {
      // Insert delivery order
      const doResult = await client.query(`
        INSERT INTO delivery_orders (
          do_number,
          customer_name,
          phone,
          address,
          cnic,
          area_id,
          total_amount,
          status,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        doNumber,
        customer_name,
        phone,
        address,
        cnic,
        area_id,
        totalAmount,
        'Pending',
        req.user.user_id
      ]);

      const deliveryOrder = doResult.rows[0];

      // Insert DO items
      for (const item of processedItems) {
        await client.query(`
          INSERT INTO do_items (
            do_id,
            item_id,
            quantity,
            unit_price,
            gst_percentage,
            gst_amount,
            line_total
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          deliveryOrder.do_id,
          item.item_id,
          item.quantity,
          item.unit_price,
          item.gst_percentage || 0,
          item.gst_amount,
          item.line_total
        ]);
      }

      return deliveryOrder;
    });

    res.status(201).json({
      success: true,
      message: 'Delivery order created successfully. Customer added to database.',
      data: {
        ...result,
        customer_id: customerId // Return the customer ID for reference
      }
    });

  } catch (error) {
    console.error('Create delivery order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create delivery order'
    });
  }
};

// @desc    Mark delivery order as delivered (deduct inventory)
// @route   PATCH /api/delivery-orders/:id/deliver
// @access  Private (Admin, Manager)
const markAsDelivered = async (req, res) => {
  try {
    const { id } = req.params;

    // Get DO details
    const doCheck = await query(`
      SELECT d.*, 
        (SELECT json_agg(di.*) FROM do_items di WHERE di.do_id = d.do_id) as items
      FROM delivery_orders d
      WHERE d.do_id = $1
    `, [id]);

    if (doCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery order not found'
      });
    }

    const deliveryOrder = doCheck.rows[0];

    if (deliveryOrder.status === 'Delivered') {
      return res.status(400).json({
        success: false,
        message: 'Delivery order is already delivered'
      });
    }

    // Process inventory deduction
    const inventoryResults = await processDOIssue(
      deliveryOrder.do_id,
      deliveryOrder.do_number,
      deliveryOrder.items,
      deliveryOrder.area_id,
      req.user.user_id
    );

    // Update DO status
    await query(`
      UPDATE delivery_orders
      SET status = 'Delivered'
      WHERE do_id = $1
    `, [id]);

    res.json({
      success: true,
      message: 'Delivery order marked as delivered. Inventory updated.',
      data: {
        inventory_changes: inventoryResults
      }
    });

  } catch (error) {
    console.error('Mark delivered error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark as delivered'
    });
  }
};

// @desc    Cancel delivery order
// @route   PATCH /api/delivery-orders/:id/cancel
// @access  Private (Admin, Manager)
const cancelDeliveryOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      UPDATE delivery_orders
      SET status = 'Cancelled'
      WHERE do_id = $1 AND status = 'Pending'
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery order not found or already processed'
      });
    }

    res.json({
      success: true,
      message: 'Delivery order cancelled',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Cancel delivery order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel delivery order'
    });
  }
};

// @desc    Delete delivery order
// @route   DELETE /api/delivery-orders/:id
// @access  Private (Admin only)
const deleteDeliveryOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if DO has invoice
    const invoiceCheck = await query(
      'SELECT invoice_id FROM invoices WHERE do_id = $1',
      [id]
    );

    if (invoiceCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete delivery order with associated invoice'
      });
    }

    // Check if delivered
    const doCheck = await query(
      'SELECT status FROM delivery_orders WHERE do_id = $1',
      [id]
    );

    if (doCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery order not found'
      });
    }

    if (doCheck.rows[0].status === 'Delivered') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete delivered order'
      });
    }

    await query('DELETE FROM delivery_orders WHERE do_id = $1', [id]);

    res.json({
      success: true,
      message: 'Delivery order deleted successfully'
    });

  } catch (error) {
    console.error('Delete delivery order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete delivery order'
    });
  }
};

module.exports = {
  getAllDeliveryOrders,
  getDeliveryOrderById,
  createDeliveryOrder,
  markAsDelivered,
  cancelDeliveryOrder,
  deleteDeliveryOrder
};