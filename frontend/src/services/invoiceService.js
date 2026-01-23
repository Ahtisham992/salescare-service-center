// frontend/src/services/invoiceService.js
import { apiHelper } from './api';

const invoiceService = {
  // Get all invoices with filters
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiHelper.get(`/invoices?${queryString}`);
  },

  // Get single invoice by ID
  getById: async (id) => {
    return await apiHelper.get(`/invoices/${id}`);
  },

  // Create counter sale invoice
  createCounterSale: async (data) => {
    return await apiHelper.post('/invoices/counter-sale', data);
  },

  // Create complaint service invoice
  createComplaintInvoice: async (data) => {
    return await apiHelper.post('/invoices/complaint', data);
  },

  // Update invoice status (Used for Cancelling)
  updateStatus: async (id, status) => {
    return await apiHelper.patch(`/invoices/${id}/status`, { status });
  },

  // Delete invoice (Admin only)
  delete: async (id) => {
    return await apiHelper.delete(`/invoices/${id}`);
  },

  // Get invoice statistics
  getStats: async () => {
    return await apiHelper.get('/invoices/stats');
  },
};

export default invoiceService;