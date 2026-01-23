// frontend/src/components/vendors/CreateVendorModal.jsx
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal, { ModalFooter } from '../common/Modal';
import vendorService from '../../services/vendorService';
import { toast } from 'react-hot-toast';
import { Building, User, Phone, Mail, MapPin } from 'lucide-react';

const CreateVendorModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    vendor_code: '',
    vendor_name: '',
    vendor_type: 'Vendor',
    contact_person: '',
    phone: '',
    email: '',
    address: ''
  });

  const [errors, setErrors] = useState({});

  const createMutation = useMutation({
    mutationFn: (data) => vendorService.create(data),
    onSuccess: () => {
      toast.success('Vendor created successfully');
      queryClient.invalidateQueries(['vendors']);
      onClose();
      resetForm();
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Failed to create vendor';
      toast.error(msg);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  });

  const resetForm = () => {
    setFormData({
      vendor_code: '',
      vendor_name: '',
      vendor_type: 'Vendor',
      contact_person: '',
      phone: '',
      email: '',
      address: ''
    });
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors = {};
    if (!formData.vendor_code.trim()) {
      newErrors.vendor_code = 'Vendor code is required';
    }
    if (!formData.vendor_name.trim()) {
      newErrors.vendor_name = 'Vendor name is required';
    }
    if (!formData.vendor_type) {
      newErrors.vendor_type = 'Vendor type is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    createMutation.mutate(formData);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Create New Vendor"
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label flex items-center">
                <Building className="w-4 h-4 mr-2 text-gray-500" />
                Vendor Code *
              </label>
              <input
                type="text"
                name="vendor_code"
                value={formData.vendor_code}
                onChange={handleChange}
                className={`form-input ${errors.vendor_code ? 'border-red-500' : ''}`}
                placeholder="e.g., VEN-001"
                disabled={createMutation.isPending}
              />
              {errors.vendor_code && (
                <p className="mt-1 text-sm text-red-600">{errors.vendor_code}</p>
              )}
            </div>

            <div>
              <label className="form-label flex items-center">
                <Building className="w-4 h-4 mr-2 text-gray-500" />
                Vendor Name *
              </label>
              <input
                type="text"
                name="vendor_name"
                value={formData.vendor_name}
                onChange={handleChange}
                className={`form-input ${errors.vendor_name ? 'border-red-500' : ''}`}
                placeholder="Enter vendor name"
                disabled={createMutation.isPending}
              />
              {errors.vendor_name && (
                <p className="mt-1 text-sm text-red-600">{errors.vendor_name}</p>
              )}
            </div>
          </div>

          {/* Vendor Type */}
          <div>
            <label className="form-label">Vendor Type *</label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                formData.vendor_type === 'Vendor' 
                  ? 'border-primary-600 bg-primary-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  name="vendor_type"
                  value="Vendor"
                  checked={formData.vendor_type === 'Vendor'}
                  onChange={handleChange}
                  className="sr-only"
                  disabled={createMutation.isPending}
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Regular Vendor</p>
                  <p className="text-sm text-gray-500">External supplier</p>
                </div>
              </label>

              <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                formData.vendor_type === 'LPR' 
                  ? 'border-primary-600 bg-primary-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  name="vendor_type"
                  value="LPR"
                  checked={formData.vendor_type === 'LPR'}
                  onChange={handleChange}
                  className="sr-only"
                  disabled={createMutation.isPending}
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">LPR</p>
                  <p className="text-sm text-gray-500">Local Purchase Req.</p>
                </div>
              </label>
            </div>
          </div>

          {/* Contact Info */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Contact Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="form-label flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-500" />
                  Contact Person
                </label>
                <input
                  type="text"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter contact person name"
                  disabled={createMutation.isPending}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-gray-500" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="03XX-XXXXXXX"
                    disabled={createMutation.isPending}
                  />
                </div>

                <div>
                  <label className="form-label flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-500" />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="vendor@example.com"
                    disabled={createMutation.isPending}
                  />
                </div>
              </div>

              <div>
                <label className="form-label flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="form-input"
                  rows="3"
                  placeholder="Enter complete address"
                  disabled={createMutation.isPending}
                />
              </div>
            </div>
          </div>
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline"
            disabled={createMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Vendor'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default CreateVendorModal;