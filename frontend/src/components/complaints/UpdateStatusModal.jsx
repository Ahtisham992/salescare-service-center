// ============================================
// 9. UpdateStatusModal.jsx
// ============================================
import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import Modal, { ModalFooter } from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import complaintService from '../../services/complaintService';
import { getStatusColor } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { Clock } from 'lucide-react';

const UpdateStatusModal = ({ isOpen, onClose, complaint, onSuccess }) => {
  const [selectedStatus, setSelectedStatus] = useState("");

  // Load current status when modal opens
  useEffect(() => {
    if (complaint && isOpen) {
      setSelectedStatus(complaint.status || "");
    }
  }, [complaint, isOpen]);

  // Update status mutation
  const statusMutation = useMutation({
    mutationFn: (status) => complaintService.updateStatus(complaint.complaint_id, status),
    onSuccess: () => {
      toast.success("Status updated successfully");
      onSuccess?.();
      onClose();
      setSelectedStatus("");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update status");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedStatus) {
      toast.error("Please select a status");
      return;
    }
    statusMutation.mutate(selectedStatus);
  };

  if (!complaint) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setSelectedStatus("");
      }}
      title="Update Complaint Status"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Complaint Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">
              Complaint: {complaint.complaint_number}
            </h4>
            <p className="text-sm text-gray-600">Customer: {complaint.customer_name}</p>
            <p className="text-sm text-gray-500 mt-2">
              Current Status:{" "}
              <span className={`badge badge-${getStatusColor(complaint.status)}`}>
                {complaint.status}
              </span>
            </p>
          </div>

          {/* Status Select */}
          <div>
            <label className="form-label">New Status *</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="form-input"
              required
            >
              <option value="">Select new status...</option>
              <option value="Open">Open</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Completion Note */}
          {selectedStatus === 'Completed' && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Note:</strong> Completion date will be automatically set to now
              </p>
            </div>
          )}
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={() => {
              onClose();
              setSelectedStatus("");
            }}
            className="btn btn-outline"
            disabled={statusMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary flex items-center"
            disabled={statusMutation.isPending || !selectedStatus}
          >
            {statusMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Updating...
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Update Status
              </>
            )}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default UpdateStatusModal;
