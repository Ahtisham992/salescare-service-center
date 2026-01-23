// backend/controllers/purchaseController.js
const { query, transaction } = require('../config/database');
const { generatePONumber } = require('../utils/autoNumber');

// @desc    Get all purchase orders
// @route   GET /api/purchase-orders
// @access  Private
const getAllPurchaseOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      vendor_id,
      date_from,
      date_to,
      search
    } = req.query;

    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (status) {
      conditions.push(`po.status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    if (vendor_id) {
      conditions.push(`po.vendor_id = $${paramCount}`);
      params.push(vendor_id);
      paramCount++;
    }

    if (date_from) {
      conditions.push(`po.po_date >= $${paramCount}`);
      params.push(date_from);
      paramCount++;
    }

    if (date_to) {
      conditions.push(`po.po_date <= $${paramCount}`);
      params.push(date_to);
      paramCount++;
    }

    if (search) {
      conditions.push(`(
        po.po_number ILIKE $${paramCount} OR
        v.vendor_name ILIKE $${paramCount}
      )`);
      params.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total FROM purchase_orders po ${whereClause}
    `, params);

    const totalPOs = parseInt(countResult.rows[0].total);

    // Get purchase orders
    params.push(limit, offset);

    const result = await query(`
      SELECT 
        po.po_id,
        po.po_number,
        po.po_date,
        po.status,
        po.total_amount,
        po.created_at,
        v.vendor_id,
        v.vendor_name,
        v.vendor_code,
        v.vendor_type,
        u.full_name as created_by_name,
        (SELECT COUNT(*) FROM po_items WHERE po_id = po.po_id) as items_count,
        (
          SELECT COUNT(*) 
          FROM goods_receipts 
          WHERE po_id = po.po_id
        ) as gr_count
      FROM purchase_orders po
      JOIN vendors v ON po.vendor_id = v.vendor_id
      LEFT JOIN users u ON po.created_by = u.user_id
      ${whereClause}
      ORDER BY po.po_date DESC, po.po_id DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `, params);

    res.json({
      success: true,
      data: {
        purchase_orders: result.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalPOs / limit),
          total_items: totalPOs,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get purchase orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase orders'
    });
  }
};

// @desc    Get purchase order by ID
// @route   GET /api/purchase-orders/:id
// @access  Private
const getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Get PO Header
    const poResult = await query(`
      SELECT 
        po.*,
        v.vendor_name,
        v.vendor_code,
        v.vendor_type,
        v.contact_person,
        v.phone as vendor_phone,
        v.email as vendor_email,
        v.address as vendor_address,
        u.full_name as created_by_name
      FROM purchase_orders po
      JOIN vendors v ON po.vendor_id = v.vendor_id
      LEFT JOIN users u ON po.created_by = u.user_id
      WHERE po.po_id = $1
    `, [id]);

    if (poResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    // 2. Get PO items WITH "Received So Far" Calculation [UPDATED SECTION]
    const itemsResult = await query(`
      SELECT 
        pi.*,
        i.item_code,
        i.description,
        i.category,
        COALESCE((
          SELECT SUM(gi.quantity_received)
          FROM gr_items gi
          JOIN goods_receipts gr ON gi.gr_id = gr.gr_id
          WHERE gr.po_id = pi.po_id AND gi.item_id = pi.item_id
        ), 0) as received_so_far
      FROM po_items pi
      JOIN items i ON pi.item_id = i.item_id
      WHERE pi.po_id = $1
      ORDER BY pi.po_item_id
    `, [id]);

    res.json({
      success: true,
      data: {
        ...poResult.rows[0],
        items: itemsResult.rows // Now includes received_so_far
      }
    });

  } catch (error) {
    console.error('Get purchase order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase order details'
    });
  }
};

// @desc    Create purchase order
// @route   POST /api/purchase-orders
// @access  Private
const createPurchaseOrder = async (req, res) => {
  try {
    const {
      vendor_id,
      po_date,
      items
    } = req.body;

    // Validation
    if (!vendor_id || !po_date) {
      return res.status(400).json({
        success: false,
        message: 'Vendor and PO date are required'
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
      if (!item.item_id || !item.quantity || item.quantity <= 0 || !item.unit_price || item.unit_price < 0) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1}: Valid item ID, quantity, and unit price are required`
        });
      }
    }

    // Verify vendor exists
    const vendorCheck = await query(
      'SELECT vendor_id, is_active FROM vendors WHERE vendor_id = $1',
      [vendor_id]
    );

    if (vendorCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    if (!vendorCheck.rows[0].is_active) {
      return res.status(400).json({
        success: false,
        message: 'Vendor is inactive'
      });
    }

    // Verify all items exist
    const itemChecks = await Promise.all(
      items.map(item => 
        query('SELECT item_id FROM items WHERE item_id = $1', [item.item_id])
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

    // Generate PO number
    const poNumber = await generatePONumber();

    // Create PO in transaction
    const result = await transaction(async (client) => {
      // Calculate total
      let totalAmount = 0;

      // Insert PO header
      const poResult = await client.query(`
        INSERT INTO purchase_orders (
          po_number,
          vendor_id,
          po_date,
          status,
          created_by
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [poNumber, vendor_id, po_date, 'pending', req.user.user_id]);

      const poId = poResult.rows[0].po_id;

      // Insert PO items
      const poItems = [];
      for (const item of items) {
        const amount = item.quantity * item.unit_price;
        totalAmount += amount;

        const itemResult = await client.query(`
          INSERT INTO po_items (
            po_id,
            item_id,
            quantity,
            unit_price,
            status
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `, [
          poId,
          item.item_id,
          item.quantity,
          item.unit_price,
          item.status || 'Normal'
        ]);

        poItems.push(itemResult.rows[0]);
      }

      // Update PO total
      await client.query(`
        UPDATE purchase_orders
        SET total_amount = $1
        WHERE po_id = $2
      `, [totalAmount, poId]);

      return {
        po: { ...poResult.rows[0], total_amount: totalAmount },
        items: poItems
      };
    });

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: result
    });

  } catch (error) {
    console.error('Create purchase order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create purchase order'
    });
  }
};

// @desc    Approve purchase order
// @route   PATCH /api/purchase-orders/:id/approve
// @access  Private (Admin, Manager)
const approvePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      UPDATE purchase_orders
      SET status = 'approved'
      WHERE po_id = $1 AND status = 'pending'
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found or already processed'
      });
    }

    res.json({
      success: true,
      message: 'Purchase order approved successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Approve PO error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve purchase order'
    });
  }
};

// @desc    Cancel purchase order
// @route   PATCH /api/purchase-orders/:id/cancel
// @access  Private (Admin, Manager)
const cancelPurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if any goods received
    const grCheck = await query(
      'SELECT gr_id FROM goods_receipts WHERE po_id = $1 LIMIT 1',
      [id]
    );

    if (grCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel purchase order with goods receipts'
      });
    }

    const result = await query(`
      UPDATE purchase_orders
      SET status = 'cancelled'
      WHERE po_id = $1 AND status IN ('pending', 'approved')
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found or cannot be cancelled'
      });
    }

    res.json({
      success: true,
      message: 'Purchase order cancelled',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Cancel PO error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel purchase order'
    });
  }
};

// @desc    Delete purchase order
// @route   DELETE /api/purchase-orders/:id
// @access  Private (Admin only)
const deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if any goods received
    const grCheck = await query(
      'SELECT gr_id FROM goods_receipts WHERE po_id = $1 LIMIT 1',
      [id]
    );

    if (grCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete purchase order with goods receipts'
      });
    }

    const result = await query(
      'DELETE FROM purchase_orders WHERE po_id = $1 AND status = \'pending\' RETURNING po_number',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found or cannot be deleted'
      });
    }

    res.json({
      success: true,
      message: `Purchase order ${result.rows[0].po_number} deleted successfully`
    });

  } catch (error) {
    console.error('Delete PO error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete purchase order'
    });
  }
};

module.exports = {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  approvePurchaseOrder,
  cancelPurchaseOrder,
  deletePurchaseOrder
};