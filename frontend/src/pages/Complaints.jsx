// frontend/src/pages/Complaints.jsx - COMPLETE VERSION
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import complaintService from '../services/complaintService';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import Modal, { ModalFooter } from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  X,
  FileText,
  User,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { 
  formatDate, 
  formatRelativeTime, 
  getStatusColor, 
  getPriorityColor,
  getWarrantyColor 
} from '../utils/formatters';

const Complaints = () => {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    warranty_status: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Build query params
  const queryParams = {
    page: currentPage,
    limit: 10,
    ...(searchTerm && { search: searchTerm }),
    ...(filters.status && { status: filters.status }),
    ...(filters.priority && { priority: filters.priority }),
    ...(filters.warranty_status && { warranty_status: filters.warranty_status }),
  };

  // Fetch complaints
  const { data, isLoading, error } = useQuery({
    queryKey: ['complaints', queryParams],
    queryFn: () => complaintService.getAll(queryParams),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => complaintService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['complaints']);
      toast.success('Complaint deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete complaint');
    },
  });

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this complaint?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = (complaint) => {
    setSelectedComplaint(complaint);
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
      status: '',
      priority: '',
      warranty_status: '',
    });
    setSearchTerm('');
  };

  // Table columns
  const columns = [
    {
      header: 'Complaint #',
      accessor: 'complaint_number',
      render: (row) => (
        <div className="flex items-center">
          <FileText className="w-4 h-4 text-gray-400 mr-2" />
          <span className="font-medium text-gray-900">{row.complaint_number}</span>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: 'customer_name',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.customer_name}</div>
          <div className="text-sm text-gray-500">{row.customer_phone}</div>
        </div>
      ),
    },
    {
      header: 'Product',
      accessor: 'product_name',
      render: (row) => (
        <div>
          <div className="text-sm text-gray-900">{row.product_name}</div>
          {row.serial_number && (
            <div className="text-xs text-gray-500">S/N: {row.serial_number}</div>
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
      header: 'Priority',
      accessor: 'priority',
      render: (row) => (
        <span className={`badge badge-${getPriorityColor(row.priority)}`}>
          {row.priority}
        </span>
      ),
    },
    {
      header: 'Warranty',
      accessor: 'warranty_status',
      render: (row) => (
        <span className={`badge badge-${getWarrantyColor(row.warranty_status)}`}>
          {row.warranty_status}
        </span>
      ),
    },
    {
      header: 'Date',
      accessor: 'complaint_date',
      render: (row) => (
        <div>
          <div className="text-sm text-gray-900">{formatDate(row.complaint_date)}</div>
          <div className="text-xs text-gray-500">{formatRelativeTime(row.complaint_date)}</div>
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
          {hasRole(['admin', 'manager']) && (
            <button
              onClick={() => handleDelete(row.complaint_id)}
              className="p-2 text-danger-600 hover:bg-danger-50 rounded"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const complaints = data?.data?.complaints || [];
  const pagination = data?.data?.pagination || {};

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="page-title">Complaints</h1>
          <p className="page-subtitle">
            Manage customer service complaints and track resolutions
          </p>
        </div>
        
        {hasRole(['admin', 'manager', 'receptionist']) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary mt-4 md:mt-0 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Complaint
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
              placeholder="Search by complaint #, customer name, phone..."
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
            
            {(filters.status || filters.priority || filters.warranty_status || searchTerm) && (
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="form-label">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="form-input"
              >
                <option value="">All Statuses</option>
                <option value="Open">Open</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="form-label">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="form-input"
              >
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="form-label">Warranty Status</label>
              <select
                value={filters.warranty_status}
                onChange={(e) => handleFilterChange('warranty_status', e.target.value)}
                className="form-input"
              >
                <option value="">All Types</option>
                <option value="In Warranty">In Warranty</option>
                <option value="Out of Warranty">Out of Warranty</option>
                <option value="Contract Warranty">Contract Warranty</option>
                <option value="Contract Paid">Contract Paid</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card">
        {error ? (
          <div className="text-center py-12 text-danger-600">
            <AlertCircle className="w-12 h-12 mx-auto mb-3" />
            <p>Failed to load complaints. Please try again.</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={complaints}
            pagination={pagination}
            onPageChange={setCurrentPage}
            loading={isLoading}
            emptyMessage="No complaints found. Create your first complaint to get started."
          />
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedComplaint && (
        <Modal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedComplaint(null);
          }}
          title="Complaint Details"
          size="lg"
        >
          <div className="space-y-6">
            {/* Complaint Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Complaint #</label>
                <p className="text-gray-900 mt-1">{selectedComplaint.complaint_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Date</label>
                <p className="text-gray-900 mt-1">{formatDate(selectedComplaint.complaint_date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <div className="mt-1">
                  <span className={`badge badge-${getStatusColor(selectedComplaint.status)}`}>
                    {selectedComplaint.status}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Priority</label>
                <div className="mt-1">
                  <span className={`badge badge-${getPriorityColor(selectedComplaint.priority)}`}>
                    {selectedComplaint.priority}
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
                  <p className="text-gray-900 mt-1">{selectedComplaint.customer_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-gray-900 mt-1">{selectedComplaint.customer_phone}</p>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Product Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Product</label>
                  <p className="text-gray-900 mt-1">{selectedComplaint.product_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Serial Number</label>
                  <p className="text-gray-900 mt-1">{selectedComplaint.serial_number || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Warranty Status</label>
                  <div className="mt-1">
                    <span className={`badge badge-${getWarrantyColor(selectedComplaint.warranty_status)}`}>
                      {selectedComplaint.warranty_status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Complaint Description</h4>
              <p className="text-gray-700">{selectedComplaint.complaint_description || 'No description provided'}</p>
            </div>
          </div>

          <ModalFooter>
            <button onClick={() => setShowViewModal(false)} className="btn btn-outline">
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
          title="Create New Complaint"
          size="lg"
        >
          <div className="text-center py-8 text-gray-600">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">Complaint Form</p>
            <p className="text-sm">Form component coming soon...</p>
            <p className="text-xs text-gray-500 mt-2">
              Will include fields for customer, product, warranty, description, etc.
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

export default Complaints;