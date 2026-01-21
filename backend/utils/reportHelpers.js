// backend/utils/reportHelpers.js

/**
 * Generate date range for reports
 */
const getDateRange = (period) => {
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;

    case 'yesterday':
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      startDate = new Date(yesterday.setHours(0, 0, 0, 0));
      endDate = new Date(yesterday.setHours(23, 59, 59, 999));
      break;

    case 'this_week':
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      startDate = new Date(weekStart.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;

    case 'last_week':
      const lastWeekEnd = new Date(now);
      lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay() - 1);
      const lastWeekStart = new Date(lastWeekEnd);
      lastWeekStart.setDate(lastWeekStart.getDate() - 6);
      startDate = new Date(lastWeekStart.setHours(0, 0, 0, 0));
      endDate = new Date(lastWeekEnd.setHours(23, 59, 59, 999));
      break;

    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;

    case 'last_month':
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      startDate = lastMonth;
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;

    case 'this_quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;

    case 'this_year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;

    case 'last_year':
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      break;

    case 'last_30_days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;

    case 'last_90_days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 90);
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;

    default:
      // Default to last 30 days
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      endDate = new Date(now.setHours(23, 59, 59, 999));
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
};

/**
 * Format report metadata
 */
const formatReportMetadata = (title, filters, user) => {
  return {
    report_title: title,
    generated_at: new Date().toISOString(),
    generated_by: user?.full_name || 'System',
    filters_applied: filters,
    timezone: 'UTC'
  };
};

/**
 * Validate date range
 */
const validateDateRange = (dateFrom, dateTo) => {
  if (!dateFrom && !dateTo) return { valid: true };

  const from = new Date(dateFrom);
  const to = new Date(dateTo);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return {
      valid: false,
      error: 'Invalid date format. Use YYYY-MM-DD'
    };
  }

  if (from > to) {
    return {
      valid: false,
      error: 'Start date cannot be after end date'
    };
  }

  // Check if date range is too large (e.g., more than 2 years)
  const diffTime = Math.abs(to - from);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 730) {
    return {
      valid: false,
      error: 'Date range cannot exceed 2 years'
    };
  }

  return { valid: true };
};

/**
 * Calculate percentage
 */
const calculatePercentage = (part, total) => {
  if (!total || total === 0) return 0;
  return ((part / total) * 100).toFixed(2);
};

/**
 * Format number with commas
 */
const formatNumber = (number) => {
  return parseFloat(number || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Generate periods array for charts
 */
const generatePeriods = (startDate, endDate, groupBy = 'day') => {
  const periods = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (groupBy === 'day') {
    let current = new Date(start);
    while (current <= end) {
      periods.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
  } else if (groupBy === 'month') {
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    while (current <= end) {
      periods.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`);
      current.setMonth(current.getMonth() + 1);
    }
  } else if (groupBy === 'week') {
    // Week periods (ISO week format)
    let current = new Date(start);
    while (current <= end) {
      const year = current.getFullYear();
      const week = getWeekNumber(current);
      periods.push(`${year}-W${String(week).padStart(2, '0')}`);
      current.setDate(current.getDate() + 7);
    }
  }

  return periods;
};

/**
 * Get ISO week number
 */
const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

/**
 * Sanitize query parameters
 */
const sanitizeQueryParams = (params) => {
  const sanitized = {};

  Object.keys(params).forEach(key => {
    const value = params[key];
    
    // Skip empty values
    if (value === null || value === undefined || value === '') {
      return;
    }

    // Convert to appropriate type
    if (key.includes('_id') || key === 'limit' || key === 'page') {
      sanitized[key] = parseInt(value, 10);
    } else if (key.includes('date')) {
      sanitized[key] = value; // Keep as string for SQL
    } else if (key === 'low_stock_threshold') {
      sanitized[key] = parseInt(value, 10);
    } else {
      sanitized[key] = value;
    }
  });

  return sanitized;
};

/**
 * Build pagination object
 */
const buildPagination = (page = 1, limit = 50, totalItems) => {
  const totalPages = Math.ceil(totalItems / limit);
  
  return {
    current_page: page,
    items_per_page: limit,
    total_items: totalItems,
    total_pages: totalPages,
    has_next: page < totalPages,
    has_prev: page > 1
  };
};

module.exports = {
  getDateRange,
  formatReportMetadata,
  validateDateRange,
  calculatePercentage,
  formatNumber,
  generatePeriods,
  getWeekNumber,
  sanitizeQueryParams,
  buildPagination
};