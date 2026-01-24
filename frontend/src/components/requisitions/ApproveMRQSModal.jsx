// frontend/src/components/requisitions/ApproveMRQSModal.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal, { ModalFooter } from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import requisitionService from '../../services/requisitionService';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle, Package } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

const ApproveMRQSModal = ({ isOpen, onClose, mrqsId }) => {
  const queryClient = useQueryClient();
  const [action, setAction] = useState(null); // 'approve' or 'reject'
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch MRQS details
  const { data, isLoading } = useQuery({
    queryKey: ['mrqs-detail', mrqsId],
    queryFn: () => requisitionService.getMRQSById(mrqsId),
    enabled: isOpen && !!mrqsId
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: () => requisitionService.approveMRQS(mrqsId, { comments }),
    onSuccess: () => {
      toast.success('MRQS Approved Successfully');
      queryClient.invalidateQueries(['mrqs-list']);
      queryClient.invalidateQueries(['pending-approvals']);
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to approve MRQS');
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: () => requisitionService.rejectMRQS(mrqsId, { rejection_reason: rejectionReason }),
    onSuccess: () => {
      toast.success('MRQS Rejected');
      queryClient.invalidateQueries(['mrqs-list']);
      queryClient.invalidateQueries(['pending-approvals']);
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to reject MRQS');
    }
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
      toast.error('Please provide a rejection reason');
      return;
    }
    rejectMutation.mutate();
  };

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Approve MRQS" size="lg">
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      </Modal>
    );
  }

  const mrqs = data?.data;
  if (!mrqs) return null;

  const totalAmount = mrqs.items?.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0) || 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Approve Material Requisition" size="xl">
      <div className="space-y-6">
        {/* MRQS Header Info */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-primary-600 font-medium uppercase">MRQS Number</p>
              <p className="text-lg font-bold text-primary-900">{mrqs.mrqs_number}</p>
            </div>
            <div>
              <p className="text-xs text-primary-600 font-medium uppercase">Date</p>
              <p className="text-lg font-bold text-primary-900">{formatDate(mrqs.mrqs_date)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium uppercase">Complaint #</p>
              <p className="text-sm font-semibold text-gray-900">{mrqs.complaint_number}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium uppercase">Product</p>
              <p className="text-sm font-semibold text-gray-900">{mrqs.product_name}</p>
            </div>
          </div>
        </div>

        {/* Requester Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <Package className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600 uppercase">Cost Center</p>
              <p className="font-semibold text-gray-900">{mrqs.area_name}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Package className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600 uppercase">Technician</p>
              <p className="font-semibold text-gray-900">{mrqs.technician_name}</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Requested Items</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-28">Unit Price</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-28">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mrqs.items?.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{item.description}</div>
                      <div className="text-xs text-gray-500">{item.item_code}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="badge badge-info">{item.quantity}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge ${
                        item.item_status === 'UW' ? 'badge-success' :
                        item.item_status === 'OPB' ? 'badge-warning' :
                        'badge-info'
                      }`}>
                        {item.item_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td colSpan="4" className="px-4 py-3 text-right font-bold text-gray-700">
                    Total Amount:
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900 text-lg">
                    {formatCurrency(totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Action Selection */}
        {!action && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
              <div className="text-sm text-blue-800">
                <strong>Review Required:</strong> Please review the requested items and verify stock availability before approving.
              </div>
            </div>
          </div>
        )}

        {/* Approve Form */}
        {action === 'approve' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center text-green-800">
              <CheckCircle className="w-5 h-5 mr-2" />
              <strong>Approve MRQS</strong>
            </div>
            <div>
              <label className="form-label">Comments (Optional)</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="form-input"
                rows="3"
                placeholder="Add any comments about this approval..."
              />
            </div>
          </div>
        )}

        {/* Reject Form */}
        {action === 'reject' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center text-red-800">
              <XCircle className="w-5 h-5 mr-2" />
              <strong>Reject MRQS</strong>
            </div>
            <div>
              <label className="form-label">Rejection Reason *</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="form-input"
                rows="3"
                placeholder="Please provide a reason for rejection..."
                required
              />
            </div>
          </div>
        )}
      </div>

      <ModalFooter>
        <button
          onClick={onClose}
          className="btn btn-outline"
          disabled={approveMutation.isPending || rejectMutation.isPending}
        >
          Cancel
        </button>

        {!action && (
          <>
            <button
              onClick={handleReject}
              className="btn btn-danger flex items-center"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </button>
            <button
              onClick={handleApprove}
              className="btn btn-success flex items-center"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </button>
          </>
        )}

        {action === 'approve' && (
          <button
            onClick={handleApprove}
            className="btn btn-success"
            disabled={approveMutation.isPending}
          >
            {approveMutation.isPending ? 'Approving...' : 'Confirm Approval'}
          </button>
        )}

        {action === 'reject' && (
          <button
            onClick={handleReject}
            className="btn btn-danger"
            disabled={rejectMutation.isPending}
          >
            {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
          </button>
        )}
      </ModalFooter>
    </Modal>
  );
};

export default ApproveMRQSModal;