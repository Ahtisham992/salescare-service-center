// backend/routes/report.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getComplaintSummaryReport,
  getTechnicianPerformanceReport,
  getRevenueReport,
  getInventoryStatusReport,
  getInventoryMovementReport,
  getPurchaseSummaryReport,
  getDashboardStats,
  getComplaintTrendReport,
  getTopProductsReport,
  getWarrantyAnalysisReport,
  getAreaWiseReport
} = require('../controllers/reportController');

// ============================================
// DASHBOARD & OVERVIEW
// ============================================

// Dashboard statistics (all users can access their relevant data)
router.get('/dashboard/stats', authenticate, getDashboardStats);

// ============================================
// COMPLAINT REPORTS
// ============================================

// Complaint summary report with filters
router.get('/complaints/summary', authenticate, getComplaintSummaryReport);

// Complaint trends over time
router.get('/complaints/trends', authenticate, getComplaintTrendReport);

// Warranty analysis (In Warranty vs Out of Warranty)
router.get('/complaints/warranty-analysis', authenticate, getWarrantyAnalysisReport);

// Top products by complaint count
router.get('/complaints/top-products', authenticate, getTopProductsReport);

// ============================================
// TECHNICIAN REPORTS
// ============================================

// Technician performance report (Admin & Manager only)
router.get('/technicians/performance', 
  authenticate, 
  authorize('admin', 'manager'), 
  getTechnicianPerformanceReport
);

// ============================================
// REVENUE & FINANCIAL REPORTS
// ============================================

// Revenue report with time-series data (Admin & Manager only)
router.get('/revenue', 
  authenticate, 
  authorize('admin', 'manager'), 
  getRevenueReport
);

// Area-wise performance report
router.get('/area-wise', 
  authenticate, 
  authorize('admin', 'manager'), 
  getAreaWiseReport
);

// ============================================
// INVENTORY REPORTS
// ============================================

// Inventory status report (stock levels, low stock alerts)
router.get('/inventory/status', authenticate, getInventoryStatusReport);

// Inventory movement report (transactions history)
router.get('/inventory/movement', authenticate, getInventoryMovementReport);

// ============================================
// PURCHASE REPORTS
// ============================================

// Purchase summary report (Admin & Manager only)
router.get('/purchase/summary', 
  authenticate, 
  authorize('admin', 'manager'), 
  getPurchaseSummaryReport
);

module.exports = router;