// frontend/src/components/vendors/EditVendorModal.jsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal, { ModalFooter } from '../common/Modal';
import vendorService from '../../services/vendorService';
import { toast } from 'react-hot-toast';
import { Building, User, Phone, Mail, MapPin } from 'lucide-react';

const EditVendorModal = ({ isOpen, onClose, vendor }) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    vendor_name: '',
    vendor_type: 'Vendor',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    is_active: true
  });

  const [errors, setErrors] = useState({});

  // Initialize form with vendor data
  useEffect(() => {
    if (vendor) {
      setFormData({
        vendor_name: vendor.vendor_name || '',
        vendor_type: vendor.vendor_type || 'Vendor',
        contact_person: vendor.contact_person || '',
        phone: vendor.phone || '',
        email: vendor.email || '',
        address: vendor.address || '',
        is_active: vendor.is_active !== undefined ? vendor.is_active : true
      });
    }
  }, [vendor]);

  const updateMutation = useMutation({
    mutationFn: (data) => vendorService.update(vendor.vendor_id, data),
    onSuccess: () => {
      toast.success('Vendor updated successfully');
      queryClient.invalidateQueries(['vendors']);
      onClose();
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Failed to update vendor';
      toast.error(msg);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};
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

    updateMutation.mutate(formData);
  };

  if (!vendor) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Edit Vendor - ${vendor.vendor_code}`}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Read-only Vendor Code */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <Building className="w-5 h-5 text-gray-500 mr-3" />
              <div>
                <p className="text-xs text-gray-500 uppercase">Vendor Code</p>
                <p className="font-semibold text-gray-900">{vendor.vendor_code}</p>
              </div>
            </div>
          </div>

          {/* Vendor Name and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Vendor Name *</label>
              <input
                type="text"
                name="vendor_name"
                value={formData.vendor_name}
                onChange={handleChange}
                className={`form-input ${errors.vendor_name ? 'border-red-500' : ''}`}
                placeholder="Enter vendor name"
                disabled={updateMutation.isPending}
              />
              {errors.vendor_name && (
                <p className="mt-1 text-sm text-red-600">{errors.vendor_name}</p>
              )}
            </div>

            <div>
              <label className="form-label">Vendor Type *</label>
              <select
                name="vendor_type"
                value={formData.vendor_type}
                onChange={handleChange}
                className={`form-input ${errors.vendor_type ? 'border-red-500' : ''}`}
                disabled={updateMutation.isPending}
              >
                <option value="Vendor">Regular Vendor</option>
                <option value="LPR">LPR</option>
              </select>
              {errors.vendor_type && (
                <p className="mt-1 text-sm text-red-600">{errors.vendor_type}</p>
              )}
            </div>
          </div>

          {/* Contact Information */}
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
                  disabled={updateMutation.isPending}
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
                    disabled={updateMutation.isPending}
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
                    disabled={updateMutation.isPending}
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
                  disabled={updateMutation.isPending}
                />
              </div>
            </div>
          </div>

          {/* Status Toggle */}
          <div className="border-t pt-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="form-checkbox h-5 w-5 text-primary-600"
                disabled={updateMutation.isPending}
              />
              <span className="ml-3 text-sm font-medium text-gray-900">
                Vendor is Active
              </span>
            </label>
            <p className="mt-1 text-sm text-gray-500 ml-8">
              Inactive vendors won't appear in purchase order selections
            </p>
          </div>
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
            className="btn btn-primary"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Updating...' : 'Update Vendor'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default EditVendorModal;