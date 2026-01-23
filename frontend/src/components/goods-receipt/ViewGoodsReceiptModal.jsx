// frontend/src/components/goods-receipt/ViewGoodsReceiptModal.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import goodsReceiptService from '../../services/goodsReceiptService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { 
  Package, 
  Calendar, 
  MapPin, 
  User, 
  FileText,
  TrendingUp,
  Building
} from 'lucide-react';

const ViewGoodsReceiptModal = ({ isOpen, onClose, grId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['goods-receipt', grId],
    queryFn: () => goodsReceiptService.getById(grId),
    enabled: isOpen && !!grId
  });

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Goods Receipt Details" size="xl">
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      </Modal>
    );
  }

  const gr = data?.data;
  if (!gr) return null;

  const totalAmount = gr.items?.reduce((sum, item) => 
    sum + (item.quantity_received * item.unit_price), 0
  ) || 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Goods Receipt Details" size="xl">
      <div className="space-y-6">
        {/* Header Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-primary-600 font-medium uppercase mb-1">
                  GR Number
                </p>
                <p className="text-xl font-bold text-primary-900">
                  {gr.gr_number}
                </p>
              </div>
              <Package className="w-10 h-10 text-primary-600" />
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600 font-medium uppercase mb-1">
                  Total Amount
                </p>
                <p className="text-xl font-bold text-green-900">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-600" />
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg border">
          <div className="space-y-4">
            <div className="flex items-start">
              <FileText className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Purchase Order</p>
                <p className="font-semibold text-gray-900">{gr.po_number}</p>
                <p className="text-sm text-gray-600">{formatDate(gr.po_date)}</p>
              </div>
            </div>

            <div className="flex items-start">
              <Building className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Vendor</p>
                <p className="font-semibold text-gray-900">{gr.vendor_name}</p>
                <p className="text-sm text-gray-600">
                  {gr.vendor_code} • {gr.vendor_type}
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">GR Date</p>
                <p className="font-semibold text-gray-900">{formatDate(gr.gr_date)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start">
              <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Area / Location</p>
                <p className="font-semibold text-gray-900">{gr.area_name}</p>
                <p className="text-sm text-gray-600">{gr.area_code}</p>
              </div>
            </div>

            <div className="flex items-start">
              <User className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Received By</p>
                <p className="font-semibold text-gray-900">
                  {gr.received_by_name || 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Created At</p>
                <p className="font-semibold text-gray-900">
                  {formatDate(gr.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {gr.notes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-xs text-yellow-700 font-medium uppercase mb-2">
              Notes / Remarks
            </p>
            <p className="text-sm text-yellow-900">{gr.notes}</p>
          </div>
        )}

        {/* Items Table */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase">
            Received Items ({gr.items?.length || 0})
          </h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Item
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Qty Received
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Line Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {gr.items?.map((item, index) => (
                  <tr key={item.gr_item_id}>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {item.description}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.item_code} • {item.category}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="badge badge-info">
                        {item.quantity_received}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(item.line_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td colSpan="4" className="px-4 py-3 text-right font-bold text-gray-700">
                    Grand Total:
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900 text-lg">
                    {formatCurrency(totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Inventory Impact Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Package className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
            <div className="text-sm text-blue-800">
              <strong>Inventory Impact:</strong> This goods receipt added{' '}
              <strong>{gr.items?.reduce((sum, i) => sum + i.quantity_received, 0)} items</strong>{' '}
              to the <strong>{gr.area_name}</strong> inventory.
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t mt-6">
        <button onClick={onClose} className="btn btn-outline">
          Close
        </button>
      </div>
    </Modal>
  );
};

export default ViewGoodsReceiptModal;