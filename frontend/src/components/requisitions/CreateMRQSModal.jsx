import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Modal, { ModalFooter } from '../common/Modal';
import requisitionService from '../../services/requisitionService';
import deliveryService from '../../services/deliveryService'; // Reusing for item search
import complaintService from '../../services/complaintService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Trash2, Search, User, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const CreateMRQSModal = ({ isOpen, onClose }) => {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();

  // --- States ---
  const [complaintSearch, setComplaintSearch] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  
  const [formData, setFormData] = useState({
    complaint_id: '',
    technician_id: user.role === 'technician' ? user.user_id : '',
    area_id: '', // Crucial: This is the "Cost Center"
    items: []
  });

  const [itemSearch, setItemSearch] = useState('');
  const [itemSearchResults, setItemSearchResults] = useState([]);

  // --- Queries ---
  // Fetch Technicians (Only if Admin/Manager)
  const { data: technicians } = useQuery({
    queryKey: ['technicians'],
    queryFn: requisitionService.getTechnicians,
    enabled: hasRole(['admin', 'manager'])
  });

  // --- Handlers ---

  // 1. Complaint Search & Auto-Fill
  const handleComplaintSearch = async () => {
    if(!complaintSearch) return;
    try {
      const res = await complaintService.getAll({ search: complaintSearch, limit: 1 });
      const found = res.data.complaints[0];
      
      if (found) {
        // Fetch full details to get Product & Area
        const fullDetail = await complaintService.getById(found.complaint_id);
        const data = fullDetail.data;
        
        setSelectedComplaint(data);
        setFormData(prev => ({
          ...prev,
          complaint_id: data.complaint_id,
          area_id: data.area_id, // Sets the Cost Center constraint
          technician_id: data.technician_id || prev.technician_id
        }));
        
        // Clear any previous item search since the Area might have changed
        setItemSearch('');
        setItemSearchResults([]);
        
        toast.success('Complaint found & Cost Center locked');
      } else {
        toast.error('Complaint not found');
        setSelectedComplaint(null);
      }
    } catch (err) {
      toast.error('Error fetching complaint');
    }
  };

  // 2. Item Search (Filtered by Cost Center)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (itemSearch.length > 1) {
        try {
          // FIX 1: Pass the area_id to the service so the Backend searches the correct Cost Center
          const res = await deliveryService.searchItems(itemSearch, formData.area_id);
          
          // FIX 2: The service already returns { data: [Array] }
          // We just need res.data. We do NOT need .stock because the service already extracted it.
          const allItems = res.data || []; 
          
          // Optional: The backend already filtered by Area, but we can keep a safety check
          // We use '==' to allow string/number matching (e.g. "1" == 1) just in case
          const filteredItems = formData.area_id 
            ? allItems.filter(item => item.area_id == formData.area_id)
            : []; 

          setItemSearchResults(filteredItems);
        } catch (err) {
          console.error(err);
          setItemSearchResults([]);
        }
      } else {
        setItemSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [itemSearch, formData.area_id]);

  const handleAddItem = (item) => {
    // Check for duplicates
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
          unit_price: item.unit_price,
          item_status: 'UW', // Default to Under Warranty
          stock_max: item.quantity_in_hand // For validation UI
        }
      ]
    }));
    setItemSearch('');
    setItemSearchResults([]);
  };

  const createMutation = useMutation({
    mutationFn: (data) => requisitionService.createMRQS(data),
    onSuccess: () => {
      toast.success('MRQS Created Successfully');
      queryClient.invalidateQueries(['mrqs-list']);
      onClose();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to create';
      toast.error(msg);
    }
  });

  const handleSubmit = () => {
    if (!formData.complaint_id) return toast.error('Please select a valid Complaint');
    if (formData.items.length === 0) return toast.error('Please add at least one item');
    if (hasRole(['admin', 'manager']) && !formData.technician_id) return toast.error('Select a Technician');

    createMutation.mutate(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Material Requisition Slip (MRQS)" size="xl">
      <div className="space-y-6">
        
        {/* --- Header Section --- */}
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded border">
          
          {/* Complaint Search */}
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

          {/* Product (Read-Only) */}
          <div className="col-span-2 md:col-span-1">
            <label className="form-label">Article / Product</label>
            <input 
              className="form-input bg-gray-100" 
              readOnly 
              value={selectedComplaint?.product_name || ''} 
              placeholder="Auto-filled"
            />
          </div>

          {/* Technician Selection */}
          <div className="col-span-2 md:col-span-1">
            <label className="form-label">Technician</label>
            {hasRole(['admin', 'manager']) ? (
              <select 
                className="form-input"
                value={formData.technician_id}
                onChange={e => setFormData({...formData, technician_id: e.target.value})}
              >
                <option value="">Select Technician</option>
                {technicians?.map(t => (
                  <option key={t.user_id} value={t.user_id}>{t.full_name}</option>
                ))}
              </select>
            ) : (
              <div className="form-input bg-gray-100 flex items-center">
                <User className="w-4 h-4 mr-2 text-gray-500"/>
                {user.full_name}
              </div>
            )}
          </div>

          {/* Cost Center / Area (Read-Only) */}
          <div className="col-span-2 md:col-span-1">
            <label className="form-label">Cost Center</label>
            <input 
              className="form-input bg-gray-100" 
              readOnly 
              value={selectedComplaint?.area_name || ''} 
              placeholder="Auto-filled"
            />
          </div>
        </div>

        {/* --- Item Selection Section --- */}
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase">Required Parts</h3>
          <div className="relative">
            <div className="flex relative">
                <input
                  type="text"
                  className="form-input pl-10 w-full"
                  placeholder={formData.area_id ? "Search part name (e.g. MOTOR)..." : "Select a Complaint first to search parts"}
                  value={itemSearch}
                  onChange={e => setItemSearch(e.target.value)}
                  disabled={!formData.area_id} // Disable if no cost center selected
                />
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
            
            {/* Dropdown Results */}
            {itemSearchResults.length > 0 && (
              <div className="absolute z-50 w-full bg-white mt-1 border-2 border-primary-500 rounded-md shadow-2xl max-h-60 overflow-y-auto">
                {itemSearchResults.map((item) => (
                  <button
                    // ✅ FIX: Use inventory_id as key to avoid duplicate key errors
                    key={item.inventory_id} 
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 flex justify-between items-center border-b transition-colors"
                    onClick={() => handleAddItem(item)}
                  >
                    <div>
                      <span className="font-bold text-gray-900 block">{item.description}</span>
                      <span className="text-xs text-gray-500">{item.item_code}</span>
                    </div>
                    <div className="text-right">
                       <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded">
                         Stock: {item.quantity_in_hand}
                       </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {/* No Results Helper */}
            {itemSearch.length > 1 && itemSearchResults.length === 0 && formData.area_id && (
               <div className="absolute z-50 w-full bg-white mt-1 border rounded-md shadow-lg p-3 text-center text-sm text-gray-500">
                  No stock found for this Cost Center.
               </div>
            )}
          </div>
        </div>

        {/* --- Items Table --- */}
        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-20">Qty</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">Status</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {formData.items.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-6 text-gray-400 text-sm italic">
                    No items added. Search above to add parts.
                  </td>
                </tr>
              ) : (
                formData.items.map((item, index) => (
                    <tr key={index}>
                    <td className="px-3 py-2">
                        <div className="text-sm font-medium">{item.description}</div>
                        <div className="text-xs text-gray-500">{item.item_code}</div>
                    </td>
                    <td className="px-3 py-2">
                        <input 
                          type="number" min="1" max={item.stock_max}
                          className="form-input h-8 text-center"
                          value={item.quantity}
                          onChange={e => {
                              const newItems = [...formData.items];
                              newItems[index].quantity = parseInt(e.target.value) || 1;
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
                          <option value="UW">Under Warranty (UW)</option>
                          <option value="OPB">Opening Balance (OPB)</option>
                          <option value="Con W">Contract Warranty</option>
                          <option value="Con P">Contract Paid</option>
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
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
      <ModalFooter>
        <button onClick={onClose} className="btn btn-outline" disabled={createMutation.isPending}>
          Cancel
        </button>
        <button 
          onClick={handleSubmit} 
          className="btn btn-primary"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Creating...' : 'Create MRQS'}
        </button>
      </ModalFooter>
    </Modal>
  );
};

export default CreateMRQSModal;