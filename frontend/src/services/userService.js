// frontend/src/services/userService.js
import { apiHelper } from './api';

const userService = {
  // Get all users with filters
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiHelper.get(`/users?${queryString}`);
  },

  // Get single user by ID
  getById: async (id) => {
    return await apiHelper.get(`/users/${id}`);
  },

  // Create new user
  create: async (data) => {
    return await apiHelper.post('/users', data);
  },

  // Update user
  update: async (id, data) => {
    return await apiHelper.put(`/users/${id}`, data);
  },

  // Reset user password
  resetPassword: async (id, newPassword) => {
    return await apiHelper.patch(`/users/${id}/reset-password`, {
      new_password: newPassword
    });
  },

  // Delete user
  delete: async (id) => {
    return await apiHelper.delete(`/users/${id}`);
  },

  // Get user statistics
  getStats: async () => {
    return await apiHelper.get('/users/stats');
  },
};

export default userService;