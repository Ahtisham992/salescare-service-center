// frontend/src/components/delivery/CreateDeliveryOrderModal.jsx
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal, { ModalFooter } from '../common/Modal';
import deliveryService from '../../services/deliveryService';
import { toast } from 'react-hot-toast';
import { Trash2, Search, Package, Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const CreateDeliveryOrderModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  
  // Form State
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    address: '',
    cnic: '',
    area_id: 1, // Default area ID
    items: []
  });

  // Item Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search for items
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 1) {
        setIsSearching(true);
        try {
          const response = await deliveryService.searchItems(searchQuery, formData.area_id);
          
          const items = response.data || [];
          
          setSearchResults(items);
          
          if (items.length === 0) {
          }
        } catch (error) {
          console.error("Search failed", error);
          toast.error('Failed to search items');
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, formData.area_id]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => deliveryService.create(data),
    onSuccess: () => {
      toast.success('Delivery Order Created Successfully');
      queryClient.invalidateQueries(['delivery-orders']);
      onClose();
      resetForm();
    },
    onError: (err) => {
      console.error('Create DO error:', err);
      toast.error(err.response?.data?.message || 'Failed to create DO');
    }
  });

  const resetForm = () => {
    setFormData({
      customer_name: '',
      phone: '',
      address: '',
      cnic: '',
      area_id: 1,
      items: []
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  // Handlers
  const handleAddItem = (item) => {
    
    // Prevent adding duplicates
    if (formData.items.find(i => i.item_id === item.item_id)) {
      toast.error('Item already added');
      return;
    }

    const newItem = {
      item_id: item.item_id,
      item_code: item.item_code,
      description: item.description,
      quantity: 1,
      unit_price: parseFloat(item.unit_price || 0),
      gst_percentage: 18, // Default 18% GST
      stock: item.quantity_in_hand || 0 // Used for validation
    };


    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    
    setSearchQuery(''); 
    setSearchResults([]);
    toast.success(`Added: ${item.description}`);
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
    
    if (!formData.customer_name || !formData.phone) {
      toast.error('Customer Name and Phone are required');
      return;
    }
    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    // Check stock availability
    const insufficientStock = formData.items.find(item => item.quantity > item.stock);
    if (insufficientStock) {
      toast.error(`Insufficient stock for ${insufficientStock.description}. Available: ${insufficientStock.stock}`);
      return;
    }

    createMutation.mutate(formData);
  };

  // Calculations
  const calculateTotals = () => {
    let subtotal = 0;
    let gstTotal = 0;

    formData.items.forEach(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      const gst = parseFloat(item.gst_percentage) || 0;

      const lineAmount = qty * price;
      const lineGst = (lineAmount * gst) / 100;

      subtotal += lineAmount;
      gstTotal += lineGst;
    });

    return { subtotal, gstTotal, total: subtotal + gstTotal };
  };

  const totals = calculateTotals();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Counter Sale Delivery Order" size="xl">
      <div className="space-y-6">
        
        {/* 1. Customer Details */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Customer Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Customer Name *</label>
              <input 
                className="form-input" 
                value={formData.customer_name}
                onChange={e => setFormData({...formData, customer_name: e.target.value})}
                placeholder="Enter Name"
              />
            </div>
            <div>
              <label className="form-label">Phone # *</label>
              <input 
                className="form-input" 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                placeholder="0300-XXXXXXX"
              />
            </div>
            <div className="col-span-2">
              <label className="form-label">Address</label>
              <input 
                className="form-input" 
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                placeholder="Full Address"
              />
            </div>
            <div>
              <label className="form-label">CNIC (Optional)</label>
              <input 
                className="form-input" 
                value={formData.cnic}
                onChange={e => setFormData({...formData, cnic: e.target.value})}
                placeholder="XXXXX-XXXXXXX-X"
              />
            </div>
            <div>
              <label className="form-label">Area *</label>
              <select
                className="form-input"
                value={formData.area_id}
                onChange={e => setFormData({...formData, area_id: parseInt(e.target.value)})}
              >
                <option value="1">Rawalpindi, PEL Service Center</option>
                <option value="2">Islamabad Service Center</option>
                <option value="3">Lahore Service Center</option>
              </select>
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
                  placeholder="Search item code or description... (min 2 characters)"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {isSearching && (
                  <div className="absolute right-3 top-2.5">
                    <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Search Results Dropdown */}
            {searchQuery.length > 1 && searchResults.length > 0 && (
              <div className="absolute z-10 w-full bg-white mt-1 border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map(item => (
                  <button
                    key={item.item_id}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex justify-between items-center border-b border-gray-100"
                    onClick={() => handleAddItem(item)}
                    type="button"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.description}</p>
                      <p className="text-xs text-gray-500">{item.item_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary-600">{formatCurrency(item.unit_price)}</p>
                      <p className="text-xs text-gray-500">Stock: {item.quantity_in_hand}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No results message */}
            {searchQuery.length > 1 && !isSearching && searchResults.length === 0 && (
              <div className="absolute z-10 w-full bg-white mt-1 border border-gray-200 rounded-md shadow-lg p-4 text-center text-gray-500">
                No items found for "{searchQuery}"
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
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-20">Stock</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-20">Qty</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-24">Price</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-20">GST %</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-28">Total</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {formData.items.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-3 py-8 text-center text-gray-500 text-sm">
                    No items added yet. Search above to add.
                  </td>
                </tr>
              ) : (
                formData.items.map((item, index) => {
                  const lineTotal = item.quantity * item.unit_price * (1 + item.gst_percentage/100);
                  const isOverStock = item.quantity > item.stock;
                  
                  return (
                    <tr key={index} className={isOverStock ? 'bg-red-50' : ''}>
                      <td className="px-3 py-2">
                        <div className="text-sm font-medium text-gray-900">{item.description}</div>
                        <div className="text-xs text-gray-500">{item.item_code}</div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-sm font-medium ${isOverStock ? 'text-red-600' : 'text-gray-600'}`}>
                          {item.stock}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="1"
                          max={item.stock}
                          className={`form-input text-right p-1 h-8 ${isOverStock ? 'border-red-500' : ''}`}
                          value={item.quantity}
                          onChange={e => handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-gray-500">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          className="form-input text-right p-1 h-8"
                          value={item.gst_percentage}
                          onChange={e => handleUpdateItem(index, 'gst_percentage', parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-3 py-2 text-right text-sm font-bold text-gray-900">
                        {formatCurrency(lineTotal)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button 
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-500 hover:text-red-700"
                          type="button"
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

        {/* 4. Footer Totals */}
        {formData.items.length > 0 && (
          <div className="flex justify-end border-t pt-4">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Total GST:</span>
                <span>{formatCurrency(totals.gstTotal)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2 mt-2">
                <span>Grand Total:</span>
                <span className="text-primary-600">{formatCurrency(totals.total)}</span>
              </div>
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
          disabled={createMutation.isPending || formData.items.length === 0}
        >
          {createMutation.isPending ? 'Creating...' : 'Create Delivery Order'}
        </button>
      </ModalFooter>
    </Modal>
  );
};

export default CreateDeliveryOrderModal;