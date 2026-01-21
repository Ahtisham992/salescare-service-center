// backend/services/reportService.js
const { query } = require('../config/database');

/**
 * Build WHERE clause from filter parameters
 */
const buildWhereClause = (filters) => {
  const conditions = [];
  const params = [];
  let paramCount = 1;

  if (filters.date_from) {
    conditions.push(`${filters.date_field || 'created_at'} >= $${paramCount}`);
    params.push(filters.date_from);
    paramCount++;
  }

  if (filters.date_to) {
    conditions.push(`${filters.date_field || 'created_at'} <= $${paramCount}`);
    params.push(filters.date_to);
    paramCount++;
  }

  if (filters.area_id) {
    conditions.push(`area_id = $${paramCount}`);
    params.push(filters.area_id);
    paramCount++;
  }

  if (filters.status) {
    conditions.push(`status = $${paramCount}`);
    params.push(filters.status);
    paramCount++;
  }

  if (filters.technician_id) {
    conditions.push(`assigned_technician = $${paramCount}`);
    params.push(filters.technician_id);
    paramCount++;
  }

  if (filters.vendor_id) {
    conditions.push(`vendor_id = $${paramCount}`);
    params.push(filters.vendor_id);
    paramCount++;
  }

  if (filters.item_id) {
    conditions.push(`item_id = $${paramCount}`);
    params.push(filters.item_id);
    paramCount++;
  }

  if (filters.category) {
    conditions.push(`category = $${paramCount}`);
    params.push(filters.category);
    paramCount++;
  }

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
    paramCount
  };
};

/**
 * Get date grouping SQL based on group_by parameter
 */
const getDateGrouping = (groupBy, dateField = 'created_at') => {
  switch (groupBy) {
    case 'month':
      return `TO_CHAR(${dateField}, 'YYYY-MM')`;
    case 'week':
      return `TO_CHAR(${dateField}, 'IYYY-IW')`;
    case 'year':
      return `TO_CHAR(${dateField}, 'YYYY')`;
    default: // day
      return `DATE(${dateField})`;
  }
};

/**
 * Calculate percentage change
 */
const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return null;
  return ((current - previous) / previous * 100).toFixed(2);
};

/**
 * Format currency
 */
const formatCurrency = (amount) => {
  return parseFloat(amount || 0).toFixed(2);
};

/**
 * Calculate average resolution time in hours
 */
const calculateAvgResolutionTime = (complaints) => {
  const completed = complaints.filter(c => c.completion_date);
  if (completed.length === 0) return null;

  const totalHours = completed.reduce((sum, c) => {
    const start = new Date(c.complaint_date);
    const end = new Date(c.completion_date);
    const hours = (end - start) / (1000 * 60 * 60);
    return sum + hours;
  }, 0);

  return (totalHours / completed.length).toFixed(2);
};

/**
 * Get top items by criteria
 */
const getTopItems = async (tableName, valueColumn, limit = 10, filters = {}) => {
  const { whereClause, params } = buildWhereClause(filters);

  const result = await query(`
    SELECT 
      item_id,
      description,
      category,
      SUM(${valueColumn}) as total_value,
      COUNT(*) as count
    FROM ${tableName}
    ${whereClause}
    GROUP BY item_id, description, category
    ORDER BY total_value DESC
    LIMIT ${limit}
  `, params);

  return result.rows;
};

/**
 * Calculate inventory turnover ratio
 */
const calculateInventoryTurnover = async (itemId, areaId, startDate, endDate) => {
  // Get average inventory
  const avgInventory = await query(`
    SELECT AVG(quantity_in_hand) as avg_qty
    FROM inventory
    WHERE item_id = $1 AND area_id = $2
  `, [itemId, areaId]);

  // Get total issued
  const totalIssued = await query(`
    SELECT SUM(ABS(quantity_change)) as total_issued
    FROM inventory_transactions
    WHERE item_id = $1 
      AND area_id = $2
      AND quantity_change < 0
      AND transaction_date BETWEEN $3 AND $4
  `, [itemId, areaId, startDate, endDate]);

  const avgQty = parseFloat(avgInventory.rows[0]?.avg_qty || 0);
  const issued = parseFloat(totalIssued.rows[0]?.total_issued || 0);

  if (avgQty === 0) return null;
  return (issued / avgQty).toFixed(2);
};

/**
 * Generate trend data for charts
 */
const generateTrendData = (data, periods, valueField) => {
  const trendMap = {};
  
  data.forEach(item => {
    trendMap[item.period] = parseFloat(item[valueField] || 0);
  });

  return periods.map(period => ({
    period,
    value: trendMap[period] || 0
  }));
};

/**
 * Calculate growth rate
 */
const calculateGrowthRate = (currentPeriod, previousPeriod) => {
  if (!previousPeriod || previousPeriod === 0) return null;
  return (((currentPeriod - previousPeriod) / previousPeriod) * 100).toFixed(2);
};

module.exports = {
  buildWhereClause,
  getDateGrouping,
  calculatePercentageChange,
  formatCurrency,
  calculateAvgResolutionTime,
  getTopItems,
  calculateInventoryTurnover,
  generateTrendData,
  calculateGrowthRate
};