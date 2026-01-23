// frontend/src/components/goods-receipt/CreateGoodsReceiptModal.jsx
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Modal, { ModalFooter } from '../common/Modal';
import goodsReceiptService from '../../services/goodsReceiptService';
import purchaseService from '../../services/purchaseService'; // Import this
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Package, AlertCircle, CheckCircle } from 'lucide-react';
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

  // Fetch approved purchase orders
  const { data: poData } = useQuery({
    queryKey: ['approved-pos'],
    queryFn: goodsReceiptService.getApprovedPOs,
    enabled: isOpen
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => goodsReceiptService.create(data),
    onSuccess: () => {
      toast.success('Goods receipt created successfully! Inventory updated.');
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

  // FIXED: Fetch full PO details when selected
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
      
      // Fetch full PO details with items
      const response = await purchaseService.getById(parseInt(poId));
      
      const poDetails = response.data;
      
      if (!poDetails) {
        toast.error('Failed to load PO details');
        return;
      }

      setSelectedPO(poDetails);
      
      // Auto-populate items with PO quantities
      const items = (poDetails.items || []).map(item => ({
        item_id: item.item_id,
        item_code: item.item_code,
        description: item.description,
        po_quantity: item.quantity,
        quantity_received: item.quantity, // Default to PO quantity
        unit_price: parseFloat(item.unit_price),
        status: item.status || 'Normal'
      }));


      setFormData(prev => ({
        ...prev,
        items
      }));

      if (items.length === 0) {
        toast.warning('This PO has no items');
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
    newItems[index].quantity_received = parseInt(value) || 0;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleSubmit = () => {

    // Validation
    if (!formData.po_id) {
      toast.error('Please select a purchase order');
      return;
    }

    if (!formData.gr_date) {
      toast.error('Please select GR date');
      return;
    }

    if (!formData.area_id) {
      toast.error('Please select an area');
      return;
    }

    if (formData.items.length === 0) {
      toast.error('No items to receive. Please select a PO with items.');
      return;
    }

    // Check if all quantities are valid
    const invalidItems = formData.items.filter(item => 
      !item.quantity_received || item.quantity_received <= 0
    );

    if (invalidItems.length > 0) {
      toast.error('All items must have a valid quantity received');
      return;
    }

    // Prepare payload
    const payload = {
      po_id: parseInt(formData.po_id),
      gr_date: formData.gr_date,
      area_id: parseInt(formData.area_id),
      notes: formData.notes,
      items: formData.items.map(item => ({
        item_id: item.item_id,
        quantity_received: item.quantity_received
      }))
    };


    // Submit
    createMutation.mutate(payload);
  };

  const pos = poData?.data?.purchase_orders || [];
  const totalAmount = formData.items.reduce((sum, item) => 
    sum + (item.quantity_received * item.unit_price), 0
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Create Goods Receipt" 
      size="xl"
    >
      <div className="space-y-6">
        {/* Header Info */}
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
            {loadingPODetails && (
              <p className="text-sm text-blue-600 mt-1">Loading PO details...</p>
            )}
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

        {/* PO Info Display */}
        {selectedPO && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Package className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Vendor:</span>
                  <span className="font-medium ml-2">{selectedPO.vendor_name}</span>
                </div>
                <div>
                  <span className="text-gray-600">PO Total:</span>
                  <span className="font-medium ml-2">{formatCurrency(selectedPO.total_amount)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Items:</span>
                  <span className="font-medium ml-2">{formData.items.length} items</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Items Table */}
        {formData.items.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase">
              Items to Receive ({formData.items.length} items)
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Item
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">
                      PO Qty
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-32">
                      Received Qty *
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.items.map((item, index) => {
                    const amount = item.quantity_received * item.unit_price;
                    const isPartial = item.quantity_received < item.po_quantity;
                    const isOver = item.quantity_received > item.po_quantity;

                    return (
                      <tr key={index} className={isOver ? 'bg-red-50' : ''}>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {item.description}
                          </div>
                          <div className="text-xs text-gray-500">{item.item_code}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm text-gray-600">{item.po_quantity}</span>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            value={item.quantity_received}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                            className={`form-input text-center h-9 ${
                              isOver ? 'border-red-500 bg-red-50' : 
                              isPartial ? 'border-yellow-500' : ''
                            }`}
                            disabled={createMutation.isPending}
                          />
                        </td>
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
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatCurrency(amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="5" className="px-4 py-3 text-right font-semibold text-gray-700">
                      Total Amount:
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {formatCurrency(totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Warning for partial/over receipt */}
            {formData.items.some(i => i.quantity_received !== i.po_quantity) && (
              <div className="mt-3 flex items-start space-x-2 text-sm">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-700">
                  <strong>Note:</strong> Some items have different received quantities than ordered.
                  {formData.items.some(i => i.quantity_received > i.po_quantity) && (
                    <span className="text-red-700 block mt-1">
                      ⚠️ Warning: Some items exceed PO quantity!
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* No items warning */}
        {formData.po_id && formData.items.length === 0 && !loadingPODetails && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <strong>No items found</strong> in the selected purchase order. 
                Please select a different PO.
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="form-label">Notes / Remarks</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="form-input"
            rows="3"
            placeholder="Any additional notes about this goods receipt..."
            disabled={createMutation.isPending}
          />
        </div>

        {/* Success Info */}
        {formData.items.length > 0 && formData.area_id && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
              <div className="text-sm text-green-800">
                <strong>Inventory Update:</strong> Creating this GR will automatically add{' '}
                <strong>{formData.items.reduce((sum, i) => sum + i.quantity_received, 0)} items</strong>{' '}
                to the <strong>{formData.area_id === '1' ? 'Rawalpindi' : formData.area_id === '2' ? 'Islamabad' : 'Lahore'}</strong> inventory.
              </div>
            </div>
          </div>
        )}
      </div>

      <ModalFooter>
        <button
          onClick={onClose}
          className="btn btn-outline"
          disabled={createMutation.isPending}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="btn btn-primary"
          disabled={createMutation.isPending || formData.items.length === 0 || loadingPODetails}
        >
          {createMutation.isPending ? 'Creating...' : 'Create Goods Receipt'}
        </button>
      </ModalFooter>
    </Modal>
  );
};

export default CreateGoodsReceiptModal;