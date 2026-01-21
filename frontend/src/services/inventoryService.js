// frontend/src/services/inventoryService.js
import { apiHelper } from './api';

const inventoryService = {
  // Get stock levels
  getStock: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiHelper.get(`/inventory/stock?${queryString}`);
  },

  // Get transactions
  getTransactions: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiHelper.get(`/inventory/transactions?${queryString}`);
  },

  // Get all items
  getItems: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiHelper.get(`/items?${queryString}`);
  },
};

export default inventoryService;