// frontend/src/components/invoices/CreateComplaintInvoiceModal.jsx
// WITH WARRANTY AWARENESS
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal, { ModalFooter } from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import complaintService from '../../services/complaintService';
import invoiceService from '../../services/invoiceService';
import { formatCurrency } from '../../utils/formatters';
import { numberToWords } from '../../utils/numberToWords';
import { toast } from 'react-hot-toast';
import { Receipt, AlertCircle, Plus, Trash2, Shield, Info } from 'lucide-react';

const SERVICE_CHARGE_TYPES = [
  { value: 'visit_charges_24h', label: 'Visit Charges (24h)', key: 'visit_charges_24h', isVisit: true },
  { value: 'visit_charges_48h', label: 'Visit Charges (48h)', key: 'visit_charges_48h', isVisit: true },
  { value: 'gas_charges', label: 'Gas Charges', key: 'gas_charges', isVisit: false },
  { value: 'inspection_charges_csc', label: 'Inspection Charges', key: 'inspection_charges_csc', isVisit: false },
  { value: 'washing_charges', label: 'Washing/Service Charges', key: 'washing_charges', isVisit: false },
  { value: 'transport_charges_per_km', label: 'Transport Charges (per km)', key: 'transport_charges_per_km', isVisit: false },
  { value: 'dismantling_charges', label: 'Dismantling Charges', key: 'dismantling_charges', isVisit: false },
  { value: 'reinstallation_charges', label: 'Re-installation Charges', key: 'reinstallation_charges', isVisit: false },
];

// Warranty charge rules (matching backend)
const getWarrantyInfo = (warrantyStatus) => {
  const info = {
    'In Warranty': {
      serviceCharged: false,
      partsCharged: false,
      visitCharged: true,
      description: 'Service & parts FREE, visit charges apply',
      color: 'text-green-700 bg-green-50 border-green-300'
    },
    'Out of Warranty': {
      serviceCharged: true,
      partsCharged: true,
      visitCharged: true,
      description: 'All charges apply',
      color: 'text-red-700 bg-red-50 border-red-300'
    },
    'Contract Warranty': {
      serviceCharged: false,
      partsCharged: false,
      visitCharged: true,
      description: 'Service & parts covered by contract, visit charges apply',
      color: 'text-blue-700 bg-blue-50 border-blue-300'
    },
    'Contract Paid': {
      serviceCharged: true,
      partsCharged: true,
      visitCharged: true,
      description: 'All charges apply at contract rates',
      color: 'text-orange-700 bg-orange-50 border-orange-300'
    }
  };

  return info[warrantyStatus] || info['Out of Warranty'];
};

const CreateComplaintInvoiceModal = ({ isOpen, onClose, onSuccess }) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    complaint_id: '',
    area_id: '',
    service_charge_type: '',
    additional_charges: [],
    discount: 0,
    waive_off: 0,
    payment_terms: '',
    is_co: false,
  });

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [customCharges, setCustomCharges] = useState([]);

  // Fetch completed/in-progress complaints without invoices
  const { data: complaintsData, isLoading: complaintsLoading } = useQuery({
    queryKey: ['complaints-for-invoice'],
    queryFn: () => complaintService.getAll({ 
      status: 'Completed',
      limit: 100 
    }),
    enabled: isOpen,
  });

  // Fetch complaint details when selected
  const { data: complaintDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['complaint-detail', formData.complaint_id],
    queryFn: () => complaintService.getById(formData.complaint_id),
    enabled: !!formData.complaint_id,
  });

  useEffect(() => {
    if (complaintDetails?.data) {
      setSelectedComplaint(complaintDetails.data);
      setFormData(prev => ({
        ...prev,
        area_id: complaintDetails.data.area_id,
      }));
    }
  }, [complaintDetails]);

  // Create invoice mutation
  const createMutation = useMutation({
    mutationFn: (data) => invoiceService.createComplaintInvoice(data),
    onSuccess: () => {
      toast.success('Invoice created successfully!');
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['complaints']);
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

  const addCustomCharge = () => {
    setCustomCharges(prev => [...prev, {
      description: '',
      amount: 0,
      gst_percentage: 18,
    }]);
  };

  const removeCustomCharge = (index) => {
    setCustomCharges(prev => prev.filter((_, i) => i !== index));
  };

  const updateCustomCharge = (index, field, value) => {
    setCustomCharges(prev => prev.map((charge, i) => 
      i === index ? { ...charge, [field]: value } : charge
    ));
  };

  // Get warranty info
  const warrantyInfo = selectedComplaint 
    ? getWarrantyInfo(selectedComplaint.warranty_status)
    : null;

  // Calculate totals with warranty rules
  const calculateTotals = () => {
    let subtotal = 0;
    let gst = 0;

    if (!selectedComplaint || !warrantyInfo) return { subtotal: 0, gst: 0, discount: 0, total: 0, waiveOff: 0, netAmount: 0 };

    // Service charge with warranty rules
    if (formData.service_charge_type && selectedComplaint) {
      let chargeAmount = parseFloat(selectedComplaint[formData.service_charge_type] || 0);
      const selectedService = SERVICE_CHARGE_TYPES.find(t => t.key === formData.service_charge_type);
      
      // Apply warranty rules: Free if not a visit charge and service is covered
      if (!warrantyInfo.serviceCharged && !selectedService?.isVisit) {
        chargeAmount = 0;
      }
      
      subtotal += chargeAmount;
      if (chargeAmount > 0) {
        gst += chargeAmount * 0.18; // 18% GST on services
      }
    }

    // Parts from MRQS - apply warranty rules
    let partsAmount = parseFloat(selectedComplaint?.parts_amount || 0);
    if (!warrantyInfo.partsCharged) {
      partsAmount = 0; // Parts are FREE under warranty
    }
    
    subtotal += partsAmount;
    if (partsAmount > 0) {
      gst += partsAmount * 0.18;
    }

    // Custom charges (always charged)
    customCharges.forEach(charge => {
      const amount = parseFloat(charge.amount || 0);
      subtotal += amount;
      gst += amount * (parseFloat(charge.gst_percentage) / 100);
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

    if (!formData.complaint_id) {
      toast.error('Please select a complaint');
      return;
    }

    if (!formData.service_charge_type) {
      toast.error('Please select a service charge type');
      return;
    }

    // Build additional charges object
    const additionalCharges = {};
    customCharges.forEach((charge, index) => {
      if (charge.description && charge.amount > 0) {
        additionalCharges[`custom_${index}`] = {
          description: charge.description,
          amount: parseFloat(charge.amount),
          gst_percentage: parseFloat(charge.gst_percentage),
        };
      }
    });

    const submitData = {
      complaint_id: parseInt(formData.complaint_id),
      area_id: parseInt(formData.area_id),
      service_charge_type: formData.service_charge_type,
      additional_charges: additionalCharges,
      discount: parseFloat(formData.discount || 0),
      waive_off: parseFloat(formData.waive_off || 0),
      payment_terms: formData.payment_terms || null,
      is_co: formData.is_co,
    };

    createMutation.mutate(submitData);
  };

  const complaints = complaintsData?.data?.complaints || [];
  const totals = calculateTotals();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Complaint Service Invoice"
      size="xl"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Complaint Selection */}
          <div>
            <label className="form-label required">Select Complaint</label>
            {complaintsLoading ? (
              <div className="py-4"><LoadingSpinner size="sm" /></div>
            ) : (
              <select
                value={formData.complaint_id}
                onChange={(e) => handleInputChange('complaint_id', e.target.value)}
                className="form-input"
                required
              >
                <option value="">-- Select Complaint --</option>
                {complaints.map(complaint => (
                  <option key={complaint.complaint_id} value={complaint.complaint_id}>
                    {complaint.complaint_number} - {complaint.customer_name} - {complaint.product_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Complaint Details & Warranty Info */}
          {selectedComplaint && (
            <>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Complaint Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Customer:</span>
                    <span className="ml-2 font-medium">{selectedComplaint.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Product:</span>
                    <span className="ml-2 font-medium">{selectedComplaint.product_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Serial No:</span>
                    <span className="ml-2 font-medium">{selectedComplaint.serial_number || 'N/A'}</span>
                  </div>
                  {selectedComplaint.parts_amount > 0 && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Parts Amount (MRQS):</span>
                      <span className="ml-2 font-medium text-primary-600">
                        {formatCurrency(selectedComplaint.parts_amount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Warranty Status Alert */}
              {warrantyInfo && (
                <div className={`p-4 rounded-lg border-2 ${warrantyInfo.color}`}>
                  <div className="flex items-start">
                    <Shield className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-bold text-sm mb-1 flex items-center">
                        Warranty Status: {selectedComplaint.warranty_status}
                      </h4>
                      <p className="text-xs mb-2">{warrantyInfo.description}</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="flex items-center">
                          {warrantyInfo.serviceCharged ? '❌' : '✅'} Service Charges
                        </div>
                        <div className="flex items-center">
                          {warrantyInfo.partsCharged ? '❌' : '✅'} Parts Charges
                        </div>
                        <div className="flex items-center">
                          {warrantyInfo.visitCharged ? '❌' : '✅'} Visit Charges
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Service Charge Type */}
          {selectedComplaint && (
            <div>
              <label className="form-label required">Service Charge Type</label>
              <select
                value={formData.service_charge_type}
                onChange={(e) => handleInputChange('service_charge_type', e.target.value)}
                className="form-input"
                required
              >
                <option value="">-- Select Service Type --</option>
                {SERVICE_CHARGE_TYPES.map(type => {
                  let amount = selectedComplaint[type.key] || 0;
                  
                  // Show if warranty will waive this charge
                  const willBeWaived = warrantyInfo && !warrantyInfo.serviceCharged && !type.isVisit;
                  const displayAmount = willBeWaived ? 0 : amount;
                  
                  return (
                    <option key={type.value} value={type.key}>
                      {type.label} - {formatCurrency(displayAmount)}
                      {willBeWaived ? ' (Warranty Covered)' : ''}
                    </option>
                  );
                })}
              </select>
              {formData.service_charge_type && warrantyInfo && (
                <p className="mt-1 text-xs text-gray-600 flex items-start">
                  <Info className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                  {SERVICE_CHARGE_TYPES.find(t => t.key === formData.service_charge_type)?.isVisit
                    ? 'Visit charges are always charged regardless of warranty status'
                    : warrantyInfo.serviceCharged 
                      ? 'This service charge will be applied to the invoice'
                      : 'This service charge is covered by warranty and will be FREE'}
                </p>
              )}
            </div>
          )}

          {/* Additional Custom Charges */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="form-label">Additional Charges (Optional)</label>
              <button
                type="button"
                onClick={addCustomCharge}
                className="btn btn-sm btn-outline flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Charge
              </button>
            </div>

            {customCharges.length > 0 && (
              <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                <Info className="w-3 h-3 inline mr-1" />
                Additional charges are always applied regardless of warranty status
              </div>
            )}

            {customCharges.map((charge, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Description"
                  value={charge.description}
                  onChange={(e) => updateCustomCharge(index, 'description', e.target.value)}
                  className="form-input col-span-6"
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={charge.amount}
                  onChange={(e) => updateCustomCharge(index, 'amount', e.target.value)}
                  className="form-input col-span-3"
                  min="0"
                  step="0.01"
                />
                <input
                  type="number"
                  placeholder="GST %"
                  value={charge.gst_percentage}
                  onChange={(e) => updateCustomCharge(index, 'gst_percentage', e.target.value)}
                  className="form-input col-span-2"
                  min="0"
                  max="100"
                />
                <button
                  type="button"
                  onClick={() => removeCustomCharge(index)}
                  className="btn btn-sm btn-danger col-span-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Discount & Waive-off */}
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
              id="is_co"
              checked={formData.is_co}
              onChange={(e) => handleInputChange('is_co', e.target.checked)}
              className="form-checkbox"
            />
            <label htmlFor="is_co" className="ml-2 text-sm text-gray-700">
              Mark as CO (Cash Order)
            </label>
          </div>

          {/* Totals Summary */}
          {formData.service_charge_type && (
            <div className="bg-primary-50 p-4 rounded-lg border border-primary-200">
              <h4 className="font-semibold text-gray-900 mb-3">Invoice Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GST (18%):</span>
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
                
                {/* Warranty savings notice */}
                {warrantyInfo && (!warrantyInfo.serviceCharged || !warrantyInfo.partsCharged) && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                    <Shield className="w-3 h-3 inline mr-1" />
                    Warranty coverage applied - customer saves on 
                    {!warrantyInfo.serviceCharged && ' service charges'}
                    {!warrantyInfo.serviceCharged && !warrantyInfo.partsCharged && ' and'}
                    {!warrantyInfo.partsCharged && ' parts'}
                  </div>
                )}
              </div>
            </div>
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
            disabled={createMutation.isPending || !formData.service_charge_type}
          >
            {createMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Receipt className="w-4 h-4 mr-2" />
                Create Invoice
              </>
            )}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default CreateComplaintInvoiceModal;