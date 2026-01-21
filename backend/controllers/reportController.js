// backend/controllers/reportController.js
const { query } = require('../config/database');
const { validateDateRange, sanitizeQueryParams, formatReportMetadata } = require('../utils/reportHelpers');
const { buildWhereClause, getDateGrouping } = require('../services/reportService');

// ============================================
// DASHBOARD STATISTICS
// ============================================

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.user_id;

    // Complaint stats (filtered by role)
    let complaintWhere = '';
    let complaintParams = [];

    if (userRole === 'technician') {
      complaintWhere = 'WHERE assigned_technician = $1';
      complaintParams = [userId];
    }

    const complaints = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status IN ('Open', 'Assigned', 'In Progress') THEN 1 END) as active,
        COUNT(CASE WHEN status = 'Open' THEN 1 END) as open,
        COUNT(CASE WHEN status = 'Assigned' THEN 1 END) as assigned,
        COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN DATE(complaint_date) = CURRENT_DATE THEN 1 END) as today,
        COUNT(CASE WHEN warranty_status = 'In Warranty' THEN 1 END) as in_warranty,
        COUNT(CASE WHEN warranty_status = 'Out of Warranty' THEN 1 END) as out_of_warranty
      FROM complaints
      ${complaintWhere}
    `, complaintParams);

    // Revenue stats (last 30 days) - Admin & Manager only
    let revenueStats = null;
    if (['admin', 'manager'].includes(userRole)) {
      const revenue = await query(`
        SELECT 
          COUNT(*) as invoice_count,
          SUM(net_amount) as total_revenue,
          SUM(CASE WHEN status = 'Paid' THEN net_amount ELSE 0 END) as paid_amount,
          SUM(CASE WHEN status = 'Issued' THEN net_amount ELSE 0 END) as pending_amount,
          AVG(net_amount) as avg_invoice_value
        FROM invoices
        WHERE invoice_date >= CURRENT_DATE - INTERVAL '30 days'
      `);

      revenueStats = revenue.rows[0];
    }

    // Inventory stats
    const inventory = await query(`
      SELECT 
        COUNT(DISTINCT item_id) as total_items,
        SUM(quantity_in_hand) as total_quantity,
        COUNT(CASE WHEN quantity_in_hand <= 5 THEN 1 END) as low_stock_items,
        COUNT(CASE WHEN quantity_in_hand = 0 THEN 1 END) as out_of_stock
      FROM inventory
    `);

    // Recent complaints (last 5)
    const recentComplaints = await query(`
      SELECT 
        c.complaint_id,
        c.complaint_number,
        c.complaint_date,
        c.status,
        c.priority,
        cust.name as customer_name,
        p.product_name,
        u.full_name as technician_name
      FROM complaints c
      JOIN customers cust ON c.customer_id = cust.customer_id
      JOIN products p ON c.product_id = p.product_id
      LEFT JOIN users u ON c.assigned_technician = u.user_id
      ${complaintWhere}
      ORDER BY c.complaint_date DESC
      LIMIT 5
    `, complaintParams);

    // Recent invoices (last 5) - Admin & Manager only
    let recentInvoices = null;
    if (['admin', 'manager'].includes(userRole)) {
      recentInvoices = await query(`
        SELECT 
          invoice_id,
          invoice_number,
          invoice_date,
          invoice_type,
          customer_name,
          net_amount,
          status
        FROM invoices
        ORDER BY invoice_date DESC
        LIMIT 5
      `);
    }

    res.json({
      success: true,
      data: {
        complaints: complaints.rows[0],
        revenue: revenueStats,
        inventory: inventory.rows[0],
        recent_complaints: recentComplaints.rows,
        recent_invoices: recentInvoices?.rows || []
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
};

// ============================================
// COMPLAINT REPORTS
// ============================================

// @desc    Get complaint summary report
// @route   GET /api/reports/complaints/summary
// @access  Private
const getComplaintSummaryReport = async (req, res) => {
  try {
    const filters = sanitizeQueryParams(req.query);
    const { date_from, date_to, area_id, technician_id, warranty_status } = filters;

    // Validate date range
    if (date_from && date_to) {
      const validation = validateDateRange(date_from, date_to);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.error
        });
      }
    }

    // Build WHERE clause
    const { whereClause, params } = buildWhereClause({
      date_from,
      date_to,
      area_id,
      technician_id,
      date_field: 'complaint_date'
    });

    // Add warranty status filter
    let warrantyClause = '';
    if (warranty_status) {
      const paramIndex = params.length + 1;
      warrantyClause = whereClause 
        ? ` AND warranty_status = $${paramIndex}` 
        : ` WHERE warranty_status = $${paramIndex}`;
      params.push(warranty_status);
    }

    const finalWhere = whereClause + warrantyClause;

    // Overall summary
    const summary = await query(`
      SELECT 
        COUNT(*) as total_complaints,
        COUNT(CASE WHEN status = 'Open' THEN 1 END) as open,
        COUNT(CASE WHEN status = 'Assigned' THEN 1 END) as assigned,
        COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN warranty_status = 'In Warranty' THEN 1 END) as in_warranty,
        COUNT(CASE WHEN warranty_status = 'Out of Warranty' THEN 1 END) as out_of_warranty,
        COUNT(CASE WHEN warranty_status LIKE 'Contract%' THEN 1 END) as contract,
        AVG(CASE WHEN completion_date IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (completion_date - complaint_date))/3600 
        END) as avg_resolution_hours,
        SUM(total_service_amount) as total_revenue,
        SUM(parts_amount) as total_parts_cost,
        SUM(selected_service_charge) as total_service_charges
      FROM complaints
      ${finalWhere}
    `, params);

    // By product
    const byProduct = await query(`
      SELECT 
        p.product_name,
        p.category,
        COUNT(c.complaint_id) as count,
        COUNT(CASE WHEN c.status = 'Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN c.status IN ('Open', 'Assigned', 'In Progress') THEN 1 END) as active,
        AVG(CASE WHEN c.completion_date IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (c.completion_date - c.complaint_date))/3600 
        END) as avg_resolution_hours
      FROM complaints c
      JOIN products p ON c.product_id = p.product_id
      ${finalWhere}
      GROUP BY p.product_name, p.category
      ORDER BY count DESC
      LIMIT 10
    `, params);

    // By area
    const byArea = await query(`
      SELECT 
        oa.area_name,
        oa.area_code,
        COUNT(c.complaint_id) as count,
        COUNT(CASE WHEN c.status = 'Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN c.status IN ('Open', 'Assigned', 'In Progress') THEN 1 END) as active
      FROM complaints c
      JOIN operational_areas oa ON c.area_id = oa.area_id
      ${finalWhere}
      GROUP BY oa.area_name, oa.area_code
      ORDER BY count DESC
    `, params);

    // By priority
    const byPriority = await query(`
      SELECT 
        priority,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed
      FROM complaints
      ${finalWhere}
      GROUP BY priority
      ORDER BY 
        CASE priority
          WHEN 'Critical' THEN 1
          WHEN 'High' THEN 2
          WHEN 'Medium' THEN 3
          WHEN 'Low' THEN 4
        END
    `, params);

    res.json({
      success: true,
      data: {
        metadata: formatReportMetadata('Complaint Summary Report', filters, req.user),
        summary: summary.rows[0],
        by_product: byProduct.rows,
        by_area: byArea.rows,
        by_priority: byPriority.rows
      }
    });

  } catch (error) {
    console.error('Complaint summary report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate complaint summary report'
    });
  }
};

// @desc    Get complaint trends over time
// @route   GET /api/reports/complaints/trends
// @access  Private
const getComplaintTrendReport = async (req, res) => {
  try {
    const { date_from, date_to, group_by = 'day' } = sanitizeQueryParams(req.query);

    const { whereClause, params } = buildWhereClause({
      date_from,
      date_to,
      date_field: 'complaint_date'
    });

    const dateGrouping = getDateGrouping(group_by, 'complaint_date');

    const trends = await query(`
      SELECT 
        ${dateGrouping} as period,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN warranty_status = 'In Warranty' THEN 1 END) as in_warranty,
        COUNT(CASE WHEN warranty_status = 'Out of Warranty' THEN 1 END) as out_of_warranty
      FROM complaints
      ${whereClause}
      GROUP BY period
      ORDER BY period DESC
      LIMIT 30
    `, params);

    res.json({
      success: true,
      data: {
        group_by,
        trends: trends.rows
      }
    });

  } catch (error) {
    console.error('Complaint trend report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate complaint trend report'
    });
  }
};

// @desc    Get warranty analysis report
// @route   GET /api/reports/complaints/warranty-analysis
// @access  Private
const getWarrantyAnalysisReport = async (req, res) => {
  try {
    const filters = sanitizeQueryParams(req.query);
    const { whereClause, params } = buildWhereClause({
      ...filters,
      date_field: 'complaint_date'
    });

    const analysis = await query(`
      SELECT 
        warranty_status,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed,
        SUM(total_service_amount) as total_revenue,
        SUM(parts_amount) as total_parts_cost,
        AVG(total_service_amount) as avg_revenue_per_complaint
      FROM complaints
      ${whereClause}
      GROUP BY warranty_status
      ORDER BY count DESC
    `, params);

    res.json({
      success: true,
      data: {
        warranty_analysis: analysis.rows
      }
    });

  } catch (error) {
    console.error('Warranty analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate warranty analysis report'
    });
  }
};

// @desc    Get top products by complaint count
// @route   GET /api/reports/complaints/top-products
// @access  Private
const getTopProductsReport = async (req, res) => {
  try {
    const { limit = 10 } = sanitizeQueryParams(req.query);

    const topProducts = await query(`
      SELECT 
        p.product_id,
        p.product_name,
        p.category,
        COUNT(c.complaint_id) as total_complaints,
        COUNT(CASE WHEN c.status = 'Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN c.warranty_status = 'In Warranty' THEN 1 END) as in_warranty,
        COUNT(CASE WHEN c.warranty_status = 'Out of Warranty' THEN 1 END) as out_of_warranty
      FROM products p
      LEFT JOIN complaints c ON p.product_id = c.product_id
      GROUP BY p.product_id, p.product_name, p.category
      HAVING COUNT(c.complaint_id) > 0
      ORDER BY total_complaints DESC
      LIMIT $1
    `, [limit]);

    res.json({
      success: true,
      data: {
        top_products: topProducts.rows
      }
    });

  } catch (error) {
    console.error('Top products report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate top products report'
    });
  }
};

// ============================================
// TECHNICIAN PERFORMANCE
// ============================================

// @desc    Get technician performance report
// @route   GET /api/reports/technicians/performance
// @access  Private (Admin, Manager)
const getTechnicianPerformanceReport = async (req, res) => {
  try {
    const { date_from, date_to } = sanitizeQueryParams(req.query);

    const conditions = ['u.role = \'technician\'', 'u.is_active = true'];
    const params = [];
    let paramCount = 1;

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

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const performance = await query(`
      SELECT 
        u.user_id,
        u.full_name,
        u.email,
        u.phone,
        COUNT(c.complaint_id) as total_assigned,
        COUNT(CASE WHEN c.status = 'Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN c.status = 'In Progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN c.status = 'Assigned' THEN 1 END) as pending,
        COUNT(CASE WHEN c.status = 'Cancelled' THEN 1 END) as cancelled,
        AVG(CASE WHEN c.completion_date IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (c.completion_date - c.complaint_date))/3600 
        END) as avg_resolution_hours,
        SUM(c.total_service_amount) as total_revenue,
        AVG(c.total_service_amount) as avg_revenue_per_complaint
      FROM users u
      LEFT JOIN complaints c ON u.user_id = c.assigned_technician
      ${whereClause}
      GROUP BY u.user_id, u.full_name, u.email, u.phone
      ORDER BY completed DESC, total_assigned DESC
    `, params);

    res.json({
      success: true,
      data: {
        metadata: formatReportMetadata('Technician Performance Report', { date_from, date_to }, req.user),
        technicians: performance.rows
      }
    });

  } catch (error) {
    console.error('Technician performance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate technician performance report'
    });
  }
};


// backend/controllers/reportController.js - PART 2
// Add these to the existing reportController.js file

// ============================================
// REVENUE REPORTS
// ============================================

// @desc    Get revenue report
// @route   GET /api/reports/revenue
// @access  Private (Admin, Manager)
const getRevenueReport = async (req, res) => {
  try {
    const { date_from, date_to, area_id, group_by = 'day', invoice_type } = sanitizeQueryParams(req.query);

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (date_from) {
      conditions.push(`invoice_date >= $${paramCount}`);
      params.push(date_from);
      paramCount++;
    }

    if (date_to) {
      conditions.push(`invoice_date <= $${paramCount}`);
      params.push(date_to);
      paramCount++;
    }

    if (area_id) {
      conditions.push(`area_id = $${paramCount}`);
      params.push(area_id);
      paramCount++;
    }

    if (invoice_type) {
      conditions.push(`invoice_type = $${paramCount}`);
      params.push(invoice_type);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Overall summary
    const summary = await query(`
      SELECT 
        COUNT(*) as total_invoices,
        COUNT(CASE WHEN invoice_type = 'Counter Sale' THEN 1 END) as counter_sales,
        COUNT(CASE WHEN invoice_type = 'Complaint Service' THEN 1 END) as service_invoices,
        SUM(subtotal) as total_subtotal,
        SUM(gst_total) as total_gst,
        SUM(fst_total) as total_fst,
        SUM(discount) as total_discount,
        SUM(waive_off) as total_waive_off,
        SUM(net_amount) as total_revenue,
        SUM(CASE WHEN status = 'Paid' THEN net_amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN status = 'Issued' THEN net_amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN status = 'Draft' THEN net_amount ELSE 0 END) as draft_amount,
        AVG(net_amount) as avg_invoice_value
      FROM invoices
      ${whereClause}
    `, params);

    // Time-series data
    const dateGrouping = getDateGrouping(group_by, 'invoice_date');

    const timeSeries = await query(`
      SELECT 
        ${dateGrouping} as period,
        COUNT(*) as invoice_count,
        SUM(net_amount) as revenue,
        SUM(CASE WHEN invoice_type = 'Counter Sale' THEN net_amount ELSE 0 END) as counter_sale_revenue,
        SUM(CASE WHEN invoice_type = 'Complaint Service' THEN net_amount ELSE 0 END) as service_revenue,
        SUM(gst_total) as gst_collected,
        SUM(fst_total) as fst_collected
      FROM invoices
      ${whereClause}
      GROUP BY period
      ORDER BY period DESC
      LIMIT 30
    `, params);

    // By area
    const byArea = await query(`
      SELECT 
        oa.area_name,
        oa.area_code,
        COUNT(i.invoice_id) as invoice_count,
        SUM(i.net_amount) as revenue,
        SUM(CASE WHEN i.invoice_type = 'Counter Sale' THEN i.net_amount ELSE 0 END) as counter_sale_revenue,
        SUM(CASE WHEN i.invoice_type = 'Complaint Service' THEN i.net_amount ELSE 0 END) as service_revenue
      FROM invoices i
      JOIN operational_areas oa ON i.area_id = oa.area_id
      ${whereClause}
      GROUP BY oa.area_name, oa.area_code
      ORDER BY revenue DESC
    `, params);

    // Payment status breakdown
    const byStatus = await query(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(net_amount) as amount
      FROM invoices
      ${whereClause}
      GROUP BY status
      ORDER BY amount DESC
    `, params);

    res.json({
      success: true,
      data: {
        metadata: formatReportMetadata('Revenue Report', { date_from, date_to, area_id, group_by }, req.user),
        summary: summary.rows[0],
        time_series: timeSeries.rows,
        by_area: byArea.rows,
        by_status: byStatus.rows
      }
    });

  } catch (error) {
    console.error('Revenue report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate revenue report'
    });
  }
};

// @desc    Get area-wise performance report
// @route   GET /api/reports/area-wise
// @access  Private (Admin, Manager)
const getAreaWiseReport = async (req, res) => {
  try {
    const { date_from, date_to } = sanitizeQueryParams(req.query);

    const conditions = [];
    const params = [];
    let paramCount = 1;

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

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const areaPerformance = await query(`
      SELECT 
        oa.area_id,
        oa.area_name,
        oa.area_code,
        COUNT(DISTINCT c.complaint_id) as total_complaints,
        COUNT(DISTINCT CASE WHEN c.status = 'Completed' THEN c.complaint_id END) as completed_complaints,
        COUNT(DISTINCT i.invoice_id) as total_invoices,
        SUM(i.net_amount) as total_revenue,
        COUNT(DISTINCT inv.item_id) as unique_items_in_stock,
        SUM(inv.quantity_in_hand) as total_inventory_qty
      FROM operational_areas oa
      LEFT JOIN complaints c ON oa.area_id = c.area_id ${whereClause.replace('WHERE', 'AND')}
      LEFT JOIN invoices i ON oa.area_id = i.area_id
      LEFT JOIN inventory inv ON oa.area_id = inv.area_id
      GROUP BY oa.area_id, oa.area_name, oa.area_code
      ORDER BY total_revenue DESC
    `, params);

    res.json({
      success: true,
      data: {
        area_performance: areaPerformance.rows
      }
    });

  } catch (error) {
    console.error('Area-wise report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate area-wise report'
    });
  }
};

// ============================================
// INVENTORY REPORTS
// ============================================

// @desc    Get inventory status report
// @route   GET /api/reports/inventory/status
// @access  Private
const getInventoryStatusReport = async (req, res) => {
  try {
    const { area_id, category, low_stock_threshold = 10 } = sanitizeQueryParams(req.query);

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (area_id) {
      conditions.push(`inv.area_id = $${paramCount}`);
      params.push(area_id);
      paramCount++;
    }

    if (category) {
      conditions.push(`it.category = $${paramCount}`);
      params.push(category);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Overall summary
    const summary = await query(`
      SELECT 
        COUNT(DISTINCT inv.item_id) as total_items,
        SUM(inv.quantity_in_hand) as total_quantity,
        SUM(inv.quantity_in_hand * it.unit_price) as total_value,
        COUNT(CASE WHEN inv.quantity_in_hand <= $${paramCount} THEN 1 END) as low_stock_items,
        COUNT(CASE WHEN inv.quantity_in_hand = 0 THEN 1 END) as out_of_stock_items,
        COUNT(CASE WHEN inv.quantity_in_hand > $${paramCount} THEN 1 END) as adequate_stock_items
      FROM inventory inv
      JOIN items it ON inv.item_id = it.item_id
      ${whereClause}
    `, [...params, low_stock_threshold]);

    // Low stock items (critical alert)
    const lowStockConditions = conditions.slice();
    lowStockConditions.push(`inv.quantity_in_hand > 0 AND inv.quantity_in_hand <= $${paramCount}`);
    
    const lowStock = await query(`
      SELECT 
        it.item_id,
        it.item_code,
        it.description,
        it.category,
        inv.quantity_in_hand,
        it.unit_price,
        (inv.quantity_in_hand * it.unit_price) as stock_value,
        oa.area_name,
        oa.area_code
      FROM inventory inv
      JOIN items it ON inv.item_id = it.item_id
      JOIN operational_areas oa ON inv.area_id = oa.area_id
      WHERE ${lowStockConditions.join(' AND ')}
      ORDER BY inv.quantity_in_hand ASC
      LIMIT 50
    `, [...params, low_stock_threshold]);

    // Out of stock items
    const outOfStockConditions = conditions.slice();
    outOfStockConditions.push(`inv.quantity_in_hand = 0`);
    
    const outOfStock = await query(`
      SELECT 
        it.item_id,
        it.item_code,
        it.description,
        it.category,
        oa.area_name
      FROM inventory inv
      JOIN items it ON inv.item_id = it.item_id
      JOIN operational_areas oa ON inv.area_id = oa.area_id
      WHERE ${outOfStockConditions.join(' AND ')}
      ORDER BY it.description
      LIMIT 50
    `, params);

    // By category
    const byCategory = await query(`
      SELECT 
        it.category,
        COUNT(DISTINCT inv.item_id) as item_count,
        SUM(inv.quantity_in_hand) as total_quantity,
        SUM(inv.quantity_in_hand * it.unit_price) as total_value,
        AVG(it.unit_price) as avg_unit_price
      FROM inventory inv
      JOIN items it ON inv.item_id = it.item_id
      ${whereClause}
      GROUP BY it.category
      ORDER BY total_value DESC
    `, params);

    // By area
    const byArea = await query(`
      SELECT 
        oa.area_name,
        oa.area_code,
        COUNT(DISTINCT inv.item_id) as item_count,
        SUM(inv.quantity_in_hand) as total_quantity,
        SUM(inv.quantity_in_hand * it.unit_price) as total_value
      FROM inventory inv
      JOIN items it ON inv.item_id = it.item_id
      JOIN operational_areas oa ON inv.area_id = oa.area_id
      ${whereClause}
      GROUP BY oa.area_name, oa.area_code
      ORDER BY total_value DESC
    `, params);

    res.json({
      success: true,
      data: {
        metadata: formatReportMetadata('Inventory Status Report', { area_id, category, low_stock_threshold }, req.user),
        summary: summary.rows[0],
        low_stock_items: lowStock.rows,
        out_of_stock_items: outOfStock.rows,
        by_category: byCategory.rows,
        by_area: byArea.rows
      }
    });

  } catch (error) {
    console.error('Inventory status report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate inventory status report'
    });
  }
};

// @desc    Get inventory movement report
// @route   GET /api/reports/inventory/movement
// @access  Private
const getInventoryMovementReport = async (req, res) => {
  try {
    const { date_from, date_to, area_id, item_id, transaction_type } = sanitizeQueryParams(req.query);

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (date_from) {
      conditions.push(`transaction_date >= $${paramCount}`);
      params.push(date_from);
      paramCount++;
    }

    if (date_to) {
      conditions.push(`transaction_date <= $${paramCount}`);
      params.push(date_to);
      paramCount++;
    }

    if (area_id) {
      conditions.push(`t.area_id = $${paramCount}`);
      params.push(area_id);
      paramCount++;
    }

    if (item_id) {
      conditions.push(`t.item_id = $${paramCount}`);
      params.push(item_id);
      paramCount++;
    }

    if (transaction_type) {
      conditions.push(`t.transaction_type = $${paramCount}`);
      params.push(transaction_type);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Summary by transaction type
    const summary = await query(`
      SELECT 
        transaction_type,
        COUNT(*) as transaction_count,
        SUM(CASE WHEN quantity_change > 0 THEN quantity_change ELSE 0 END) as total_in,
        SUM(CASE WHEN quantity_change < 0 THEN ABS(quantity_change) ELSE 0 END) as total_out,
        SUM(quantity_change * COALESCE(unit_price, 0)) as total_value
      FROM inventory_transactions t
      ${whereClause}
      GROUP BY transaction_type
      ORDER BY transaction_count DESC
    `, params);

    // Most active items
    const topItems = await query(`
      SELECT 
        it.item_id,
        it.item_code,
        it.description,
        it.category,
        COUNT(t.transaction_id) as transaction_count,
        SUM(CASE WHEN t.quantity_change > 0 THEN t.quantity_change ELSE 0 END) as total_received,
        SUM(CASE WHEN t.quantity_change < 0 THEN ABS(t.quantity_change) ELSE 0 END) as total_issued,
        SUM(t.quantity_change) as net_change
      FROM inventory_transactions t
      JOIN items it ON t.item_id = it.item_id
      ${whereClause}
      GROUP BY it.item_id, it.item_code, it.description, it.category
      ORDER BY transaction_count DESC
      LIMIT 20
    `, params);

    // Recent transactions
    const recentTransactions = await query(`
      SELECT 
        t.transaction_id,
        t.transaction_type,
        t.transaction_date,
        t.reference_number,
        it.item_code,
        it.description,
        t.quantity_change,
        t.quantity_before,
        t.quantity_after,
        oa.area_name,
        u.full_name as performed_by
      FROM inventory_transactions t
      JOIN items it ON t.item_id = it.item_id
      JOIN operational_areas oa ON t.area_id = oa.area_id
      LEFT JOIN users u ON t.performed_by = u.user_id
      ${whereClause}
      ORDER BY t.transaction_date DESC
      LIMIT 50
    `, params);

    res.json({
      success: true,
      data: {
        metadata: formatReportMetadata('Inventory Movement Report', 
          { date_from, date_to, area_id, item_id, transaction_type }, 
          req.user
        ),
        summary_by_type: summary.rows,
        top_items: topItems.rows,
        recent_transactions: recentTransactions.rows
      }
    });

  } catch (error) {
    console.error('Inventory movement report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate inventory movement report'
    });
  }
};

// backend/controllers/reportController.js - PART 3 (FINAL)
// Add these to the existing reportController.js file

// ============================================
// PURCHASE REPORTS
// ============================================

// @desc    Get purchase summary report
// @route   GET /api/reports/purchase/summary
// @access  Private (Admin, Manager)
const getPurchaseSummaryReport = async (req, res) => {
  try {
    const { date_from, date_to, vendor_id, status } = sanitizeQueryParams(req.query);

    const conditions = [];
    const params = [];
    let paramCount = 1;

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

    if (vendor_id) {
      conditions.push(`po.vendor_id = $${paramCount}`);
      params.push(vendor_id);
      paramCount++;
    }

    if (status) {
      conditions.push(`po.status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Overall summary
    const summary = await query(`
      SELECT 
        COUNT(DISTINCT po.po_id) as total_pos,
        COUNT(CASE WHEN po.status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN po.status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN po.status = 'received' THEN 1 END) as received,
        COUNT(CASE WHEN po.status = 'cancelled' THEN 1 END) as cancelled,
        SUM(po.total_amount) as total_purchase_value,
        COUNT(DISTINCT po.vendor_id) as unique_vendors,
        AVG(po.total_amount) as avg_po_value,
        COUNT(DISTINCT poi.item_id) as unique_items_ordered,
        SUM(poi.quantity) as total_items_ordered
      FROM purchase_orders po
      LEFT JOIN po_items poi ON po.po_id = poi.po_id
      ${whereClause}
    `, params);

    // By vendor
    const byVendor = await query(`
      SELECT 
        v.vendor_id,
        v.vendor_name,
        v.vendor_code,
        v.vendor_type,
        COUNT(po.po_id) as po_count,
        SUM(po.total_amount) as total_value,
        COUNT(CASE WHEN po.status = 'received' THEN 1 END) as received_count,
        COUNT(CASE WHEN po.status = 'pending' THEN 1 END) as pending_count,
        AVG(po.total_amount) as avg_po_value
      FROM purchase_orders po
      JOIN vendors v ON po.vendor_id = v.vendor_id
      ${whereClause}
      GROUP BY v.vendor_id, v.vendor_name, v.vendor_code, v.vendor_type
      ORDER BY total_value DESC
      LIMIT 20
    `, params);

    // Top purchased items
    const topItems = await query(`
      SELECT 
        it.item_id,
        it.item_code,
        it.description,
        it.category,
        SUM(poi.quantity) as total_quantity,
        SUM(poi.amount) as total_value,
        COUNT(DISTINCT po.po_id) as po_count,
        AVG(poi.unit_price) as avg_purchase_price,
        COUNT(CASE WHEN poi.status = 'FOC' THEN 1 END) as foc_count,
        COUNT(CASE WHEN poi.status = 'OPB' THEN 1 END) as opb_count
      FROM purchase_orders po
      JOIN po_items poi ON po.po_id = poi.po_id
      JOIN items it ON poi.item_id = it.item_id
      ${whereClause}
      GROUP BY it.item_id, it.item_code, it.description, it.category
      ORDER BY total_value DESC
      LIMIT 20
    `, params);

    // By status
    const byStatus = await query(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total_amount) as total_value
      FROM purchase_orders po
      ${whereClause}
      GROUP BY status
      ORDER BY 
        CASE status
          WHEN 'received' THEN 1
          WHEN 'approved' THEN 2
          WHEN 'pending' THEN 3
          WHEN 'cancelled' THEN 4
        END
    `, params);

    // FOC and OPB analysis
    const specialItems = await query(`
      SELECT 
        poi.status as item_status,
        COUNT(DISTINCT poi.po_item_id) as count,
        SUM(poi.quantity) as total_quantity,
        COUNT(DISTINCT poi.item_id) as unique_items
      FROM purchase_orders po
      JOIN po_items poi ON po.po_id = poi.po_id
      ${whereClause}
      GROUP BY poi.status
      ORDER BY count DESC
    `, params);

    res.json({
      success: true,
      data: {
        metadata: formatReportMetadata('Purchase Summary Report', 
          { date_from, date_to, vendor_id, status }, 
          req.user
        ),
        summary: summary.rows[0],
        by_vendor: byVendor.rows,
        top_items: topItems.rows,
        by_status: byStatus.rows,
        special_items: specialItems.rows
      }
    });

  } catch (error) {
    console.error('Purchase summary report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate purchase summary report'
    });
  }
};

// ============================================
// COMPLETE EXPORT - REPLACE ENTIRE EXPORTS
// ============================================

module.exports = {
  // Dashboard
  getDashboardStats,
  
  // Complaint Reports
  getComplaintSummaryReport,
  getComplaintTrendReport,
  getWarrantyAnalysisReport,
  getTopProductsReport,
  
  // Technician Reports
  getTechnicianPerformanceReport,
  
  // Revenue Reports
  getRevenueReport,
  getAreaWiseReport,
  
  // Inventory Reports
  getInventoryStatusReport,
  getInventoryMovementReport,
  
  // Purchase Reports
  getPurchaseSummaryReport
};