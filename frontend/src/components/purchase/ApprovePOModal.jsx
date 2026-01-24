// frontend/src/components/purchases/ApprovePOModal.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal, { ModalFooter } from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import purchaseService from '../../services/purchaseService'; // Ensure this exists
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle, FileText, User } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

const ApprovePOModal = ({ isOpen, onClose, poId }) => {
  const queryClient = useQueryClient();
  const [action, setAction] = useState(null); // 'approve' or 'reject'
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch PO details
  const { data, isLoading } = useQuery({
    queryKey: ['po-detail', poId],
    queryFn: () => purchaseService.getById(poId),
    enabled: isOpen && !!poId
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: () => purchaseService.approve(poId, { comments }),
    onSuccess: () => {
      toast.success('Purchase Order Approved');
      queryClient.invalidateQueries(['pending-approvals']);
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to approve PO')
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: () => purchaseService.cancel(poId, { cancellation_reason: rejectionReason }),
    onSuccess: () => {
      toast.success('Purchase Order Rejected/Cancelled');
      queryClient.invalidateQueries(['pending-approvals']);
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to reject PO')
  });

  const handleApprove = () => {
    if (action !== 'approve') {
      setAction('approve');
      return;
    }
    approveMutation.mutate();
  };

  const handleReject = () => {
    if (action !== 'reject') {
      setAction('reject');
      return;
    }
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    rejectMutation.mutate();
  };

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Review Purchase Order" size="lg">
        <div className="flex justify-center items-center py-12"><LoadingSpinner /></div>
      </Modal>
    );
  }

  const po = data?.data;
  if (!po) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Review PO: ${po.po_number}`} size="xl">
      <div className="space-y-6">
        {/* Header Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">Vendor</p>
              <p className="font-bold text-gray-900">{po.vendor_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Date</p>
              <p className="font-semibold text-gray-900">{formatDate(po.po_date)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Status</p>
              <span className="badge badge-warning">{po.status}</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Total Amount</p>
              <p className="font-bold text-primary-600">{formatCurrency(po.total_amount)}</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Order Items</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {po.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.description}</td>
                    <td className="px-4 py-2 text-center text-sm">{item.quantity}</td>
                    <td className="px-4 py-2 text-right text-sm">{formatCurrency(item.unit_price)}</td>
                    <td className="px-4 py-2 text-right text-sm font-medium">{formatCurrency(item.quantity * item.unit_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Forms */}
        {action === 'approve' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-fadeIn">
            <label className="block text-sm font-medium text-green-800 mb-2">Approval Comments (Optional)</label>
            <textarea
              className="form-input w-full"
              rows="2"
              placeholder="Add comments..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>
        )}

        {action === 'reject' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-fadeIn">
            <label className="block text-sm font-medium text-red-800 mb-2">Rejection Reason *</label>
            <textarea
              className="form-input w-full border-red-300 focus:border-red-500 focus:ring-red-500"
              rows="2"
              placeholder="Why is this being rejected?"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
        )}
      </div>

      <ModalFooter>
        <button onClick={onClose} className="btn btn-outline" disabled={approveMutation.isPending || rejectMutation.isPending}>
          Cancel
        </button>
        
        {!action && (
          <>
            <button onClick={handleReject} className="btn btn-danger flex items-center">
              <XCircle className="w-4 h-4 mr-2" /> Reject
            </button>
            <button onClick={handleApprove} className="btn btn-success flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" /> Approve
            </button>
          </>
        )}

        {action === 'approve' && (
          <button onClick={handleApprove} className="btn btn-success" disabled={approveMutation.isPending}>
            {approveMutation.isPending ? 'Processing...' : 'Confirm Approval'}
          </button>
        )}

        {action === 'reject' && (
          <button onClick={handleReject} className="btn btn-danger" disabled={rejectMutation.isPending}>
            {rejectMutation.isPending ? 'Processing...' : 'Confirm Rejection'}
          </button>
        )}
      </ModalFooter>
    </Modal>
  );
};

export default ApprovePOModal;