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
      items
    } = req.body;

    // Validation
    if (!customer_name || !phone || !area_id) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, phone, and area are required'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }

    // Validate all items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.item_id || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1}: Valid item ID and quantity are required`
        });
      }
    }

    // Check stock availability
    const stockCheck = await checkStockAvailability(items, area_id);

    if (!stockCheck.available) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock for some items',
        data: {
          unavailable_items: stockCheck.unavailableItems
        }
      });
    }

    // Get item prices
    const itemPrices = await Promise.all(
      items.map(item => 
        query('SELECT item_id, unit_price FROM items WHERE item_id = $1', [item.item_id])
      )
    );

    // Generate DO number
    const doNumber = await generateDONumber();

    // Create DO in transaction
    const result = await transaction(async (client) => {
      // Calculate total
      let totalAmount = 0;

      // Insert DO header
      const doResult = await client.query(`
        INSERT INTO delivery_orders (
          do_number,
          customer_name,
          phone,
          address,
          cnic,
          area_id,
          status,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        doNumber,
        customer_name,
        phone,
        address || null,
        cnic || null,
        area_id,
        'Pending',
        req.user.user_id
      ]);

      const doId = doResult.rows[0].do_id;

      // Insert DO items
      const doItems = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const unitPrice = parseFloat(itemPrices[i].rows[0].unit_price);
        const gstPercentage = item.gst_percentage || 18;
        
        const lineTotal = item.quantity * unitPrice;
        const gstAmount = (lineTotal * gstPercentage) / 100;
        const itemTotal = lineTotal + gstAmount;

        totalAmount += itemTotal;

        const itemResult = await client.query(`
          INSERT INTO do_items (
            do_id,
            item_id,
            quantity,
            unit_price,
            gst_percentage,
            gst_amount,
            line_total
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [
          doId,
          item.item_id,
          item.quantity,
          unitPrice,
          gstPercentage,
          gstAmount,
          itemTotal
        ]);

        doItems.push(itemResult.rows[0]);
      }

      // Update DO total
      await client.query(`
        UPDATE delivery_orders
        SET total_amount = $1
        WHERE do_id = $2
      `, [totalAmount, doId]);

      return {
        do: { ...doResult.rows[0], total_amount: totalAmount },
        items: doItems
      };
    });

    res.status(201).json({
      success: true,
      message: 'Delivery order created successfully',
      data: result
    });

  } catch (error) {
    console.error('Create delivery order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create delivery order'
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