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

  // Create MRQS
  createMRQS: async (data) => {
    return await apiHelper.post('/requisitions/mrqs', data);
  },

  // Approve MRQS
  approveMRQS: async (id) => {
    return await apiHelper.patch(`/requisitions/mrqs/${id}/approve`);
  },

  // Issue MRQS
  issueMRQS: async (id) => {
    return await apiHelper.patch(`/requisitions/mrqs/${id}/issue`);
  },

  // Reject MRQS
  rejectMRQS: async (id) => {
    return await apiHelper.patch(`/requisitions/mrqs/${id}/reject`);
  },

   // Get Technicians (Helper for dropdown)
  getTechnicians: async () => {
    try {
      const response = await apiHelper.get('/users');
      
      // ✅ FIX: Check multiple paths to find the users array
      // Path 1: If apiHelper returns body directly (likely your case) -> response.data.users
      // Path 2: If apiHelper returns axios object -> response.data.data.users
      const usersList = response.data?.users || response.data?.data?.users || [];
      
      if (!Array.isArray(usersList)) {
         // console.warn("Technicians data is not an array:", usersList);
         return [];
      }

      return usersList.filter(u => u.role === 'technician' && u.is_active);
    } catch (error) {
      console.error("Error fetching technicians:", error);
      return []; 
    }
  }
};

export default requisitionService;