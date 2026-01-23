// frontend/src/services/vendorService.js
import { apiHelper } from './api';

const vendorService = {
  // Get all vendors with filters
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiHelper.get(`/vendors?${queryString}`);
  },

  // Get single vendor by ID
  getById: async (id) => {
    return await apiHelper.get(`/vendors/${id}`);
  },

  // Create new vendor
  create: async (data) => {
    return await apiHelper.post('/vendors', data);
  },

  // Update vendor
  update: async (id, data) => {
    return await apiHelper.put(`/vendors/${id}`, data);
  },

  // Delete vendor
  delete: async (id) => {
    return await apiHelper.delete(`/vendors/${id}`);
  }
};

export default vendorService;