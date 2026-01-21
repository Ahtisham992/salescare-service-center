// frontend/src/pages/Invoices.jsx - COMPLETE VERSION
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import invoiceService from '../services/invoiceService';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import Modal, { ModalFooter } from '../components/common/Modal';
import toast from 'react-hot-toast';
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
  FileText
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

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

  const handleView = (invoice) => {
    setSelectedInvoice(invoice);
    setShowViewModal(true);
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
            onClick={() => toast.info('PDF download coming soon')}
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
            onClick={() => setShowCreateModal(true)}
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
                {pagination.total_items || 0}
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
                {formatCurrency(
                  invoices.reduce((sum, inv) => sum + parseFloat(inv.net_amount || 0), 0)
                )}
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
                {invoices.filter(inv => inv.status === 'Paid').length}
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
                {invoices.filter(inv => inv.status === 'Issued').length}
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

      {/* View Modal */}
      {showViewModal && selectedInvoice && (
        <Modal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedInvoice(null);
          }}
          title="Invoice Details"
          size="lg"
        >
          <div className="space-y-6">
            {/* Invoice Header */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Invoice #</label>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {selectedInvoice.invoice_number}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Date</label>
                <p className="text-gray-900 mt-1">{formatDate(selectedInvoice.invoice_date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Type</label>
                <div className="mt-1">
                  <span className={`badge ${
                    selectedInvoice.invoice_type === 'Counter Sale' 
                      ? 'badge-info' 
                      : 'badge-success'
                  }`}>
                    {selectedInvoice.invoice_type}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <div className="mt-1">
                  <span className={`badge badge-${getStatusColor(selectedInvoice.status)}`}>
                    {selectedInvoice.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-gray-900 mt-1">{selectedInvoice.customer_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-gray-900 mt-1">{selectedInvoice.phone || 'N/A'}</p>
                </div>
                {selectedInvoice.address && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">Address</label>
                    <p className="text-gray-900 mt-1">{selectedInvoice.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Amount Details */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Amount Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                {selectedInvoice.gst_total > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">GST (18%)</span>
                    <span className="font-medium">{formatCurrency(selectedInvoice.gst_total)}</span>
                  </div>
                )}
                {selectedInvoice.fst_total > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">FST (16%)</span>
                    <span className="font-medium">{formatCurrency(selectedInvoice.fst_total)}</span>
                  </div>
                )}
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-danger-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedInvoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span>Total Amount</span>
                  <span className="text-primary-600">{formatCurrency(selectedInvoice.net_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          <ModalFooter>
            <button onClick={() => toast.info('PDF download coming soon')} className="btn btn-outline">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </button>
            <button onClick={() => setShowViewModal(false)} className="btn btn-primary">
              Close
            </button>
          </ModalFooter>
        </Modal>
      )}

      {/* Create Modal - Placeholder */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Invoice"
          size="lg"
        >
          <div className="text-center py-8 text-gray-600">
            <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">Invoice Form</p>
            <p className="text-sm">Form component coming soon...</p>
            <p className="text-xs text-gray-500 mt-2">
              Will include options for Counter Sale or Complaint Service invoice
            </p>
          </div>
          <ModalFooter>
            <button onClick={() => setShowCreateModal(false)} className="btn btn-outline">
              Close
            </button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
};

export default Invoices;