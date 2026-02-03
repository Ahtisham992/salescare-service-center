// frontend/src/components/users/ResetPasswordModal.jsx
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal, { ModalFooter } from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import userService from '../../services/userService';
import { toast } from 'react-hot-toast';
import { Key, Eye, EyeOff, AlertCircle } from 'lucide-react';

const ResetPasswordModal = ({ isOpen, onClose, user, onSuccess }) => {
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});

  const resetMutation = useMutation({
    mutationFn: (newPassword) => userService.resetPassword(user.user_id, newPassword),
    onSuccess: () => {
      toast.success(`Password reset successfully for ${user.full_name}!`);
      queryClient.invalidateQueries(['users']);
      onSuccess?.();
      handleClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    },
  });

  const validateForm = () => {
    const newErrors = {};

    if (!password) {
      newErrors.password = 'New password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm the password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    resetMutation.mutate(password);
  };

  const handleClose = () => {
    setPassword('');
    setConfirmPassword('');
    setErrors({});
    setShowPassword(false);
    onClose();
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reset Password"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Warning Alert */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-yellow-900 mb-1">
                  Reset Password for {user.full_name}
                </h4>
                <p className="text-sm text-yellow-700">
                  The user will need to use this new password to login. Make sure to communicate this securely.
                </p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Username:</span>
              <span className="font-medium text-gray-900">{user.username}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Role:</span>
              <span className="font-medium text-gray-900 capitalize">{user.role}</span>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="form-label required">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                }}
                className={`form-input pr-10 ${errors.password ? 'border-red-500' : ''}`}
                placeholder="Minimum 6 characters"
                disabled={resetMutation.isPending}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="form-label required">Confirm New Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
              }}
              className={`form-input ${errors.confirmPassword ? 'border-red-500' : ''}`}
              placeholder="Re-enter password"
              disabled={resetMutation.isPending}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Password Strength Indicator */}
          {password && (
            <div className="space-y-2">
              <div className="text-xs text-gray-600">Password Strength:</div>
              <div className="flex space-x-1">
                <div className={`h-1 flex-1 rounded ${password.length >= 6 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                <div className={`h-1 flex-1 rounded ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                <div className={`h-1 flex-1 rounded ${password.length >= 10 && /[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                <div className={`h-1 flex-1 rounded ${password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 'bg-green-500' : 'bg-gray-200'}`}></div>
              </div>
              <div className="text-xs text-gray-500">
                {password.length < 6 && 'Weak - Add more characters'}
                {password.length >= 6 && password.length < 8 && 'Fair - Consider adding more characters'}
                {password.length >= 8 && password.length < 10 && 'Good'}
                {password.length >= 10 && /[A-Z]/.test(password) && 'Strong'}
                {password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && 'Very Strong!'}
              </div>
            </div>
          )}
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={handleClose}
            className="btn btn-outline"
            disabled={resetMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-danger"
            disabled={resetMutation.isPending}
          >
            {resetMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Resetting...
              </>
            ) : (
              <>
                <Key className="w-4 h-4 mr-2" />
                Reset Password
              </>
            )}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default ResetPasswordModal;