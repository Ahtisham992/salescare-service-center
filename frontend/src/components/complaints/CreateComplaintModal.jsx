// frontend/src/components/complaints/CreateComplaintModal.jsx (FIXED VERSION)
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Modal, { ModalFooter } from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import ComplaintFormFields from './ComplaintFormFields';
import complaintService from '../../services/complaintService';
import toast from 'react-hot-toast';
import { Save, Zap } from 'lucide-react';

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
  
  const [autoAssigning, setAutoAssigning] = useState(false);

  // Fetch customers
  const { data: customersData, isLoading: customersLoading } = useQuery({
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

  // Fetch products
  const { data: productsData, isLoading: productsLoading } = useQuery({
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

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await complaintService.create(data);
      return response;
    },
    onSuccess: async (response) => {
      const complaintId = response?.data?.complaint_id || response?.data?.data?.complaint_id;
      
      // Auto-assign if checkbox was checked
      if (autoAssigning && complaintId) {
        try {
          // Get available technician
          const techResponse = await fetch('https://salescare-service-center.onrender.com/api/complaints/auto-assign', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          });
          
          if (!techResponse.ok) {
            throw new Error('Failed to get technician');
          }
          
          const techResult = await techResponse.json();
          const technicianId = techResult.data.technician.user_id;
          const technicianName = techResult.data.technician.full_name;
          
          // Assign to complaint
          const assignResponse = await fetch(`https://salescare-service-center.onrender.com/api/complaints/${complaintId}/assign`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
            body: JSON.stringify({ technician_id: technicianId })
          });
          
          if (!assignResponse.ok) {
            throw new Error('Failed to assign technician');
          }
          
          toast.success(`Complaint created and assigned to ${technicianName}`);
        } catch (error) {
          console.error('Auto-assign error:', error);
          toast.success('Complaint created successfully');
          toast.error('But failed to auto-assign technician');
        }
      } else {
        toast.success("Complaint created successfully");
      }
      
      onSuccess?.();
      onClose();
      resetForm();
    },
    onError: (error) => {
      console.error('Create error:', error);
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
    setAutoAssigning(false);
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
            <>
              <ComplaintFormFields
                formData={formData}
                setFormData={setFormData}
                customers={customers}
                products={products}
                customersLoading={customersLoading}
                productsLoading={productsLoading}
                isEditing={false}
              />
              
              {/* Auto-assign option */}
              <div className="border-t pt-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoAssigning}
                    onChange={(e) => setAutoAssigning(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    <Zap className="w-4 h-4 mr-1 text-yellow-500" />
                    Auto-assign to available technician (least workload)
                  </span>
                </label>
              </div>
            </>
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
                {autoAssigning ? 'Creating & Assigning...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {autoAssigning ? 'Create & Auto-Assign' : 'Create Complaint'}
              </>
            )}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default CreateComplaintModal;