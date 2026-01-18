// backend/controllers/invoiceController.js
const { query, transaction } = require('../config/database');
const { generateInvoiceNumber } = require('../utils/autoNumber');
const {
  buildComplaintInvoiceItems,
  calculateInvoiceTotals,
  calculateLineItem
} = require('../services/invoiceService');

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
const getAllInvoices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      invoice_type,
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

    if (invoice_type) {
      conditions.push(`i.invoice_type = $${paramCount}`);
      params.push(invoice_type);
      paramCount++;
    }

    if (status) {
      conditions.push(`i.status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    if (area_id) {
      conditions.push(`i.area_id = $${paramCount}`);
      params.push(area_id);
      paramCount++;
    }

    if (date_from) {
      conditions.push(`i.invoice_date >= $${paramCount}`);
      params.push(date_from);
      paramCount++;
    }

    if (date_to) {
      conditions.push(`i.invoice_date <= $${paramCount}`);
      params.push(date_to);
      paramCount++;
    }

    if (search) {
      conditions.push(`(
        i.invoice_number ILIKE $${paramCount} OR
        i.customer_name ILIKE $${paramCount} OR
        c.complaint_number ILIKE $${paramCount}
      )`);
      params.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total FROM invoices i ${whereClause}
    `, params);

    const totalInvoices = parseInt(countResult.rows[0].total);

    // Get invoices
    params.push(limit, offset);

    const result = await query(`
      SELECT 
        i.invoice_id,
        i.invoice_number,
        i.invoice_type,
        i.invoice_date,
        i.customer_name,
        i.phone,
        i.status,
        i.subtotal,
        i.gst_total,
        i.fst_total,
        i.discount,
        i.net_amount,
        i.waive_off,
        oa.area_name,
        c.complaint_number,
        d.do_number,
        u.full_name as created_by_name,
        i.created_at
      FROM invoices i
      JOIN operational_areas oa ON i.area_id = oa.area_id
      LEFT JOIN complaints c ON i.complaint_id = c.complaint_id
      LEFT JOIN delivery_orders d ON i.do_id = d.do_id
      LEFT JOIN users u ON i.created_by = u.user_id
      ${whereClause}
      ORDER BY i.invoice_date DESC, i.invoice_id DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `, params);

    res.json({
      success: true,
      data: {
        invoices: result.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalInvoices / limit),
          total_items: totalInvoices,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices'
    });
  }
};

// @desc    Get invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get invoice header
    const invoiceResult = await query(`
      SELECT 
        i.*,
        oa.area_name,
        oa.area_code,
        c.complaint_number,
        c.product_id,
        p.product_name,
        cust.name as complaint_customer_name,
        cust.phone as complaint_customer_phone,
        cust.address as complaint_customer_address,
        d.do_number,
        u.full_name as created_by_name
      FROM invoices i
      JOIN operational_areas oa ON i.area_id = oa.area_id
      LEFT JOIN complaints c ON i.complaint_id = c.complaint_id
      LEFT JOIN products p ON c.product_id = p.product_id
      LEFT JOIN customers cust ON c.customer_id = cust.customer_id
      LEFT JOIN delivery_orders d ON i.do_id = d.do_id
      LEFT JOIN users u ON i.created_by = u.user_id
      WHERE i.invoice_id = $1
    `, [id]);

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Get invoice items
    const itemsResult = await query(`
      SELECT *
      FROM invoice_items
      WHERE invoice_id = $1
      ORDER BY invoice_item_id
    `, [id]);

    res.json({
      success: true,
      data: {
        ...invoiceResult.rows[0],
        items: itemsResult.rows
      }
    });

  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice details'
    });
  }
};

// @desc    Create complaint service invoice
// @route   POST /api/invoices/complaint
// @access  Private
const createComplaintInvoice = async (req, res) => {
  try {
    const {
      complaint_id,
      area_id,
      service_charge_type,
      additional_charges = {},
      discount = 0,
      waive_off = 0,
      payment_terms,
      is_co = false
    } = req.body;

    // Validation
    if (!complaint_id || !area_id) {
      return res.status(400).json({
        success: false,
        message: 'Complaint ID and area are required'
      });
    }

    // Check if complaint exists
    const complaintCheck = await query(`
      SELECT 
        c.*,
        cust.name as customer_name,
        cust.phone,
        cust.address,
        cust.cnic,
        p.product_name
      FROM complaints c
      JOIN customers cust ON c.customer_id = cust.customer_id
      JOIN products p ON c.product_id = p.product_id
      WHERE c.complaint_id = $1
    `, [complaint_id]);

    if (complaintCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    const complaint = complaintCheck.rows[0];

    // Check if complaint already has invoice
    const existingInvoice = await query(
      'SELECT invoice_id FROM invoices WHERE complaint_id = $1',
      [complaint_id]
    );

    if (existingInvoice.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invoice already exists for this complaint'
      });
    }

    // Get area code for invoice number
    const areaData = await query(
      'SELECT area_code FROM operational_areas WHERE area_id = $1',
      [area_id]
    );
    const areaCode = areaData.rows[0].area_code;

    // Build invoice items
    const invoiceItems = await buildComplaintInvoiceItems(
      complaint_id,
      service_charge_type,
      additional_charges
    );

    if (invoiceItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items to invoice. Please add service charges or parts'
      });
    }

    // Calculate totals
    const totals = calculateInvoiceTotals(invoiceItems, discount, waive_off);

    // Generate invoice number
    const baseNumber = await generateInvoiceNumber();
    const parts = baseNumber.split('-');
    const invoiceNumber = `${areaCode}-${parts[0]}-${parts[1]}`;

    // Create invoice in transaction
    const result = await transaction(async (client) => {
      // Insert invoice header
      const invoiceResult = await client.query(`
        INSERT INTO invoices (
          invoice_number,
          invoice_type,
          complaint_id,
          customer_id,
          customer_name,
          phone,
          address,
          cnic,
          area_id,
          subtotal,
          gst_total,
          fst_total,
          discount,
          net_amount,
          waive_off,
          payment_terms,
          status,
          is_co,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *
      `, [
        invoiceNumber,
        'Complaint Service',
        complaint_id,
        complaint.customer_id,
        complaint.customer_name,
        complaint.phone,
        complaint.address,
        complaint.cnic,
        area_id,
        totals.subtotal,
        totals.gst_total,
        totals.fst_total,
        totals.discount,
        totals.net_amount,
        totals.waive_off,
        payment_terms || null,
        'Issued',
        is_co,
        req.user.user_id
      ]);

      const invoiceId = invoiceResult.rows[0].invoice_id;

      // Insert invoice items
      const insertedItems = [];
      for (const item of invoiceItems) {
        const itemCalc = calculateLineItem(
          item.quantity,
          item.rate_per_unit,
          item.gst_percentage,
          item.fst_percentage,
          item.discount
        );

        const itemResult = await client.query(`
          INSERT INTO invoice_items (
            invoice_id,
            item_type,
            description,
            quantity,
            rate_per_unit,
            amount,
            gst_percentage,
            gst_amount,
            fst_percentage,
            fst_amount,
            discount,
            net_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *
        `, [
          invoiceId,
          item.item_type,
          item.description,
          item.quantity,
          item.rate_per_unit,
          itemCalc.amount,
          item.gst_percentage,
          itemCalc.gst_amount,
          item.fst_percentage,
          itemCalc.fst_amount,
          itemCalc.discount,
          itemCalc.net_amount
        ]);

        insertedItems.push(itemResult.rows[0]);
      }

      // Update complaint status to completed if not already
      if (complaint.status !== 'Completed') {
        await client.query(`
          UPDATE complaints
          SET 
            status = 'Completed',
            completion_date = CURRENT_TIMESTAMP
          WHERE complaint_id = $1
        `, [complaint_id]);
      }

      return {
        invoice: invoiceResult.rows[0],
        items: insertedItems
      };
    });

    res.status(201).json({
      success: true,
      message: 'Complaint invoice created successfully',
      data: result
    });

  } catch (error) {
    console.error('Create complaint invoice error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create complaint invoice'
    });
  }
};

// @desc    Create counter sale invoice
// @route   POST /api/invoices/counter-sale
// @access  Private
const createCounterSaleInvoice = async (req, res) => {
  try {
    const {
      do_id,
      area_id,
      discount = 0,
      waive_off = 0,
      payment_terms,
      is_co = false
    } = req.body;

    // Validation
    if (!do_id || !area_id) {
      return res.status(400).json({
        success: false,
        message: 'Delivery order ID and area are required'
      });
    }

    // Get delivery order
    const doCheck = await query(`
      SELECT 
        d.*,
        (SELECT json_agg(di.*) FROM do_items di WHERE di.do_id = d.do_id) as items
      FROM delivery_orders d
      WHERE d.do_id = $1
    `, [do_id]);

    if (doCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery order not found'
      });
    }

    const deliveryOrder = doCheck.rows[0];

    if (deliveryOrder.status !== 'Delivered') {
      return res.status(400).json({
        success: false,
        message: 'Delivery order must be delivered before invoicing'
      });
    }

    // Check if DO already has invoice
    const existingInvoice = await query(
      'SELECT invoice_id FROM invoices WHERE do_id = $1',
      [do_id]
    );

    if (existingInvoice.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invoice already exists for this delivery order'
      });
    }

    // Get area code
    const areaData = await query(
      'SELECT area_code FROM operational_areas WHERE area_id = $1',
      [area_id]
    );
    const areaCode = areaData.rows[0].area_code;

    // Build invoice items from DO items
    const invoiceItems = deliveryOrder.items.map(item => ({
      item_type: 'PRD',
      description: `Item ID: ${item.item_id}`, // Will be replaced with actual description
      quantity: item.quantity,
      rate_per_unit: parseFloat(item.unit_price),
      gst_percentage: parseFloat(item.gst_percentage),
      fst_percentage: 0,
      discount: 0
    }));

    // Get item descriptions
    for (let i = 0; i < invoiceItems.length; i++) {
      const itemId = deliveryOrder.items[i].item_id;
      const itemData = await query(
        'SELECT description FROM items WHERE item_id = $1',
        [itemId]
      );
      invoiceItems[i].description = itemData.rows[0].description;
    }

    // Calculate totals
    const totals = calculateInvoiceTotals(invoiceItems, discount, waive_off);

    // Generate invoice number
    const baseNumber = await generateInvoiceNumber();
    const parts = baseNumber.split('-');
    const invoiceNumber = `${areaCode}-${parts[0]}-${parts[1]}`;

    // Create invoice in transaction
    const result = await transaction(async (client) => {
      // Insert invoice header
      const invoiceResult = await client.query(`
        INSERT INTO invoices (
          invoice_number,
          invoice_type,
          do_id,
          customer_name,
          phone,
          address,
          cnic,
          area_id,
          subtotal,
          gst_total,
          fst_total,
          discount,
          net_amount,
          waive_off,
          payment_terms,
          status,
          is_co,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *
      `, [
        invoiceNumber,
        'Counter Sale',
        do_id,
        deliveryOrder.customer_name,
        deliveryOrder.phone,
        deliveryOrder.address,
        deliveryOrder.cnic,
        area_id,
        totals.subtotal,
        totals.gst_total,
        totals.fst_total,
        totals.discount,
        totals.net_amount,
        totals.waive_off,
        payment_terms || null,
        'Issued',
        is_co,
        req.user.user_id
      ]);

      const invoiceId = invoiceResult.rows[0].invoice_id;

      // Insert invoice items
      const insertedItems = [];
      for (const item of invoiceItems) {
        const itemCalc = calculateLineItem(
          item.quantity,
          item.rate_per_unit,
          item.gst_percentage,
          item.fst_percentage,
          item.discount
        );

        const itemResult = await client.query(`
          INSERT INTO invoice_items (
            invoice_id,
            item_type,
            description,
            quantity,
            rate_per_unit,
            amount,
            gst_percentage,
            gst_amount,
            fst_percentage,
            fst_amount,
            discount,
            net_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *
        `, [
          invoiceId,
          item.item_type,
          item.description,
          item.quantity,
          item.rate_per_unit,
          itemCalc.amount,
          item.gst_percentage,
          itemCalc.gst_amount,
          item.fst_percentage,
          itemCalc.fst_amount,
          itemCalc.discount,
          itemCalc.net_amount
        ]);

        insertedItems.push(itemResult.rows[0]);
      }

      return {
        invoice: invoiceResult.rows[0],
        items: insertedItems
      };
    });

    res.status(201).json({
      success: true,
      message: 'Counter sale invoice created successfully',
      data: result
    });

  } catch (error) {
    console.error('Create counter sale invoice error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create counter sale invoice'
    });
  }
};

// @desc    Update invoice status
// @route   PATCH /api/invoices/:id/status
// @access  Private (Admin, Manager)
const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Draft', 'Issued', 'Paid', 'Cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const result = await query(`
      UPDATE invoices
      SET status = $1
      WHERE invoice_id = $2
      RETURNING *
    `, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      message: 'Invoice status updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update invoice status'
    });
  }
};

// @desc    Get invoice statistics
// @route   GET /api/invoices/stats
// @access  Private
const getInvoiceStats = async (req, res) => {
  try {
    const { area_id, date_from, date_to } = req.query;

    let whereClause = '';
    const params = [];
    let paramCount = 1;

    if (area_id) {
      whereClause = `WHERE area_id = $${paramCount}`;
      params.push(area_id);
      paramCount++;
    }

    if (date_from) {
      whereClause += whereClause ? ' AND' : 'WHERE';
      whereClause += ` invoice_date >= $${paramCount}`;
      params.push(date_from);
      paramCount++;
    }

    if (date_to) {
      whereClause += whereClause ? ' AND' : 'WHERE';
      whereClause += ` invoice_date <= $${paramCount}`;
      params.push(date_to);
      paramCount++;
    }

    const stats = await query(`
      SELECT 
        COUNT(*) as total_invoices,
        COUNT(CASE WHEN invoice_type = 'Counter Sale' THEN 1 END) as counter_sales,
        COUNT(CASE WHEN invoice_type = 'Complaint Service' THEN 1 END) as service_invoices,
        COUNT(CASE WHEN status = 'Issued' THEN 1 END) as issued,
        COUNT(CASE WHEN status = 'Paid' THEN 1 END) as paid,
        COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled,
        COALESCE(SUM(net_amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'Paid' THEN net_amount ELSE 0 END), 0) as paid_amount,
        COALESCE(SUM(CASE WHEN status = 'Issued' THEN net_amount ELSE 0 END), 0) as pending_amount,
        COALESCE(AVG(net_amount), 0) as average_invoice_value
      FROM invoices
      ${whereClause}
    `, params);

    res.json({
      success: true,
      data: {
        ...stats.rows[0],
        total_revenue: parseFloat(stats.rows[0].total_revenue).toFixed(2),
        paid_amount: parseFloat(stats.rows[0].paid_amount).toFixed(2),
        pending_amount: parseFloat(stats.rows[0].pending_amount).toFixed(2),
        average_invoice_value: parseFloat(stats.rows[0].average_invoice_value).toFixed(2)
      }
    });

  } catch (error) {
    console.error('Get invoice stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice statistics'
    });
  }
};

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createComplaintInvoice,
  createCounterSaleInvoice,
  updateInvoiceStatus,
  getInvoiceStats
};