// backend/controllers/inventoryController.js
const { query } = require('../config/database');
const { getCurrentStock, getInventoryValuation } = require('../services/inventoryService');

// @desc    Get stock in hand for all items
// @route   GET /api/inventory/stock
// @access  Private
const getStockInHand = async (req, res) => {
  try {
    const { area_id, item_id, category, search, min_quantity } = req.query;

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (area_id) {
      conditions.push(`i.area_id = $${paramCount}`);
      params.push(area_id);
      paramCount++;
    }

    if (item_id) {
      conditions.push(`i.item_id = $${paramCount}`);
      params.push(item_id);
      paramCount++;
    }

    if (category) {
      conditions.push(`it.category = $${paramCount}`);
      params.push(category);
      paramCount++;
    }

    if (search) {
      conditions.push(`(
        it.item_code ILIKE $${paramCount} OR
        it.description ILIKE $${paramCount}
      )`);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (min_quantity) {
      conditions.push(`i.quantity_in_hand >= $${paramCount}`);
      params.push(min_quantity);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(`
      SELECT 
        i.inventory_id,
        i.item_id,
        i.area_id,
        i.quantity_in_hand,
        i.last_updated,
        it.item_code,
        it.description,
        it.category,
        it.unit_price,
        oa.area_name,
        oa.area_code,
        (i.quantity_in_hand * it.unit_price) as stock_value
      FROM inventory i
      JOIN items it ON i.item_id = it.item_id
      JOIN operational_areas oa ON i.area_id = oa.area_id
      ${whereClause}
      ORDER BY oa.area_name, it.item_code
    `, params);

    // Calculate totals
    const totals = {
      total_items: result.rows.length,
      total_quantity: result.rows.reduce((sum, row) => sum + parseInt(row.quantity_in_hand), 0),
      total_value: result.rows.reduce((sum, row) => sum + parseFloat(row.stock_value), 0)
    };

    res.json({
      success: true,
      data: {
        stock: result.rows,
        totals
      }
    });

  } catch (error) {
    console.error('Get stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock information'
    });
  }
};

// @desc    Get inventory transactions history
// @route   GET /api/inventory/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      item_id,
      area_id,
      transaction_type,
      date_from,
      date_to
    } = req.query;

    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (item_id) {
      conditions.push(`t.item_id = $${paramCount}`);
      params.push(item_id);
      paramCount++;
    }

    if (area_id) {
      conditions.push(`t.area_id = $${paramCount}`);
      params.push(area_id);
      paramCount++;
    }

    if (transaction_type) {
      conditions.push(`t.transaction_type = $${paramCount}`);
      params.push(transaction_type);
      paramCount++;
    }

    if (date_from) {
      conditions.push(`t.transaction_date >= $${paramCount}`);
      params.push(date_from);
      paramCount++;
    }

    if (date_to) {
      conditions.push(`t.transaction_date <= $${paramCount}`);
      params.push(date_to);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM inventory_transactions t
      ${whereClause}
    `, params);

    const totalTransactions = parseInt(countResult.rows[0].total);

    // Get transactions
    params.push(limit, offset);
    
    const result = await query(`
      SELECT 
        t.transaction_id,
        t.transaction_type,
        t.reference_id,
        t.reference_number,
        t.quantity_change,
        t.quantity_before,
        t.quantity_after,
        t.unit_price,
        t.transaction_date,
        t.notes,
        it.item_code,
        it.description as item_description,
        oa.area_name,
        u.full_name as performed_by_name
      FROM inventory_transactions t
      JOIN items it ON t.item_id = it.item_id
      JOIN operational_areas oa ON t.area_id = oa.area_id
      LEFT JOIN users u ON t.performed_by = u.user_id
      ${whereClause}
      ORDER BY t.transaction_date DESC, t.transaction_id DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `, params);

    res.json({
      success: true,
      data: {
        transactions: result.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalTransactions / limit),
          total_items: totalTransactions,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction history'
    });
  }
};

// @desc    Get stock for specific item in area
// @route   GET /api/inventory/stock/:itemId/:areaId
// @access  Private
const getItemStock = async (req, res) => {
  try {
    const { itemId, areaId } = req.params;

    const stock = await getCurrentStock(itemId, areaId);

    if (!stock) {
      return res.json({
        success: true,
        data: {
          item_id: parseInt(itemId),
          area_id: parseInt(areaId),
          quantity_in_hand: 0,
          message: 'No stock available'
        }
      });
    }

    res.json({
      success: true,
      data: stock
    });

  } catch (error) {
    console.error('Get item stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch item stock'
    });
  }
};

// @desc    Get inventory valuation report
// @route   GET /api/inventory/valuation
// @access  Private (Admin, Manager)
const getValuationReport = async (req, res) => {
  try {
    const { area_id } = req.query;

    const valuation = await getInventoryValuation(area_id || null);

    res.json({
      success: true,
      data: valuation
    });

  } catch (error) {
    console.error('Get valuation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate valuation report'
    });
  }
};

// @desc    Get low stock items
// @route   GET /api/inventory/low-stock
// @access  Private
const getLowStock = async (req, res) => {
  try {
    const { threshold = 5, area_id } = req.query;

    const conditions = [`i.quantity_in_hand <= $1`];
    const params = [threshold];

    if (area_id) {
      conditions.push(`i.area_id = $2`);
      params.push(area_id);
    }

    const result = await query(`
      SELECT 
        i.inventory_id,
        i.item_id,
        i.area_id,
        i.quantity_in_hand,
        it.item_code,
        it.description,
        it.category,
        it.unit_price,
        oa.area_name
      FROM inventory i
      JOIN items it ON i.item_id = it.item_id
      JOIN operational_areas oa ON i.area_id = oa.area_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY i.quantity_in_hand ASC, it.description
    `, params);

    res.json({
      success: true,
      data: {
        low_stock_items: result.rows,
        count: result.rows.length,
        threshold: parseInt(threshold)
      }
    });

  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock items'
    });
  }
};

// @desc    Get inventory statistics
// @route   GET /api/inventory/stats
// @access  Private
const getInventoryStats = async (req, res) => {
  try {
    const { area_id } = req.query;

    let whereClause = '';
    const params = [];

    if (area_id) {
      whereClause = 'WHERE i.area_id = $1';
      params.push(area_id);
    }

    const stats = await query(`
      SELECT 
        COUNT(DISTINCT i.item_id) as total_items,
        SUM(i.quantity_in_hand) as total_quantity,
        SUM(i.quantity_in_hand * it.unit_price) as total_value,
        COUNT(CASE WHEN i.quantity_in_hand <= 5 THEN 1 END) as low_stock_items,
        COUNT(CASE WHEN i.quantity_in_hand = 0 THEN 1 END) as out_of_stock_items
      FROM inventory i
      JOIN items it ON i.item_id = it.item_id
      ${whereClause}
    `, params);

    // Get recent transactions count
    const recentTransactions = await query(`
      SELECT COUNT(*) as count
      FROM inventory_transactions
      WHERE transaction_date >= NOW() - INTERVAL '7 days'
      ${area_id ? 'AND area_id = $1' : ''}
    `, area_id ? [area_id] : []);

    res.json({
      success: true,
      data: {
        ...stats.rows[0],
        recent_transactions_7days: parseInt(recentTransactions.rows[0].count)
      }
    });

  } catch (error) {
    console.error('Get inventory stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory statistics'
    });
  }
};

module.exports = {
  getStockInHand,
  getTransactions,
  getItemStock,
  getValuationReport,
  getLowStock,
  getInventoryStats
};