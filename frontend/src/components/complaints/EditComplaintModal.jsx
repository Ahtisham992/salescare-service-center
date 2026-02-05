
// ============================================
// 6. EditComplaintModal.jsx
// ============================================
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Modal, { ModalFooter } from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import ComplaintFormFields from './ComplaintFormFields';
import complaintService from '../../services/complaintService';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';

const EditComplaintModal = ({ isOpen, onClose, complaint, onSuccess }) => {
  const [formData, setFormData] = useState({
    customer_id: "",
    product_id: "",
    serial_number: "",
    warranty_status: "Out of Warranty",
    purchase_date: "",
    complaint_type: "",
    complaint_description: "",
    priority: "Medium",
    area_id: "1",
  });

  // Load complaint data when modal opens
  useEffect(() => {
    if (complaint && isOpen) {
      setFormData({
        customer_id: complaint.customer_id || "",
        product_id: complaint.product_id || "",
        serial_number: complaint.serial_number || "",
        warranty_status: complaint.warranty_status || "Out of Warranty",
        purchase_date: complaint.purchase_date || "",
        complaint_type: complaint.complaint_type || "",
        complaint_description: complaint.complaint_description || "",
        priority: complaint.priority || "Medium",
        area_id: complaint.area_id || "1",
      });
    }
  }, [complaint, isOpen]);

  // Fetch customers (for display only in edit mode)
  const { data: customersData } = useQuery({
    queryKey: ["customers-all"],
    queryFn: async () => {
      const response = await fetch("https://salescare-service-center.onrender.com/api/customers?limit=1000", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch customers");
      return response.json();
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch products (for display only in edit mode)
  const { data: productsData } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await fetch("https://salescare-service-center.onrender.com/api/products", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data) => complaintService.update(complaint.complaint_id, data),
    onSuccess: () => {
      toast.success("Complaint updated successfully");
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update complaint");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Only send editable fields
    const updateData = {
      complaint_type: formData.complaint_type,
      complaint_description: formData.complaint_description,
      priority: formData.priority,
    };
    
    updateMutation.mutate(updateData);
  };

  const customers = customersData?.data?.customers || [];
  const products = productsData?.data?.products || [];

  if (!complaint) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Complaint"
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          <ComplaintFormFields
            formData={formData}
            setFormData={setFormData}
            customers={customers}
            products={products}
            customersLoading={false}
            productsLoading={false}
            isEditing={true}
          />
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline"
            disabled={updateMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary flex items-center"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Update Complaint
              </>
            )}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default EditComplaintModal;
