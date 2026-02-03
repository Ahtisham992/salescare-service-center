import { apiHelper } from './api';

const requisitionService = {
  // Get all MRQS
  getAllMRQS: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiHelper.get(`/requisitions/mrqs?${queryString}`);
  },

  // Get single MRQS
  getMRQSById: async (id) => {
    return await apiHelper.get(`/requisitions/mrqs/${id}`);
  },

  // Create MRQS (Material Requisition)
  createMRQS: async (data) => {
    return await apiHelper.post('/requisitions/mrqs', data);
  },

  // ✅ ADDED THIS MISSING FUNCTION
  // Create MRTS (Material Return)
  createMRTS: async (data) => {
    return await apiHelper.post('/requisitions/mrts', data);
  },

  // Approve MRQS
  approveMRQS: async (id, data) => {
    return await apiHelper.patch(`/requisitions/mrqs/${id}/approve`, data);
  },

  // Issue MRQS
  issueMRQS: async (id) => {
    return await apiHelper.patch(`/requisitions/mrqs/${id}/issue`);
  },

  // Reject MRQS
  rejectMRQS: async (id, data) => {
    return await apiHelper.patch(`/requisitions/mrqs/${id}/reject`, data);
  },

  // Search Items (Used by both MRQS and MRTS)
  searchItems: async (query, areaId = 1) => {
    try {
      const response = await apiHelper.get(
        `/inventory/stock?search=${encodeURIComponent(query)}&area_id=${areaId}&limit=20`
      );
      // Handle different response structures
      const items = response.data?.stock || response.data?.data?.stock || [];
      return items;
    } catch (error) {
      console.error('Search items error:', error);
      return [];
    }
  },

  // Get Technicians
  getTechnicians: async () => {
    try {
      const response = await apiHelper.get('/users');
      const usersList = response.data?.users || response.data?.data?.users || [];
      return Array.isArray(usersList) ? usersList.filter(u => u.role === 'technician') : [];
    } catch (err) {
      console.error('Failed to fetch technicians', err);
      return [];
    }
  }
};

export default requisitionService;