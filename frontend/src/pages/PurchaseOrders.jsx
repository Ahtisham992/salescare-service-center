// frontend/src/pages/PurchaseOrders.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import purchaseService from '../services/purchaseService';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import CreatePurchaseOrderModal from '../components/purchase/CreatePurchaseOrderModal';
import ViewPurchaseOrderModal from '../components/purchase/ViewPurchaseOrderModal';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { toast } from 'react-hot-toast';
import {
  Plus, Search, Filter, Eye, X, FileText, ArrowLeft,
  CheckCircle, Ban, Trash2, Package, TrendingUp
} from 'lucide-react';
import { formatDate, formatCurrency, getStatusColor } from '../utils/formatters';

const PurchaseOrders = () => {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: '', vendor_type: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  // Confirmation Modal State
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    action: null,
    confirmText: 'Confirm'
  });

  // Build query params
  const queryParams = {
    page: currentPage,
    limit: 10,
    ...(searchTerm && { search: searchTerm }),
    ...(filters.status && { status: filters.status }),
    ...(filters.vendor_type && { vendor_type: filters.vendor_type })
  };

  // Fetch purchase orders
  const { data, isLoading, error } = useQuery({
    queryKey: ['purchase-orders', queryParams],
    queryFn: () => purchaseService.getAll(queryParams)
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (id) => purchaseService.approve(id),
    onSuccess: () => {
      toast.success('Purchase Order Approved');
      queryClient.invalidateQueries(['purchase-orders']);
      setConfirmState(prev => ({ ...prev, isOpen: false }));
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to approve');
      setConfirmState(prev => ({ ...prev, isOpen: false }));
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => purchaseService.cancel(id),
    onSuccess: () => {
      toast.success('Purchase Order Cancelled');
      queryClient.invalidateQueries(['purchase-orders']);
      setConfirmState(prev => ({ ...prev, isOpen: false }));
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to cancel');
      setConfirmState(prev => ({ ...prev, isOpen: false }));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => purchaseService.delete(id),
    onSuccess: () => {
      toast.success('Purchase Order Deleted');
      queryClient.invalidateQueries(['purchase-orders']);
      setConfirmState(prev => ({ ...prev, isOpen: false }));
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete');
      setConfirmState(prev => ({ ...prev, isOpen: false }));
    }
  });

  // Action Handlers
  const handleApprove = (id) => {
    setConfirmState({
      isOpen: true,
      type: 'success',
      title: 'Approve Purchase Order',
      message: 'Approve this purchase order? This will allow goods receipts to be created against it.',
      confirmText: 'Approve',
      action: () => approveMutation.mutate(id)
    });
  };

  const handleCancel = (id) => {
    setConfirmState({
      isOpen: true,
      type: 'warning',
      title: 'Cancel Purchase Order',
      message: 'Are you sure you want to cancel this PO? No goods receipts can be created against cancelled orders.',
      confirmText: 'Cancel PO',
      action: () => cancelMutation.mutate(id)
    });
  };

  const handleDelete = (id) => {
    setConfirmState({
      isOpen: true,
      type: 'danger',
      title: 'Delete Purchase Order',
      message: 'Permanently delete this purchase order? This cannot be undone.',
      confirmText: 'Delete',
      action: () => deleteMutation.mutate(id)
    });
  };

  const handleView = (po) => {
    setSelectedPO(po);
    setShowViewModal(true);
  };

  const clearFilters = () => {
    setFilters({ status: '', vendor_type: '' });
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Table columns
  const columns = [
    {
      header: 'PO Number',
      accessor: 'po_number',
      render: (row) => (
        <div className="flex items-center">
          <FileText className="w-4 h-4 text-gray-400 mr-2" />
          <span className="font-medium text-gray-900">{row.po_number}</span>
        </div>
      )
    },
    {
      header: 'Vendor',
      accessor: 'vendor_name',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.vendor_name}</div>
          <div className="text-xs text-gray-500">{row.vendor_code} • {row.vendor_type}</div>
        </div>
      )
    },
    {
      header: 'PO Date',
      accessor: 'po_date',
      render: (row) => formatDate(row.po_date)
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`badge badge-${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Items',
      accessor: 'items_count',
      render: (row) => (
        <span className="text-sm text-gray-600">{row.items_count} items</span>
      )
    },
    {
      header: 'Total Amount',
      accessor: 'total_amount',
      render: (row) => (
        <div className="text-right font-semibold text-gray-900">
          {formatCurrency(row.total_amount)}
        </div>
      )
    },
    {
      header: 'GR Status',
      accessor: 'gr_count',
      render: (row) => (
        <span className={`text-xs ${row.gr_count > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
          {row.gr_count > 0 ? `${row.gr_count} GR Created` : 'Pending'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleView(row)}
            className="p-2 text-primary-600 hover:bg-primary-50 rounded"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>

          {hasRole(['admin', 'manager']) && row.status === 'pending' && (
            <button
              onClick={() => handleApprove(row.po_id)}
              className="p-2 text-green-600 hover:bg-green-50 rounded"
              title="Approve PO"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}

          {hasRole(['admin', 'manager']) && (row.status === 'pending' || row.status === 'approved') && row.gr_count === 0 && (
            <button
              onClick={() => handleCancel(row.po_id)}
              className="p-2 text-orange-600 hover:bg-orange-50 rounded"
              title="Cancel PO"
            >
              <Ban className="w-4 h-4" />
            </button>
          )}

          {hasRole(['admin']) && row.status === 'pending' && row.gr_count === 0 && (
            <button
              onClick={() => handleDelete(row.po_id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  const purchaseOrders = data?.data?.purchase_orders || [];
  const pagination = data?.data?.pagination || {};

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="page-title">Purchase Orders</h1>
          <p className="page-subtitle">Create and manage purchase orders for inventory procurement</p>
        </div>

        {hasRole(['admin', 'manager']) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Purchase Order
          </button>
        )}
      </div>

      {/* Quick Stats */}
      {hasRole(['admin', 'manager']) && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Total POs</p>
                <h3 className="text-2xl font-bold">{pagination.total_items || 0}</h3>
              </div>
              <div className="p-3 bg-primary-100 rounded-full">
                <FileText className="text-primary-600 w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Pending Approval</p>
                <h3 className="text-2xl font-bold">
                  {purchaseOrders.filter(po => po.status === 'pending').length}
                </h3>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Package className="text-yellow-600 w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by PO #, vendor name..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="form-input pl-10 w-full"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'} flex items-center`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>

            {(filters.status || filters.vendor_type || searchTerm) && (
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

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="form-label">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="form-input"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="form-label">Vendor Type</label>
              <select
                value={filters.vendor_type}
                onChange={(e) => setFilters({ ...filters, vendor_type: e.target.value })}
                className="form-input"
              >
                <option value="">All Types</option>
                <option value="LPR">LPR</option>
                <option value="Vendor">Vendor</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card">
        {error ? (
          <div className="text-center py-8 text-red-500">Failed to load Purchase Orders</div>
        ) : (
          <DataTable
            columns={columns}
            data={purchaseOrders}
            pagination={pagination}
            onPageChange={setCurrentPage}
            loading={isLoading}
            emptyMessage="No purchase orders found. Create your first PO to start procurement."
          />
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreatePurchaseOrderModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries(['purchase-orders']);
          }}
        />
      )}

      {showViewModal && selectedPO && (
        <ViewPurchaseOrderModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedPO(null);
          }}
          poId={selectedPO.po_id}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.action}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        confirmText={confirmState.confirmText}
        isLoading={approveMutation.isPending || cancelMutation.isPending || deleteMutation.isPending}
      />
    </div>
  );
};

export default PurchaseOrders;