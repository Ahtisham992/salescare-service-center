// frontend/src/pages/Invoices.jsx - COMPLETE VERSION WITH ALL MODALS
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import invoiceService from '../services/invoiceService';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import Modal, { ModalFooter } from '../components/common/Modal';
import CreateComplaintInvoiceModal from '../components/invoices/CreateComplaintInvoiceModal';
import CreateCounterSaleInvoiceModal from '../components/invoices/CreateCounterSaleInvoiceModal';
import InvoiceViewModal from '../components/invoices/InvoiceViewModal';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Download,
  X,
  Receipt,
  DollarSign,
  Calendar,
  AlertCircle,
  FileText,
  Wrench,
  ShoppingCart
} from 'lucide-react';
import { 
  formatDate, 
  formatCurrency,
  formatRelativeTime, 
  getStatusColor,
} from '../utils/formatters';

const Invoices = () => {
  const { hasRole } = useAuth();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    invoice_type: '',
    status: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [showInvoiceTypeModal, setShowInvoiceTypeModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showCounterSaleModal, setShowCounterSaleModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  // Build query params
  const queryParams = {
    page: currentPage,
    limit: 10,
    ...(searchTerm && { search: searchTerm }),
    ...(filters.invoice_type && { invoice_type: filters.invoice_type }),
    ...(filters.status && { status: filters.status }),
  };

  // Fetch invoices
  const { data, isLoading, error } = useQuery({
    queryKey: ['invoices', queryParams],
    queryFn: () => invoiceService.getAll(queryParams),
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['invoice-stats'],
    queryFn: () => invoiceService.getStats(),
  });

  const handleView = (invoice) => {
    setSelectedInvoiceId(invoice.invoice_id);
    setShowViewModal(true);
  };

  const handleCreateInvoice = () => {
    setShowInvoiceTypeModal(true);
  };

  const handleInvoiceTypeSelect = (type) => {
    setShowInvoiceTypeModal(false);
    if (type === 'complaint') {
      setShowComplaintModal(true);
    } else if (type === 'counter-sale') {
      setShowCounterSaleModal(true);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      invoice_type: '',
      status: '',
    });
    setSearchTerm('');
  };

  const handleInvoiceCreated = () => {
    setShowComplaintModal(false);
    setShowCounterSaleModal(false);
  };

  // Table columns
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
          {row.phone && (
            <div className="text-sm text-gray-500">{row.phone}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: 'invoice_type',
      render: (row) => (
        <span className={`badge ${
          row.invoice_type === 'Counter Sale' 
            ? 'badge-info' 
            : 'badge-success'
        }`}>
          {row.invoice_type}
        </span>
      ),
    },
    {
      header: 'Reference',
      accessor: 'reference',
      render: (row) => (
        <div className="text-sm">
          {row.complaint_number && (
            <div className="text-gray-900">C: {row.complaint_number}</div>
          )}
          {row.do_number && (
            <div className="text-gray-900">DO: {row.do_number}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Amount',
      accessor: 'net_amount',
      render: (row) => (
        <div className="text-right">
          <div className="font-semibold text-gray-900">
            {formatCurrency(row.net_amount)}
          </div>
          {row.discount > 0 && (
            <div className="text-xs text-gray-500">
              Disc: {formatCurrency(row.discount)}
            </div>
          )}
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
        <div>
          <div className="text-sm text-gray-900">{formatDate(row.invoice_date)}</div>
          <div className="text-xs text-gray-500">{formatRelativeTime(row.invoice_date)}</div>
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleView(row)}
            className="p-2 text-primary-600 hover:bg-primary-50 rounded"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => toast('PDF download coming soon', { icon: 'ℹ️' })}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </button>
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
          <p className="page-subtitle">
            Generate and manage invoices for sales and services
          </p>
        </div>
        
        {hasRole(['admin', 'manager', 'receptionist']) && (
          <button
            onClick={handleCreateInvoice}
            className="btn btn-primary mt-4 md:mt-0 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice #, customer name..."
              value={searchTerm}
              onChange={handleSearch}
              className="form-input pl-10 w-full"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'} flex items-center`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
            
            {(filters.invoice_type || filters.status || searchTerm) && (
              <button
                onClick={clearFilters}
                className="btn btn-outline flex items-center text-danger-600 border-danger-600 hover:bg-danger-50"
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="form-label">Invoice Type</label>
              <select
                value={filters.invoice_type}
                onChange={(e) => handleFilterChange('invoice_type', e.target.value)}
                className="form-input"
              >
                <option value="">All Types</option>
                <option value="Counter Sale">Counter Sale</option>
                <option value="Complaint Service">Complaint Service</option>
              </select>
            </div>

            <div>
              <label className="form-label">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="form-input"
              >
                <option value="">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Issued">Issued</option>
                <option value="Paid">Paid</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.total_invoices || pagination.total_items || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.total_revenue || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.paid || invoices.filter(inv => inv.status === 'Paid').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(stats.paid_amount || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.issued || invoices.filter(inv => inv.status === 'Issued').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(stats.pending_amount || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {error ? (
          <div className="text-center py-12 text-danger-600">
            <AlertCircle className="w-12 h-12 mx-auto mb-3" />
            <p>Failed to load invoices. Please try again.</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={invoices}
            pagination={pagination}
            onPageChange={setCurrentPage}
            loading={isLoading}
            emptyMessage="No invoices found. Create your first invoice to get started."
          />
        )}
      </div>

      {/* Invoice Type Selection Modal */}
      {showInvoiceTypeModal && (
        <Modal
          isOpen={showInvoiceTypeModal}
          onClose={() => setShowInvoiceTypeModal(false)}
          title="Select Invoice Type"
          size="md"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleInvoiceTypeSelect('complaint')}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-success-200 transition-colors">
                  <Wrench className="w-8 h-8 text-success-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Complaint Service</h3>
                <p className="text-sm text-gray-600">
                  Create invoice for service complaints with charges and parts
                </p>
              </div>
            </button>

            <button
              onClick={() => handleInvoiceTypeSelect('counter-sale')}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-info-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-info-200 transition-colors">
                  <ShoppingCart className="w-8 h-8 text-info-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Counter Sale</h3>
                <p className="text-sm text-gray-600">
                  Create invoice for direct sales from delivery orders
                </p>
              </div>
            </button>
          </div>

          <ModalFooter>
            <button
              onClick={() => setShowInvoiceTypeModal(false)}
              className="btn btn-outline w-full"
            >
              Cancel
            </button>
          </ModalFooter>
        </Modal>
      )}

      {/* Complaint Invoice Modal */}
      {showComplaintModal && (
        <CreateComplaintInvoiceModal
          isOpen={showComplaintModal}
          onClose={() => setShowComplaintModal(false)}
          onSuccess={handleInvoiceCreated}
        />
      )}

      {/* Counter Sale Invoice Modal */}
      {showCounterSaleModal && (
        <CreateCounterSaleInvoiceModal
          isOpen={showCounterSaleModal}
          onClose={() => setShowCounterSaleModal(false)}
          onSuccess={handleInvoiceCreated}
        />
      )}

      {/* View Invoice Modal */}
      {showViewModal && selectedInvoiceId && (
        <InvoiceViewModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedInvoiceId(null);
          }}
          invoiceId={selectedInvoiceId}
        />
      )}
    </div>
  );
};

export default Invoices;