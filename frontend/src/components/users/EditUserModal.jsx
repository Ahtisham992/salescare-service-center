// frontend/src/components/users/EditUserModal.jsx
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal, { ModalFooter } from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import userService from '../../services/userService';
import { toast } from 'react-hot-toast';
import { Edit3 } from 'lucide-react';

const ROLES = [
  { value: 'admin', label: 'Admin', description: 'Full system access' },
  { value: 'manager', label: 'Manager', description: 'Management and reporting' },
  { value: 'technician', label: 'Technician', description: 'Service and repairs' },
  { value: 'receptionist', label: 'Receptionist', description: 'Front desk operations' },
];

const EditUserModal = ({ isOpen, onClose, user, onSuccess }) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: '',
    is_active: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || '',
        is_active: user.is_active !== undefined ? user.is_active : true,
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data) => userService.update(user.user_id, data),
    onSuccess: () => {
      toast.success('User updated successfully!');
      queryClient.invalidateQueries(['users']);
      onSuccess?.();
      handleClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    },
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    updateMutation.mutate(formData);
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Edit User: ${user.username}`}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Username (Read-only) */}
          <div>
            <label className="form-label">Username</label>
            <input
              type="text"
              value={user.username}
              className="form-input bg-gray-50"
              disabled
              readOnly
            />
            <p className="mt-1 text-xs text-gray-500">Username cannot be changed</p>
          </div>

          {/* Full Name */}
          <div>
            <label className="form-label required">Full Name</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              className={`form-input ${errors.full_name ? 'border-red-500' : ''}`}
              placeholder="e.g., John Doe"
              disabled={updateMutation.isPending}
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`form-input ${errors.email ? 'border-red-500' : ''}`}
              placeholder="user@example.com"
              disabled={updateMutation.isPending}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="form-label">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`form-input ${errors.phone ? 'border-red-500' : ''}`}
              placeholder="+92 300 1234567"
              disabled={updateMutation.isPending}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="form-label required">Role</label>
            <select
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              className={`form-input ${errors.role ? 'border-red-500' : ''}`}
              disabled={updateMutation.isPending}
            >
              <option value="">-- Select Role --</option>
              {ROLES.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label} - {role.description}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role}</p>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="form-checkbox"
              disabled={updateMutation.isPending}
            />
            <label htmlFor="is_active" className="ml-3">
              <span className="font-medium text-gray-900">Active Account</span>
              <p className="text-sm text-gray-500">
                {formData.is_active 
                  ? 'User can login and access the system' 
                  : 'User account is deactivated and cannot login'}
              </p>
            </label>
          </div>
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={handleClose}
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
            {updateMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Updating...
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4 mr-2" />
                Update User
              </>
            )}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default EditUserModal;