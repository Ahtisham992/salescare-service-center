// frontend/src/services/reportService.js
import { apiHelper } from './api';

const reportService = {
  // Dashboard Statistics
  getDashboardStats: async () => {
    return await apiHelper.get('/reports/dashboard/stats');
  },

  // Complaint Reports
  getComplaintSummary: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return await apiHelper.get(`/reports/complaints/summary?${params}`);
  },

  getComplaintTrends: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return await apiHelper.get(`/reports/complaints/trends?${params}`);
  },

  getWarrantyAnalysis: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return await apiHelper.get(`/reports/complaints/warranty-analysis?${params}`);
  },

  getTopProducts: async (limit = 10) => {
    return await apiHelper.get(`/reports/complaints/top-products?limit=${limit}`);
  },

  // Technician Performance
  getTechnicianPerformance: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return await apiHelper.get(`/reports/technicians/performance?${params}`);
  },

  // Revenue Reports
  getRevenueReport: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return await apiHelper.get(`/reports/revenue?${params}`);
  },

  getAreaWiseReport: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return await apiHelper.get(`/reports/area-wise?${params}`);
  },

  // Inventory Reports
  getInventoryStatus: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return await apiHelper.get(`/reports/inventory/status?${params}`);
  },

  getInventoryMovement: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return await apiHelper.get(`/reports/inventory/movement?${params}`);
  },

  // Purchase Reports
  getPurchaseSummary: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return await apiHelper.get(`/reports/purchase/summary?${params}`);
  },
};

export default reportService;