// frontend/src/services/complaintService.js
import { apiHelper } from './api';

const complaintService = {
  // Get all complaints with filters
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiHelper.get(`/complaints?${queryString}`);
  },

  // Get single complaint by ID
  getById: async (id) => {
    return await apiHelper.get(`/complaints/${id}`);
  },

  // Create new complaint
  create: async (data) => {
    return await apiHelper.post('/complaints', data);
  },

  // Update complaint
  update: async (id, data) => {
    return await apiHelper.put(`/complaints/${id}`, data);
  },

  // Assign technician
  assignTechnician: async (id, technicianId) => {
    return await apiHelper.patch(`/complaints/${id}/assign`, {
      technician_id: technicianId,
    });
  },

  // Update status
  updateStatus: async (id, status) => {
    return await apiHelper.patch(`/complaints/${id}/status`, { status });
  },

  // Delete complaint
  delete: async (id) => {
    return await apiHelper.delete(`/complaints/${id}`);
  },

  // Get complaint statistics
  getStats: async () => {
    return await apiHelper.get('/complaints/stats');
  },
};

export default complaintService;