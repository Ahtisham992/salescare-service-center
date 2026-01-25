// ============================================
// 5. CreateComplaintModal.jsx
// ============================================
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Modal, { ModalFooter } from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import ComplaintFormFields from './ComplaintFormFields';
import complaintService from '../../services/complaintService';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';

const CreateComplaintModal = ({ isOpen, onClose, onSuccess }) => {
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

  // Fetch customers
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ["customers-all"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/customers?limit=1000", {
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

  // Fetch products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/products", {
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

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => complaintService.create(data),
    onSuccess: () => {
      toast.success("Complaint created successfully");
      onSuccess?.();
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create complaint");
    },
  });

  const resetForm = () => {
    setFormData({
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
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const customers = customersData?.data?.customers || [];
  const products = productsData?.data?.products || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        resetForm();
      }}
      title="Create New Complaint"
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          {customersLoading || productsLoading ? (
            <div className="text-center py-8">
              <LoadingSpinner />
              <p className="text-gray-500 mt-2">Loading form data...</p>
            </div>
          ) : (
            <ComplaintFormFields
              formData={formData}
              setFormData={setFormData}
              customers={customers}
              products={products}
              customersLoading={customersLoading}
              productsLoading={productsLoading}
              isEditing={false}
            />
          )}
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="btn btn-outline"
            disabled={createMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary flex items-center"
            disabled={createMutation.isPending || customersLoading || productsLoading}
          >
            {createMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Complaint
              </>
            )}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default CreateComplaintModal;