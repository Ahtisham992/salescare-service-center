// frontend/src/services/approvalService.js
import { apiHelper } from './api';

const approvalService = {
  // Get all pending approvals
  getPendingApprovals: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiHelper.get(`/approvals/pending?${queryString}`);
  },

  // Get approval history for a document
  getApprovalHistory: async (documentType, documentId) => {
    return await apiHelper.get(`/approvals/history/${documentType}/${documentId}`);
  },

  // Get approval statistics
  getApprovalStats: async () => {
    return await apiHelper.get('/approvals/stats');
  },

  // Approve MRQS
  approveMRQS: async (id, data = {}) => {
    return await apiHelper.patch(`/requisitions/mrqs/${id}/approve`, data);
  },
  rejectMRQS: async (id, data) => {
    // Explicitly pass 'data' (which contains { rejection_reason: ... }) as the second argument
     return await apiHelper.patch(`/requisitions/mrqs/${id}/reject`, data);
  },
};

export default approvalService;