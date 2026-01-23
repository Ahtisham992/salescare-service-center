// frontend/src/components/purchase/ViewPurchaseOrderModal.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Modal, { ModalFooter } from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import purchaseService from '../../services/purchaseService';
import { formatDate, formatCurrency, getStatusColor } from '../../utils/formatters';
import { Package, Calendar, User, FileText } from 'lucide-react';

const ViewPurchaseOrderModal = ({ isOpen, onClose, poId }) => {
  // Fetch PO details
  const { data, isLoading, error } = useQuery({
    queryKey: ['purchase-order', poId],
    queryFn: () => purchaseService.getById(poId),
    enabled: !!poId
  });

  const po = data?.data;

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Purchase Order Details" size="lg">
        <div className="text-center py-12">
          <LoadingSpinner />
          <p className="text-gray-500 mt-4">Loading purchase order...</p>
        </div>
      </Modal>
    );
  }

  if (error || !po) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Purchase Order Details" size="lg">
        <div className="text-center py-12 text-red-500">
          Failed to load purchase order details
        </div>
        <ModalFooter>
          <button onClick={onClose} className="btn btn-primary">Close</button>
        </ModalFooter>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Purchase Order Details" size="lg">
      <div className="space-y-6">
        {/* PO Header */}
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
          <div>
            <label className="text-sm font-medium text-gray-600 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              PO Number
            </label>
            <p className="text-gray-900 mt-1 font-semibold text-lg">{po.po_number}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              PO Date
            </label>
            <p className="text-gray-900 mt-1">{formatDate(po.po_date)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Status</label>
            <div className="mt-1">
              <span className={`badge badge-${getStatusColor(po.status)}`}>
                {po.status}
              </span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Created By
            </label>
            <p className="text-gray-900 mt-1">{po.created_by_name || 'N/A'}</p>
          </div>
        </div>

        {/* Vendor Information */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-semibold text-gray-900 mb-3">Vendor Information</h4>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-blue-900">Vendor Name</label>
                <p className="text-blue-700 mt-1 font-semibold">{po.vendor_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-blue-900">Vendor Code</label>
                <p className="text-blue-700 mt-1">{po.vendor_code}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-blue-900">Vendor Type</label>
                <p className="text-blue-700 mt-1">
                  <span className="badge badge-info">{po.vendor_type}</span>
                </p>
              </div>
              {po.contact_person && (
                <div>
                  <label className="text-sm font-medium text-blue-900">Contact Person</label>
                  <p className="text-blue-700 mt-1">{po.contact_person}</p>
                </div>
              )}
              {po.vendor_phone && (
                <div>
                  <label className="text-sm font-medium text-blue-900">Phone</label>
                  <p className="text-blue-700 mt-1">{po.vendor_phone}</p>
                </div>
              )}
              {po.vendor_email && (
                <div>
                  <label className="text-sm font-medium text-blue-900">Email</label>
                  <p className="text-blue-700 mt-1">{po.vendor_email}</p>
                </div>
              )}
            </div>
            {po.vendor_address && (
              <div className="mt-3 pt-3 border-t border-blue-300">
                <label className="text-sm font-medium text-blue-900">Address</label>
                <p className="text-blue-700 mt-1">{po.vendor_address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Items Ordered
          </h4>
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {po.items?.map((item, index) => (
                  <tr key={item.po_item_id}>
                    <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{item.description}</div>
                      <div className="text-xs text-gray-500">{item.item_code}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge ${
                        item.status === 'FOC' ? 'badge-success' :
                        item.status === 'OPB' ? 'badge-warning' :
                        'badge-info'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="5" className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                    Total Amount:
                  </td>
                  <td className="px-4 py-3 text-right text-lg font-bold text-primary-600">
                    {formatCurrency(po.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Additional Info */}
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="font-medium text-gray-600">Created At</label>
              <p className="text-gray-900 mt-1">{formatDate(po.created_at)}</p>
            </div>
            {po.status === 'received' && (
              <div>
                <label className="font-medium text-gray-600">Status</label>
                <p className="text-green-600 mt-1 font-medium">✓ Goods Receipt Created</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ModalFooter>
        <button onClick={onClose} className="btn btn-primary">
          Close
        </button>
      </ModalFooter>
    </Modal>
  );
};

export default ViewPurchaseOrderModal;