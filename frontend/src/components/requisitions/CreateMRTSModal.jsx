// frontend/src/components/requisitions/CreateMRTSModal.jsx
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal, { ModalFooter } from '../common/Modal';
import requisitionService from '../../services/requisitionService';
import complaintService from '../../services/complaintService';
import { toast } from 'react-hot-toast';
import { Trash2, Search, AlertCircle, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { apiHelper } from '../../services/api'; // ✅ Import apiHelper directly for new route

const CreateMRTSModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();

  // --- States ---
  const [complaintSearch, setComplaintSearch] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [returnableItems, setReturnableItems] = useState([]); // ✅ List of items eligible for return
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  const [formData, setFormData] = useState({
    complaint_id: '',
    area_id: '',
    items: []
  });

  // --- 1. Complaint Search ---
  const handleComplaintSearch = async () => {
    if(!complaintSearch) return;
    try {
      const res = await complaintService.getAll({ search: complaintSearch, limit: 1 });
      const found = res.data.complaints[0];
      
      if (found) {
        const fullDetail = await complaintService.getById(found.complaint_id);
        const data = fullDetail.data;
        
        setSelectedComplaint(data);
        setFormData(prev => ({
          ...prev,
          complaint_id: data.complaint_id,
          area_id: data.area_id, 
          items: [] 
        }));
        
        // ✅ FETCH RETURNABLE ITEMS NOW
        fetchReturnableItems(data.complaint_id);
        toast.success('Complaint found');
      } else {
        toast.error('Complaint not found');
        setSelectedComplaint(null);
        setReturnableItems([]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching complaint');
    }
  };

  // ✅ New Function to Fetch Net Returnable Items
  const fetchReturnableItems = async (complaintId) => {
    setIsLoadingItems(true);
    try {
      // Call the new API route we just created
      const res = await apiHelper.get(`/requisitions/mrts/returnable/${complaintId}`);
      setReturnableItems(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch returnable items');
    } finally {
      setIsLoadingItems(false);
    }
  };

  // --- 2. Add Item to Return List ---
  const handleAddItem = (item) => {
    if (formData.items.find(i => i.item_id === item.item_id)) {
      toast.error('Item already added to return list');
      return;
    }
    
    // Default to "Paid" (Selling Price) return.
    const sellingPrice = parseFloat(item.selling_price || item.unit_price || 0);

    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          item_id: item.item_id,
          item_code: item.item_code,
          description: item.description,
          quantity: 1, // Default 1
          max_quantity: item.remaining_qty, // ✅ Restrict max return
          unit_price: sellingPrice,
          item_status: 'OPB', 
        }
      ]
    }));
    toast.success(`Added: ${item.description}`);
  };

  const createMutation = useMutation({
    mutationFn: (data) => requisitionService.createMRTS(data), 
    onSuccess: () => {
      toast.success('Return Created Successfully');
      queryClient.invalidateQueries(['mrqs-list']); 
      onClose();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to create return';
      toast.error(msg);
    }
  });

  const handleSubmit = () => {
    if (!formData.complaint_id) return toast.error('Please select a valid Complaint');
    if (formData.items.length === 0) return toast.error('Please add items to return');
    createMutation.mutate(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Material Return (MRTS)" size="xl">
      <div className="space-y-6">
        
        {/* Header */}
        <div className="grid grid-cols-2 gap-4 bg-orange-50 p-4 rounded border border-orange-100">
          <div className="col-span-2 md:col-span-1">
            <label className="form-label">Complaint #</label>
            <div className="flex gap-2">
              <input 
                className="form-input" 
                placeholder="RWP-2026-..."
                value={complaintSearch}
                onChange={e => setComplaintSearch(e.target.value)}
                onBlur={handleComplaintSearch}
              />
              <button onClick={handleComplaintSearch} className="btn btn-sm btn-outline">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="form-label">Customer / Product</label>
            <input 
              className="form-input bg-white" 
              readOnly 
              value={selectedComplaint ? `${selectedComplaint.customer_name} - ${selectedComplaint.product_name}` : ''} 
              placeholder="Auto-filled"
            />
          </div>
        </div>

        {/* ✅ Available Items Section (Replaces Global Search) */}
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase">Items Available for Return</h3>
          
          {isLoadingItems ? (
            <div className="text-sm text-gray-500 italic">Loading issued items...</div>
          ) : !selectedComplaint ? (
            <div className="text-sm text-gray-400 italic">Search for a complaint to see issued items.</div>
          ) : returnableItems.length === 0 ? (
            <div className="p-4 bg-gray-50 border rounded text-center text-gray-500">
              No returnable items found (All issued items have been returned or none issued).
            </div>
          ) : (
            <div className="border rounded overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Issued</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Returned</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-green-700 uppercase">Remaining</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {returnableItems.map(item => (
                    <tr key={item.item_id}>
                      <td className="px-3 py-2 text-sm">{item.description}</td>
                      <td className="px-3 py-2 text-center text-sm">{item.issued_qty}</td>
                      <td className="px-3 py-2 text-center text-sm text-gray-400">{item.returned_qty}</td>
                      <td className="px-3 py-2 text-center text-sm font-bold text-green-700">{item.remaining_qty}</td>
                      <td className="px-3 py-2 text-right">
                        <button 
                          onClick={() => handleAddItem(item)}
                          disabled={formData.items.some(i => i.item_id === item.item_id)}
                          className="btn btn-xs btn-outline"
                        >
                          {formData.items.some(i => i.item_id === item.item_id) ? 'Added' : 'Select'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Items Table */}
        {formData.items.length > 0 && (
          <div className="border rounded-lg overflow-hidden mt-4">
            <div className="bg-orange-100 px-3 py-2 text-xs font-bold text-orange-800 uppercase">Items to be Returned</div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Return Qty</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Return Status</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formData.items.map((item, index) => (
                    <tr key={index}>
                    <td className="px-3 py-2">
                        <div className="text-sm font-medium">{item.description}</div>
                        <div className="text-xs text-gray-500">Max: {item.max_quantity}</div>
                    </td>
                    <td className="px-3 py-2">
                        <input 
                          type="number" min="1" max={item.max_quantity}
                          className="form-input h-8 text-center"
                          value={item.quantity}
                          onChange={e => {
                              const val = parseInt(e.target.value) || 0;
                              if (val > item.max_quantity) return; // Prevent over-return
                              const newItems = [...formData.items];
                              newItems[index].quantity = val;
                              setFormData({...formData, items: newItems});
                          }}
                        />
                    </td>
                    <td className="px-3 py-2">
                        <select 
                          className="form-input h-8 text-xs p-1"
                          value={item.item_status}
                          onChange={e => {
                              const newItems = [...formData.items];
                              newItems[index].item_status = e.target.value;
                              setFormData({...formData, items: newItems});
                          }}
                        >
                          <option value="OPB">Paid (Refund)</option>
                          <option value="UW">Warranty (No Refund)</option>
                        </select>
                    </td>
                    <td className="px-3 py-2">
                        <button 
                          onClick={() => {
                              const newItems = formData.items.filter((_, i) => i !== index);
                              setFormData({...formData, items: newItems});
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                    </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
      
      <ModalFooter>
        <button onClick={onClose} className="btn btn-outline" disabled={createMutation.isPending}>
          Cancel
        </button>
        <button 
          onClick={handleSubmit} 
          className="btn btn-primary bg-orange-600 hover:bg-orange-700 border-orange-600"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Processing...' : 'Create Return'}
        </button>
      </ModalFooter>
    </Modal>
  );
};

export default CreateMRTSModal;