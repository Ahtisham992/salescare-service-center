// frontend/src/pages/Invoices.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import invoiceService from '../services/invoiceService';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import ConfirmationModal from '../components/common/ConfirmationModal'; // <--- IMPORT THIS
import CreateComplaintInvoiceModal from '../components/invoices/CreateComplaintInvoiceModal';
import CreateCounterSaleInvoiceModal from '../components/invoices/CreateCounterSaleInvoiceModal';
import InvoiceViewModal from '../components/invoices/InvoiceViewModal';
import { toast } from 'react-hot-toast';
import { 
  Plus, Search, Filter, Eye, X, Receipt, DollarSign, 
  Calendar, Trash2, Ban, Wrench, ShoppingCart, CheckCircle 
} from 'lucide-react';
import { 
  formatDate, formatCurrency, getStatusColor,
} from '../utils/formatters';

const Invoices = () => {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ invoice_type: '', status: '' });
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [showInvoiceTypeModal, setShowInvoiceTypeModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showCounterSaleModal, setShowCounterSaleModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  // --- NEW: Confirmation State ---
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    type: 'warning', // danger, warning, success
    title: '',
    message: '',
    action: null, // Function to run on confirm
    confirmText: 'Confirm'
  });

  // Queries
  const queryParams = {
    page: currentPage,
    limit: 10,
    ...(searchTerm && { search: searchTerm }),
    ...(filters.invoice_type && { invoice_type: filters.invoice_type }),
    ...(filters.status && { status: filters.status }),
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['invoices', queryParams],
    queryFn: () => invoiceService.getAll(queryParams),
  });

  const { data: statsData } = useQuery({
    queryKey: ['invoice-stats'],
    queryFn: () => invoiceService.getStats(),
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id) => invoiceService.delete(id),
    onSuccess: () => {
      toast.success('Invoice deleted successfully');
      setConfirmState(prev => ({ ...prev, isOpen: false }));
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['invoice-stats']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete');
      setConfirmState(prev => ({ ...prev, isOpen: false }));
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => invoiceService.updateStatus(id, status),
    onSuccess: (_, variables) => {
      toast.success(`Invoice marked as ${variables.status}`);
      setConfirmState(prev => ({ ...prev, isOpen: false }));
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['invoice-stats']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update status');
      setConfirmState(prev => ({ ...prev, isOpen: false }));
    }
  });

  // --- Handlers using the new Modal ---

  const handleDelete = (id) => {
    setConfirmState({
      isOpen: true,
      type: 'danger',
      title: 'Delete Invoice',
      message: 'Are you sure you want to delete this invoice? This action cannot be undone.',
      confirmText: 'Delete Invoice',
      action: () => deleteMutation.mutate(id)
    });
  };

  const handleCancel = (id) => {
    setConfirmState({
      isOpen: true,
      type: 'warning',
      title: 'Cancel Invoice',
      message: 'Are you sure you want to CANCEL this invoice? This will invalidate the invoice.',
      confirmText: 'Yes, Cancel it',
      action: () => statusMutation.mutate({ id, status: 'Cancelled' })
    });
  };

  const handleMarkPaid = (id) => {
    setConfirmState({
      isOpen: true,
      type: 'success',
      title: 'Confirm Payment',
      message: 'Have you received the full payment? This will mark the invoice as PAID.',
      confirmText: 'Mark as Paid',
      action: () => statusMutation.mutate({ id, status: 'Paid' })
    });
  };

  const handleView = (invoice) => {
    setSelectedInvoiceId(invoice.invoice_id);
    setShowViewModal(true);
  };

  const handleCreateInvoice = () => setShowInvoiceTypeModal(true);

  const handleInvoiceTypeSelect = (type) => {
    setShowInvoiceTypeModal(false);
    if (type === 'complaint') setShowComplaintModal(true);
    else if (type === 'counter-sale') setShowCounterSaleModal(true);
  };

  const handleInvoiceCreated = () => {
    setShowComplaintModal(false);
    setShowCounterSaleModal(false);
    queryClient.invalidateQueries(['invoices']);
  };

  // Columns
  const columns = [
    {
      header: 'Invoice #',
      accessor: 'invoice_number',
      render: (row) => (
        <div className="flex items-center">
          <Receipt className="w-4 h-4 text-gray-400 mr-2" />
          <span className="font-medium text-gray-900">{row.invoice_number}</span>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: 'customer_name',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.customer_name}</div>
          {row.phone && <div className="text-sm text-gray-500">{row.phone}</div>}
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: 'invoice_type',
      render: (row) => (
        <span className={`badge ${row.invoice_type === 'Counter Sale' ? 'badge-info' : 'badge-success'}`}>
          {row.invoice_type}
        </span>
      ),
    },
    {
      header: 'Amount',
      accessor: 'net_amount',
      render: (row) => (
        <div className="text-right font-semibold text-gray-900">
          {formatCurrency(row.net_amount)}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`badge badge-${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      ),
    },
    {
      header: 'Date',
      accessor: 'invoice_date',
      render: (row) => (
        <div className="text-sm text-gray-900">
          {formatDate(row.invoice_date)}
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          {/* View Button */}
          <button onClick={() => handleView(row)} className="p-2 text-primary-600 hover:bg-primary-50 rounded" title="View & Print">
            <Eye className="w-4 h-4" />
          </button>

          {/* Mark as Paid (Admin/Manager + Issued) */}
          {hasRole(['admin', 'manager']) && row.status === 'Issued' && (
            <button onClick={() => handleMarkPaid(row.invoice_id)} className="p-2 text-success-600 hover:bg-success-50 rounded" title="Mark as Paid">
              <CheckCircle className="w-4 h-4" />
            </button>
          )}

          {/* Cancel Button (Admin/Manager + Not Cancelled/Paid) */}
          {hasRole(['admin', 'manager']) && row.status !== 'Cancelled' && row.status !== 'Paid' && (
            <button onClick={() => handleCancel(row.invoice_id)} className="p-2 text-warning-600 hover:bg-warning-50 rounded" title="Cancel Invoice">
              <Ban className="w-4 h-4" />
            </button>
          )}

          {/* Delete Button (Admin Only) */}
          {hasRole(['admin']) && (
            <button onClick={() => handleDelete(row.invoice_id)} className="p-2 text-danger-600 hover:bg-danger-50 rounded" title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const invoices = data?.data?.invoices || [];
  const pagination = data?.data?.pagination || {};
  const stats = statsData?.data || {};

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">Manage sales, services, and billing.</p>
        </div>
        
        {hasRole(['admin', 'manager', 'receptionist']) && (
          <button onClick={handleCreateInvoice} className="btn btn-primary mt-4 md:mt-0 flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </button>
        )}
      </div>

      {/* Stats Cards */}
      {hasRole(['admin', 'manager']) && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="card">
             <div className="flex justify-between items-center">
                <div><p className="text-gray-500 text-sm">Total Revenue</p><h3 className="text-2xl font-bold">{formatCurrency(stats.total_revenue || 0)}</h3></div>
                <div className="p-3 bg-green-100 rounded-full"><DollarSign className="text-green-600 w-6 h-6" /></div>
             </div>
          </div>
          <div className="card">
             <div className="flex justify-between items-center">
                <div><p className="text-gray-500 text-sm">Pending Amount</p><h3 className="text-2xl font-bold">{formatCurrency(stats.pending_amount || 0)}</h3></div>
                <div className="p-3 bg-yellow-100 rounded-full"><Calendar className="text-yellow-600 w-6 h-6" /></div>
             </div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search invoice #, customer, or DO/Complaint #..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="form-input pl-10 w-full"
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'}`}>
            <Filter className="w-4 h-4 mr-2" /> Filters
          </button>
           {(filters.invoice_type || filters.status || searchTerm) && (
              <button
                onClick={() => { setFilters({ invoice_type: '', status: '' }); setSearchTerm(''); }}
                className="btn btn-outline text-red-600 border-red-200 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-2" /> Clear
              </button>
            )}
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
            <select className="form-input" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
              <option value="">All Statuses</option>
              <option value="Issued">Issued</option>
              <option value="Paid">Paid</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <select className="form-input" value={filters.invoice_type} onChange={(e) => setFilters({...filters, invoice_type: e.target.value})}>
              <option value="">All Types</option>
              <option value="Counter Sale">Counter Sale</option>
              <option value="Complaint Service">Service Invoice</option>
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card">
        {isLoading ? <div className="p-8 text-center text-gray-500">Loading invoices...</div> : 
         error ? <div className="p-8 text-center text-red-500">Error loading data. Please try again.</div> :
         <DataTable columns={columns} data={invoices} pagination={pagination} onPageChange={setCurrentPage} emptyMessage="No invoices found." />
        }
      </div>

      {/* --- CONFIRMATION MODAL --- */}
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.action}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        confirmText={confirmState.confirmText}
        isLoading={deleteMutation.isPending || statusMutation.isPending}
      />

      {/* Invoice Type Modal */}
      {showInvoiceTypeModal && (
        <Modal isOpen={showInvoiceTypeModal} onClose={() => setShowInvoiceTypeModal(false)} title="Select Invoice Type" size="md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
            <button onClick={() => handleInvoiceTypeSelect('complaint')} className="p-6 border-2 border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center group">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200">
                <Wrench className="w-6 h-6 text-blue-600"/>
              </div>
              <h3 className="font-bold text-gray-900">Complaint Invoice</h3>
              <p className="text-xs text-gray-500 mt-1">For repairs & services.</p>
            </button>
            <button onClick={() => handleInvoiceTypeSelect('counter-sale')} className="p-6 border-2 border-gray-100 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-center group">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200">
                <ShoppingCart className="w-6 h-6 text-green-600"/>
              </div>
              <h3 className="font-bold text-gray-900">Counter Sale</h3>
              <p className="text-xs text-gray-500 mt-1">Direct part sales.</p>
            </button>
          </div>
        </Modal>
      )}

      {showComplaintModal && <CreateComplaintInvoiceModal isOpen={showComplaintModal} onClose={() => setShowComplaintModal(false)} onSuccess={handleInvoiceCreated} />}
      {showCounterSaleModal && <CreateCounterSaleInvoiceModal isOpen={showCounterSaleModal} onClose={() => setShowCounterSaleModal(false)} onSuccess={handleInvoiceCreated} />}
      {showViewModal && selectedInvoiceId && <InvoiceViewModal isOpen={showViewModal} onClose={() => { setShowViewModal(false); setSelectedInvoiceId(null); }} invoiceId={selectedInvoiceId} />}
    </div>
  );
};

export default Invoices;