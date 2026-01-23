// frontend/src/services/deliveryService.js
import { apiHelper } from './api';

const deliveryService = {
  // Get all DOs with pagination and filters
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiHelper.get(`/delivery-orders?${queryString}`);
  },

  // Get single DO details
  getById: async (id) => {
    return await apiHelper.get(`/delivery-orders/${id}`);
  },

  // Create a new DO
  create: async (data) => {
    return await apiHelper.post('/delivery-orders', data);
  },

  // Mark DO as Delivered (Deducts Stock)
  markAsDelivered: async (id) => {
    return await apiHelper.patch(`/delivery-orders/${id}/deliver`);
  },

  // Cancel a Pending DO
  cancel: async (id) => {
    return await apiHelper.patch(`/delivery-orders/${id}/cancel`);
  },

  // Delete a DO (Admin only)
  delete: async (id) => {
    return await apiHelper.delete(`/delivery-orders/${id}`);
  },

  // Search Inventory Items for the Dropdown
  // This uses your existing inventory stock endpoint
  searchItems: async (query) => {
    return await apiHelper.get(`/inventory/stock?search=${query}`);
  }
};

export default deliveryService;