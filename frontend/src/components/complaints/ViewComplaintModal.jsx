// frontend/src/components/complaints/ViewComplaintModal.jsx (WITH PDF SUPPORT)
import React from 'react';
import Modal, { ModalFooter } from '../common/Modal';
import ComplaintReceiptPDF from './ComplaintReceiptPDF';
import { formatDate, getStatusColor, getPriorityColor, getWarrantyColor } from '../../utils/formatters';

const ViewComplaintModal = ({ isOpen, onClose, complaint }) => {
  if (!complaint) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complaint Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Complaint #</label>
            <p className="text-gray-900 mt-1 font-semibold">{complaint.complaint_number}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Date</label>
            <p className="text-gray-900 mt-1">{formatDate(complaint.complaint_date)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Status</label>
            <div className="mt-1">
              <span className={`badge badge-${getStatusColor(complaint.status)}`}>
                {complaint.status}
              </span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Priority</label>
            <div className="mt-1">
              <span className={`badge badge-${getPriorityColor(complaint.priority)}`}>
                {complaint.priority}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Name</label>
              <p className="text-gray-900 mt-1">{complaint.customer_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Phone</label>
              <p className="text-gray-900 mt-1">{complaint.customer_phone}</p>
            </div>
            {complaint.customer_address && (
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-600">Address</label>
                <p className="text-gray-900 mt-1">{complaint.customer_address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Product Information */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-semibold text-gray-900 mb-3">Product Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Product</label>
              <p className="text-gray-900 mt-1">{complaint.product_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Serial Number</label>
              <p className="text-gray-900 mt-1">{complaint.serial_number || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Warranty Status</label>
              <div className="mt-1">
                <span className={`badge badge-${getWarrantyColor(complaint.warranty_status)}`}>
                  {complaint.warranty_status}
                </span>
              </div>
            </div>
            {complaint.purchase_date && (
              <div>
                <label className="text-sm font-medium text-gray-600">Purchase Date</label>
                <p className="text-gray-900 mt-1">{formatDate(complaint.purchase_date)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Technician Info */}
        {complaint.technician_name && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-semibold text-gray-900 mb-3">Assigned Technician</h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-900 font-medium">{complaint.technician_name}</p>
              {complaint.technician_phone && (
                <p className="text-sm text-gray-600 mt-1">{complaint.technician_phone}</p>
              )}
            </div>
          </div>
        )}

        {/* Complaint Details */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-semibold text-gray-900 mb-2">Complaint Details</h4>
          {complaint.complaint_type && (
            <div className="mb-3">
              <label className="text-sm font-medium text-gray-600">Type</label>
              <p className="text-gray-900 mt-1">{complaint.complaint_type}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-600">Description</label>
            <p className="text-gray-700 mt-1">
              {complaint.complaint_description || "No description provided"}
            </p>
          </div>
        </div>

        {/* Timeline */}
        {(complaint.scheduled_date || complaint.completion_date) && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-semibold text-gray-900 mb-3">Timeline</h4>
            <div className="grid grid-cols-2 gap-4">
              {complaint.scheduled_date && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Scheduled Date</label>
                  <p className="text-gray-900 mt-1">{formatDate(complaint.scheduled_date)}</p>
                </div>
              )}
              {complaint.completion_date && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Completed Date</label>
                  <p className="text-gray-900 mt-1">{formatDate(complaint.completion_date)}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ModalFooter>
        <div className="flex gap-2 flex-wrap">
          <ComplaintReceiptPDF complaint={complaint} type="customer" />
          <ComplaintReceiptPDF complaint={complaint} type="office" />
        </div>
        {/* <button onClick={onClose} className="btn btn-primary">
          Close
        </button> */}
      </ModalFooter>
    </Modal>
  );
};

export default ViewComplaintModal;