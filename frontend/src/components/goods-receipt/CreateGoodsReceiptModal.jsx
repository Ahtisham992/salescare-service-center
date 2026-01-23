// frontend/src/components/goods-receipt/CreateGoodsReceiptModal.jsx
import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Modal, { ModalFooter } from '../common/Modal';
import goodsReceiptService from '../../services/goodsReceiptService';
import purchaseService from '../../services/purchaseService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Package, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

const CreateGoodsReceiptModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    po_id: '',
    gr_date: new Date().toISOString().split('T')[0],
    area_id: '',
    notes: '',
    items: []
  });

  const [selectedPO, setSelectedPO] = useState(null);
  const [loadingPODetails, setLoadingPODetails] = useState(false);

  // 1. Fetch approved purchase orders for the dropdown
  const { data: poData } = useQuery({
    queryKey: ['approved-pos'],
    queryFn: goodsReceiptService.getApprovedPOs,
    enabled: isOpen
  });

  // 2. Create GR Mutation
  const createMutation = useMutation({
    mutationFn: (data) => goodsReceiptService.create(data),
    onSuccess: (data) => {
      // Show success message with specific details
      toast.success(data.message || 'Goods receipt created successfully!');
      onClose();
      resetForm();
    },
    onError: (error) => {
      console.error('Create GR Error:', error);
      const msg = error.response?.data?.message || 'Failed to create goods receipt';
      toast.error(msg);
    }
  });

  const resetForm = () => {
    setFormData({
      po_id: '',
      gr_date: new Date().toISOString().split('T')[0],
      area_id: '',
      notes: '',
      items: []
    });
    setSelectedPO(null);
  };

  // 3. Handle PO Selection & Calculate Remaining Quantities
  const handlePOSelection = async (e) => {
    const poId = e.target.value;
    
    setFormData(prev => ({ ...prev, po_id: poId }));

    if (!poId) {
      setSelectedPO(null);
      setFormData(prev => ({ ...prev, items: [] }));
      return;
    }

    try {
      setLoadingPODetails(true);
      
      // Fetch full PO details (Now includes 'received_so_far' from backend)
      const response = await purchaseService.getById(parseInt(poId));
      const poDetails = response.data;
      
      if (!poDetails) {
        toast.error('Failed to load PO details');
        return;
      }

      setSelectedPO(poDetails);
      
      // SMART LOGIC: Calculate defaults based on history
      const items = (poDetails.items || []).map(item => {
        const ordered = parseInt(item.quantity);
        const receivedBefore = parseInt(item.received_so_far || 0);
        // Default to remaining balance (Ordered - Received Before)
        const remaining = Math.max(0, ordered - receivedBefore);

        return {
          item_id: item.item_id,
          item_code: item.item_code,
          description: item.description,
          po_quantity: ordered,
          received_before: receivedBefore,
          quantity_received: remaining, // <--- This sets the default to 20 (not 100)
          unit_price: parseFloat(item.unit_price),
          status: item.status || 'Normal'
        };
      });

      setFormData(prev => ({ ...prev, items }));

      // Alert if everything is already received
      const allReceived = items.every(i => i.quantity_received === 0);
      if (allReceived && items.length > 0) {
        toast('This PO is already fully received!', { icon: 'ℹ️' });
      }

    } catch (error) {
      console.error('Error fetching PO details:', error);
      toast.error('Failed to load PO details');
    } finally {
      setLoadingPODetails(false);
    }
  };

  const handleQuantityChange = (index, value) => {
    const newItems = [...formData.items];
    const val = parseInt(value);
    newItems[index].quantity_received = isNaN(val) ? 0 : val;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.po_id) { toast.error('Please select a purchase order'); return; }
    if (!formData.gr_date) { toast.error('Please select GR date'); return; }
    if (!formData.area_id) { toast.error('Please select an area'); return; }
    if (formData.items.length === 0) { toast.error('No items to receive.'); return; }

    // Check for negative values
    const invalidItems = formData.items.filter(item => 
      !item.quantity_received || item.quantity_received < 0
    );

    if (invalidItems.length > 0) {
      toast.error('Quantity cannot be negative');
      return;
    }

    // Filter out items with 0 quantity (we don't create GR lines for 0)
    const itemsToReceive = formData.items.filter(item => item.quantity_received > 0);

    if (itemsToReceive.length === 0) {
      toast.error('Please enter a quantity greater than 0 for at least one item');
      return;
    }

    // Strict Check: Prevent over-receiving (matches backend validation)
    const overReceived = itemsToReceive.find(item => {
        const remaining = item.po_quantity - item.received_before;
        return item.quantity_received > remaining;
    });

    if (overReceived) {
        toast.error(`Cannot receive ${overReceived.quantity_received} for ${overReceived.item_code}. Only ${overReceived.po_quantity - overReceived.received_before} remaining.`);
        return;
    }

    // Prepare payload
    const payload = {
      po_id: parseInt(formData.po_id),
      gr_date: formData.gr_date,
      area_id: parseInt(formData.area_id),
      notes: formData.notes,
      items: itemsToReceive.map(item => ({
        item_id: item.item_id,
        quantity_received: item.quantity_received
      }))
    };

    createMutation.mutate(payload);
  };

  const pos = poData?.data?.purchase_orders || [];
  
  // Calculate total for display
  const totalAmount = formData.items.reduce((sum, item) => 
    sum + (item.quantity_received * item.unit_price), 0
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Goods Receipt" size="xl">
      <div className="space-y-6">
        
        {/* Top Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
          <div>
            <label className="form-label">Purchase Order *</label>
            <select
              value={formData.po_id}
              onChange={handlePOSelection}
              className="form-input"
              disabled={createMutation.isPending || loadingPODetails}
            >
              <option value="">Select Purchase Order</option>
              {pos.map(po => (
                <option key={po.po_id} value={po.po_id}>
                  {po.po_number} - {po.vendor_name} ({formatDate(po.po_date)})
                </option>
              ))}
            </select>
            {loadingPODetails && <p className="text-xs text-blue-600 mt-1">Loading items...</p>}
          </div>

          <div>
            <label className="form-label">GR Date *</label>
            <input
              type="date"
              value={formData.gr_date}
              onChange={(e) => setFormData(prev => ({ ...prev, gr_date: e.target.value }))}
              className="form-input"
              disabled={createMutation.isPending}
            />
          </div>

          <div>
            <label className="form-label">Area / Location *</label>
            <select
              value={formData.area_id}
              onChange={(e) => setFormData(prev => ({ ...prev, area_id: e.target.value }))}
              className="form-input"
              disabled={createMutation.isPending}
            >
              <option value="">Select Area</option>
              <option value="1">Rawalpindi, PEL Service Center</option>
              <option value="2">Islamabad Service Center</option>
              <option value="3">Lahore Service Center</option>
            </select>
          </div>

          <div>
            <label className="form-label">Received By</label>
            <input
              type="text"
              value={user?.full_name || ''}
              className="form-input bg-gray-100"
              disabled
            />
          </div>
        </div>

        {/* PO Summary Card */}
        {selectedPO && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start text-sm">
            <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-1 w-full">
                <div><span className="text-gray-500">Vendor:</span> <span className="font-medium">{selectedPO.vendor_name}</span></div>
                <div><span className="text-gray-500">Contact:</span> <span className="font-medium">{selectedPO.contact_person || 'N/A'}</span></div>
                <div><span className="text-gray-500">Type:</span> <span className="badge badge-sm badge-info">{selectedPO.vendor_type}</span></div>
            </div>
          </div>
        )}

        {/* Items Table */}
        {formData.items.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">Ordered</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">Prev. Recv</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-blue-700 uppercase w-32 border-b-2 border-blue-300 bg-blue-50">Receive Now *</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-28">Unit Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formData.items.map((item, index) => {
                  const amount = item.quantity_received * item.unit_price;
                  const remaining = Math.max(0, item.po_quantity - item.received_before);
                  const isOverLimit = item.quantity_received > remaining;
                  const isZero = item.quantity_received === 0;

                  return (
                    <tr key={index} className={isOverLimit ? 'bg-red-50' : isZero ? 'bg-gray-50' : ''}>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{item.description}</div>
                        <div className="text-xs text-gray-500">{item.item_code}</div>
                        <div className="mt-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                item.status === 'FOC' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                            }`}>
                                {item.status}
                            </span>
                        </div>
                      </td>
                      
                      {/* Ordered Column */}
                      <td className="px-4 py-3 text-center text-sm text-gray-600">
                        {item.po_quantity}
                      </td>

                      {/* Previously Received Column (New!) */}
                      <td className="px-4 py-3 text-center text-sm text-gray-600 font-medium">
                        {item.received_before > 0 ? (
                            <span className="text-green-600">{item.received_before}</span>
                        ) : '-'}
                      </td>

                      {/* Input Column */}
                      <td className="px-4 py-3 bg-blue-50/30">
                        <input
                          type="number"
                          min="0"
                          max={remaining}
                          value={item.quantity_received}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          className={`form-input text-center h-9 font-bold ${
                            isOverLimit ? 'border-red-500 text-red-600 focus:ring-red-500' : 
                            isZero ? 'text-gray-400' : 'text-blue-700 border-blue-300'
                          }`}
                          disabled={createMutation.isPending}
                        />
                        {isOverLimit && (
                            <div className="text-[10px] text-red-600 text-center mt-1">
                                Max: {remaining}
                            </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right text-sm text-gray-600">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatCurrency(amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="5" className="px-4 py-3 text-right font-semibold text-gray-700">Total Value:</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Empty State / Warning */}
        {formData.po_id && formData.items.length === 0 && !loadingPODetails && (
          <div className="bg-yellow-50 p-4 rounded-lg flex items-center text-yellow-800">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>No items found in this Purchase Order.</span>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="form-label">Notes / Remarks</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="form-input"
            rows="2"
            placeholder="Optional notes..."
            disabled={createMutation.isPending}
          />
        </div>

        {/* Final Inventory Confirmation */}
        {totalAmount > 0 && formData.area_id && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start text-sm text-green-800">
            <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-green-600" />
            <div>
                Confirming this will add <strong>{formData.items.reduce((acc, i) => acc + (parseInt(i.quantity_received)||0), 0)} items</strong> to inventory.
                <br/>
                <span className="text-xs text-green-600">Transactions will be logged automatically.</span>
            </div>
          </div>
        )}

      </div>

      <ModalFooter>
        <button onClick={onClose} className="btn btn-outline" disabled={createMutation.isPending}>
          Cancel
        </button>
        <button 
          onClick={handleSubmit} 
          className="btn btn-primary"
          disabled={createMutation.isPending || formData.items.length === 0 || loadingPODetails || totalAmount === 0}
        >
          {createMutation.isPending ? 'Processing...' : 'Create Goods Receipt'}
        </button>
      </ModalFooter>
    </Modal>
  );
};

export default CreateGoodsReceiptModal;