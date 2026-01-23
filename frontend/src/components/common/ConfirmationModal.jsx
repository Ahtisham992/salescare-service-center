// frontend/src/components/common/ConfirmationModal.jsx
import React from 'react';
import Modal, { ModalFooter } from './Modal';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  type = 'warning', // 'warning', 'danger', 'success', 'info'
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false
}) => {
  // Icon and color based on type
  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          icon: XCircle,
          iconColor: 'text-red-600',
          bgColor: 'bg-red-50',
          buttonClass: 'btn-danger'
        };
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-600',
          bgColor: 'bg-green-50',
          buttonClass: 'btn-success'
        };
      case 'info':
        return {
          icon: Info,
          iconColor: 'text-blue-600',
          bgColor: 'bg-blue-50',
          buttonClass: 'btn-primary'
        };
      case 'warning':
      default:
        return {
          icon: AlertTriangle,
          iconColor: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          buttonClass: 'btn-warning'
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md" showClose={false}>
      <div className="space-y-4">
        {/* Icon and Message */}
        <div className={`flex items-start space-x-4 p-4 rounded-lg ${config.bgColor}`}>
          <div className="flex-shrink-0">
            <Icon className={`w-8 h-8 ${config.iconColor}`} />
          </div>
          <div className="flex-1">
            <p className="text-gray-700 text-sm leading-relaxed">{message}</p>
          </div>
        </div>
      </div>

      <ModalFooter>
        <button
          onClick={onClose}
          className="btn btn-outline"
          disabled={isLoading}
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          className={`btn ${config.buttonClass}`}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : confirmText}
        </button>
      </ModalFooter>
    </Modal>
  );
};

export default ConfirmationModal;