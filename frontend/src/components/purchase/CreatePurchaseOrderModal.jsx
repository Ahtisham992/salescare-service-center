// frontend/src/components/purchase/CreatePurchaseOrderModal.jsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Modal, { ModalFooter } from '../common/Modal';
import purchaseService from '../../services/purchaseService';
import vendorService from '../../services/vendorService';
import { toast } from 'react-hot-toast';
import { Trash2, Search, Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const CreatePurchaseOrderModal = ({ isOpen, onClose, onSuccess }) => {
  // Form State
  const [formData, setFormData] = useState({
    vendor_id: '',
    po_date: new Date().toISOString().split('T')[0],
    items: []
  });

  // Item Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch vendors
  const { data: vendorsData, isLoading: vendorsLoading } = useQuery({
    queryKey: ['vendors', { is_active: 'true' }],
    queryFn: () => vendorService.getAll({ is_active: 'true' })
  });

  // Debounce search for items
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 1) {
        setIsSearching(true);
        try {
          const response = await purchaseService.searchItems(searchQuery);
          setSearchResults(response.data?.items || []);
        } catch (error) {
          console.error("Search failed", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data) => purchaseService.create(data),
    onSuccess: () => {
      toast.success('Purchase Order Created Successfully');
      onSuccess();
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create PO')
  });

  // Handlers
  const handleAddItem = (item) => {
    // Prevent adding duplicates
    if (formData.items.find(i => i.item_id === item.item_id)) {
      toast.error('Item already added');
      return;
    }

    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          item_id: item.item_id,
          item_code: item.item_code,
          description: item.description,
          quantity: 1,
          unit_price: parseFloat(item.unit_price || 0),
          status: 'Normal' // Normal, FOC, OPB
        }
      ]
    }));
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleUpdateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = () => {
    if (!formData.vendor_id) {
      toast.error('Please select a vendor');
      return;
    }
    if (!formData.po_date) {
      toast.error('PO date is required');
      return;
    }
    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    // Validate all items have quantity and price
    const invalidItem = formData.items.find(
      item => !item.quantity || item.quantity <= 0 || !item.unit_price || item.unit_price < 0
    );
    if (invalidItem) {
      toast.error('All items must have valid quantity and unit price');
      return;
    }

    createMutation.mutate(formData);
  };

  // Calculations
  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0));
    }, 0);
  };

  const vendors = vendorsData?.data?.vendors || [];
  const totalAmount = calculateTotal();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Purchase Order" size="xl">
      <div className="space-y-6">
        {/* 1. PO Header */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Purchase Order Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Vendor *</label>
              <select
                className="form-input"
                value={formData.vendor_id}
                onChange={e => setFormData({ ...formData, vendor_id: e.target.value })}
                disabled={vendorsLoading}
              >
                <option value="">Select Vendor</option>
                {vendors.map(vendor => (
                  <option key={vendor.vendor_id} value={vendor.vendor_id}>
                    {vendor.vendor_name} ({vendor.vendor_type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">PO Date *</label>
              <input
                type="date"
                className="form-input"
                value={formData.po_date}
                onChange={e => setFormData({ ...formData, po_date: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* 2. Item Selection */}
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase">Add Items</h3>
          <div className="relative">
            <div className="flex">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  className="form-input pl-10"
                  placeholder="Search item code or description..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full bg-white mt-1 border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map(item => (
                  <button
                    key={item.item_id}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex justify-between items-center border-b border-gray-100"
                    onClick={() => handleAddItem(item)}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.description}</p>
                      <p className="text-xs text-gray-500">{item.item_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary-600">{formatCurrency(item.unit_price)}</p>
                      <p className="text-xs text-gray-500">{item.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. Items Table */}
        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-24">Qty</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-28">Unit Price</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-28">Status</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-28">Amount</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {formData.items.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-3 py-8 text-center text-gray-500 text-sm">
                    No items added yet. Search above to add items.
                  </td>
                </tr>
              ) : (
                formData.items.map((item, index) => {
                  const lineTotal = item.quantity * item.unit_price;
                  return (
                    <tr key={index}>
                      <td className="px-3 py-2">
                        <div className="text-sm font-medium text-gray-900">{item.description}</div>
                        <div className="text-xs text-gray-500">{item.item_code}</div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="1"
                          className="form-input text-right p-1 h-8"
                          value={item.quantity}
                          onChange={e => handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="form-input text-right p-1 h-8"
                          value={item.unit_price}
                          onChange={e => handleUpdateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <select
                          className="form-input p-1 h-8 text-xs"
                          value={item.status}
                          onChange={e => handleUpdateItem(index, 'status', e.target.value)}
                        >
                          <option value="Normal">Normal</option>
                          <option value="FOC">FOC</option>
                          <option value="OPB">OPB</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right text-sm font-bold text-gray-900">
                        {formatCurrency(lineTotal)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Footer Total */}
        <div className="flex justify-end border-t pt-4">
          <div className="w-64">
            <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
              <span>Total Amount:</span>
              <span className="text-primary-600">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      <ModalFooter>
        <button onClick={onClose} className="btn btn-outline" disabled={createMutation.isPending}>
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="btn btn-primary"
          disabled={createMutation.isPending || formData.items.length === 0}
        >
          {createMutation.isPending ? 'Creating...' : 'Create Purchase Order'}
        </button>
      </ModalFooter>
    </Modal>
  );
};

export default CreatePurchaseOrderModal;