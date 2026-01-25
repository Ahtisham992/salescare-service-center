
// ============================================
// 8. AssignTechnicianModal.jsx
// ============================================
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Modal, { ModalFooter } from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import complaintService from '../../services/complaintService';
import { getStatusColor } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { UserCheck } from 'lucide-react';

const AssignTechnicianModal = ({ isOpen, onClose, complaint, onSuccess }) => {
  const [selectedTechnician, setSelectedTechnician] = useState("");

  // Load current technician when modal opens
  useEffect(() => {
    if (complaint && isOpen) {
      setSelectedTechnician(complaint.technician_id || "");
    }
  }, [complaint, isOpen]);

  // Fetch technicians
  const { data: techniciansData, isLoading: techsLoading } = useQuery({
    queryKey: ["technicians"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch technicians");
      const result = await response.json();
      const techs = result.data.users.filter(u => u.role === 'technician' && u.is_active);
      return { data: { technicians: techs } };
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: (technicianId) => 
      complaintService.assignTechnician(complaint.complaint_id, technicianId),
    onSuccess: () => {
      toast.success("Technician assigned successfully");
      onSuccess?.();
      onClose();
      setSelectedTechnician("");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to assign technician");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedTechnician) {
      toast.error("Please select a technician");
      return;
    }
    assignMutation.mutate(selectedTechnician);
  };

  const technicians = techniciansData?.data?.technicians || [];

  if (!complaint) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setSelectedTechnician("");
      }}
      title="Assign Technician"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Complaint Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">
              Complaint: {complaint.complaint_number}
            </h4>
            <p className="text-sm text-gray-600">{complaint.complaint_description}</p>
            <p className="text-sm text-gray-500 mt-2">
              Current Status:{" "}
              <span className={`badge badge-${getStatusColor(complaint.status)}`}>
                {complaint.status}
              </span>
            </p>
          </div>

          {/* Technician Select */}
          <div>
            <label className="form-label">Select Technician *</label>
            {techsLoading ? (
              <div className="py-4 text-center">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <select
                value={selectedTechnician}
                onChange={(e) => setSelectedTechnician(e.target.value)}
                className="form-input"
                required
              >
                <option value="">Choose a technician...</option>
                {technicians.map((tech) => (
                  <option key={tech.user_id} value={tech.user_id}>
                    {tech.full_name} {tech.phone && `- ${tech.phone}`}
                  </option>
                ))}
              </select>
            )}
            {technicians.length === 0 && !techsLoading && (
              <p className="text-xs text-red-500 mt-1">
                No active technicians available
              </p>
            )}
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> If status is "Open", it will automatically change to "Assigned"
            </p>
          </div>
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={() => {
              onClose();
              setSelectedTechnician("");
            }}
            className="btn btn-outline"
            disabled={assignMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary flex items-center"
            disabled={assignMutation.isPending || !selectedTechnician}
          >
            {assignMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Assigning...
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4 mr-2" />
                Assign Technician
              </>
            )}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default AssignTechnicianModal;