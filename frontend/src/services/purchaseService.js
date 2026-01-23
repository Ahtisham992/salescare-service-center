// frontend/src/services/purchaseService.js
import { apiHelper } from './api';

const purchaseService = {
  // Get all purchase orders with pagination and filters
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiHelper.get(`/purchase-orders?${queryString}`);
  },

  // Get single PO by ID
  getById: async (id) => {
    return await apiHelper.get(`/purchase-orders/${id}`);
  },

  // Create new purchase order
  create: async (data) => {
    return await apiHelper.post('/purchase-orders', data);
  },

  // Approve purchase order
  approve: async (id) => {
    return await apiHelper.patch(`/purchase-orders/${id}/approve`);
  },

  // Cancel purchase order
  cancel: async (id) => {
    return await apiHelper.patch(`/purchase-orders/${id}/cancel`);
  },

  // Delete purchase order
  delete: async (id) => {
    return await apiHelper.delete(`/purchase-orders/${id}`);
  },

  // Get items for dropdown (from inventory)
  searchItems: async (query = '') => {
    return await apiHelper.get(`/items?search=${query}`);
  },

  // Get all items (no search)
  getAllItems: async () => {
    return await apiHelper.get('/items');
  }
};

export default purchaseService;