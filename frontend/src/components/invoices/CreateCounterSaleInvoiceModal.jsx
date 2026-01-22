// frontend/src/components/invoices/CreateCounterSaleInvoiceModal.jsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal, { ModalFooter } from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import { apiHelper } from '../../services/api';
import invoiceService from '../../services/invoiceService';
import { formatCurrency } from '../../utils/formatters';
import { numberToWords } from '../../utils/numberToWords';
import { toast } from 'react-hot-toast';
import { ShoppingCart, AlertCircle } from 'lucide-react';

const CreateCounterSaleInvoiceModal = ({ isOpen, onClose, onSuccess }) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    do_id: '',
    area_id: '',
    discount: 0,
    waive_off: 0,
    payment_terms: '',
    is_co: false,
  });

  const [selectedDO, setSelectedDO] = useState(null);

  // Fetch delivered DOs without invoices
  const { data: doData, isLoading: doLoading } = useQuery({
    queryKey: ['delivery-orders-for-invoice'],
    queryFn: async () => {
      return await apiHelper.get('/delivery-orders?status=Delivered&limit=100');
    },
    enabled: isOpen,
  });

  // Fetch DO details when selected
  const { data: doDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['do-detail', formData.do_id],
    queryFn: async () => {
      return await apiHelper.get(`/delivery-orders/${formData.do_id}`);
    },
    enabled: !!formData.do_id,
  });

  useEffect(() => {
    if (doDetails?.data) {
      setSelectedDO(doDetails.data);
      setFormData(prev => ({
        ...prev,
        area_id: doDetails.data.area_id,
      }));
    }
  }, [doDetails]);

  // Create invoice mutation
  const createMutation = useMutation({
    mutationFn: (data) => invoiceService.createCounterSale(data),
    onSuccess: () => {
      toast.success('Counter sale invoice created successfully!');
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['delivery-orders']);
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    },
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!selectedDO || !selectedDO.items) {
      return {
        subtotal: 0,
        gst: 0,
        discount: 0,
        total: 0,
        waiveOff: 0,
        netAmount: 0,
      };
    }

    let subtotal = 0;
    let gst = 0;

    selectedDO.items.forEach(item => {
      const lineTotal = parseFloat(item.quantity) * parseFloat(item.unit_price);
      const itemGst = lineTotal * (parseFloat(item.gst_percentage) / 100);
      
      subtotal += lineTotal;
      gst += itemGst;
    });

    const discount = parseFloat(formData.discount || 0);
    const waiveOff = parseFloat(formData.waive_off || 0);
    const total = subtotal + gst - discount;
    const netAmount = total - waiveOff;

    return {
      subtotal,
      gst,
      discount,
      total,
      waiveOff,
      netAmount,
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.do_id) {
      toast.error('Please select a delivery order');
      return;
    }

    const submitData = {
      do_id: parseInt(formData.do_id),
      area_id: parseInt(formData.area_id),
      discount: parseFloat(formData.discount || 0),
      waive_off: parseFloat(formData.waive_off || 0),
      payment_terms: formData.payment_terms || null,
      is_co: formData.is_co,
    };

    createMutation.mutate(submitData);
  };

  const deliveryOrders = doData?.data?.delivery_orders || [];
  const totals = calculateTotals();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Counter Sale Invoice"
      size="xl"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* DO Selection */}
          <div>
            <label className="form-label required">Select Delivery Order</label>
            {doLoading ? (
              <div className="py-4"><LoadingSpinner size="sm" /></div>
            ) : (
              <select
                value={formData.do_id}
                onChange={(e) => handleInputChange('do_id', e.target.value)}
                className="form-input"
                required
              >
                <option value="">-- Select Delivery Order --</option>
                {deliveryOrders.map(dorder => (
                  <option key={dorder.do_id} value={dorder.do_id}>
                    {dorder.do_number} - {dorder.customer_name} - {formatCurrency(dorder.total_amount)}
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Only showing delivered orders without invoices
            </p>
          </div>

          {/* DO Details */}
          {selectedDO && (
            <>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Delivery Order Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">DO Number:</span>
                    <span className="ml-2 font-medium">{selectedDO.do_number}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <span className="ml-2 font-medium">
                      {new Date(selectedDO.do_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Customer:</span>
                    <span className="ml-2 font-medium">{selectedDO.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <span className="ml-2 font-medium">{selectedDO.phone}</span>
                  </div>
                  {selectedDO.address && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Address:</span>
                      <span className="ml-2 font-medium">{selectedDO.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Items</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Item
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Qty
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Rate
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          GST %
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedDO.items?.map((item, index) => {
                        const lineTotal = parseFloat(item.quantity) * parseFloat(item.unit_price);
                        const gstAmount = lineTotal * (parseFloat(item.gst_percentage) / 100);
                        const itemTotal = lineTotal + gstAmount;
                        
                        return (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {item.description || `Item ${item.item_id}`}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                              {formatCurrency(item.unit_price)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                              {item.gst_percentage}%
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                              {formatCurrency(itemTotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Discount & Waive-off */}
          {selectedDO && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Discount</label>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => handleInputChange('discount', e.target.value)}
                    className="form-input"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="form-label">Waive-off</label>
                  <input
                    type="number"
                    value={formData.waive_off}
                    onChange={(e) => handleInputChange('waive_off', e.target.value)}
                    className="form-input"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Payment Terms */}
              <div>
                <label className="form-label">Payment Terms</label>
                <input
                  type="text"
                  value={formData.payment_terms}
                  onChange={(e) => handleInputChange('payment_terms', e.target.value)}
                  className="form-input"
                  placeholder="e.g., Cash on delivery, 30 days credit"
                />
              </div>

              {/* CO Checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_co_counter"
                  checked={formData.is_co}
                  onChange={(e) => handleInputChange('is_co', e.target.checked)}
                  className="form-checkbox"
                />
                <label htmlFor="is_co_counter" className="ml-2 text-sm text-gray-700">
                  Mark as CO (Cash Order)
                </label>
              </div>

              {/* Totals Summary */}
              <div className="bg-primary-50 p-4 rounded-lg border border-primary-200">
                <h4 className="font-semibold text-gray-900 mb-3">Invoice Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">GST:</span>
                    <span className="font-medium">{formatCurrency(totals.gst)}</span>
                  </div>
                  {totals.discount > 0 && (
                    <div className="flex justify-between text-danger-600">
                      <span>Discount:</span>
                      <span>-{formatCurrency(totals.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-primary-300">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium">{formatCurrency(totals.total)}</span>
                  </div>
                  {totals.waiveOff > 0 && (
                    <div className="flex justify-between text-danger-600">
                      <span>Waive-off:</span>
                      <span>-{formatCurrency(totals.waiveOff)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t-2 border-primary-400 text-lg font-bold">
                    <span>Net Amount:</span>
                    <span className="text-primary-600">{formatCurrency(totals.netAmount)}</span>
                  </div>
                  <div className="mt-3 p-2 bg-white rounded text-xs italic text-gray-700">
                    <strong>In Words:</strong> {numberToWords(totals.netAmount)}
                  </div>
                </div>
              </div>
            </>
          )}
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
            disabled={createMutation.isPending || !formData.do_id}
          >
            {createMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating...
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Create Invoice
              </>
            )}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default CreateCounterSaleInvoiceModal;