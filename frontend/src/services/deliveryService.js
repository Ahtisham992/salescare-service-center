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

  // ✅ FIXED: Search Inventory Items
  searchItems: async (query, areaId = 1) => {
    try {
      // Get items with stock information
      const response = await apiHelper.get(
        `/inventory/stock?search=${encodeURIComponent(query)}&area_id=${areaId}&limit=20`
      );
            
      // ✅ FIX: Backend returns { success: true, data: { stock: [...], totals: {...} } }
      // We need to extract the items array from response.data.stock (not .items!)
      const items = response.data?.stock || [];
            
      // Return in the format expected by the modal
      return {
        data: items
      };
    } catch (error) {
      console.error('Search items error:', error);
      // Return empty array on error
      return { data: [] };
    }
  }
};

export default deliveryService;