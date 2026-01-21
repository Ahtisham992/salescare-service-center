// frontend/src/services/authService.js
import { apiHelper } from './api';

const authService = {
  // Login
  login: async (username, password) => {
    try {
      const response = await apiHelper.post('/auth/login', {
        username,
        password,
      });

      if (response.success) {
        // Store token and user data
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data;
      }

      throw new Error(response.message || 'Login failed');
    } catch (error) {
      throw error;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await apiHelper.get('/auth/me');
      
      if (response.success) {
        // Update stored user data
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
      }

      throw new Error('Failed to get user data');
    } catch (error) {
      throw error;
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await apiHelper.put('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });

      return response;
    } catch (error) {
      throw error;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Get stored user data
  getStoredUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Get stored token
  getToken: () => {
    return localStorage.getItem('authToken');
  },

  // Check if user has specific role
  hasRole: (allowedRoles) => {
    const user = authService.getStoredUser();
    if (!user) return false;
    
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(user.role);
    }
    
    return user.role === allowedRoles;
  },
};

export default authService;