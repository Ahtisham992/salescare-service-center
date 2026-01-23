// frontend/src/services/goodsReceiptService.js
import { apiHelper } from './api';

const goodsReceiptService = {
  // Get all goods receipts with filters
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiHelper.get(`/goods-receipts?${queryString}`);
  },

  // Get goods receipt by ID
  getById: async (id) => {
    return await apiHelper.get(`/goods-receipts/${id}`);
  },

  // Create new goods receipt
  create: async (data) => {
    return await apiHelper.post('/goods-receipts', data);
  },

  // Delete goods receipt (admin only)
  delete: async (id) => {
    return await apiHelper.delete(`/goods-receipts/${id}`);
  },

  // Get approved purchase orders (for creating GR)
  getApprovedPOs: async () => {
    return await apiHelper.get('/purchase-orders?status=approved&limit=100');
  },
};

export default goodsReceiptService;