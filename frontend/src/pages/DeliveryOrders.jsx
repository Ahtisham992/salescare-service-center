// frontend/src/pages/DeliveryOrders.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import deliveryService from '../services/deliveryService';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import CreateDeliveryOrderModal from '../components/delivery/CreateDeliveryOrderModal';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { toast } from 'react-hot-toast';
import { 
  Plus, Search, Truck, Ban, Trash2, CheckCircle 
} from 'lucide-react';
import { formatDate, formatCurrency, getStatusColor } from '../utils/formatters';

const DeliveryOrders = () => {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Confirmation State
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    action: null
  });

  // Queries
  const { data, isLoading, error } = useQuery({
    queryKey: ['delivery-orders', currentPage, searchTerm],
    queryFn: () => deliveryService.getAll({ page: currentPage, limit: 10, search: searchTerm })
  });

  // Mutations
  const deliverMutation = useMutation({
    mutationFn: (id) => deliveryService.markAsDelivered(id),
    onSuccess: () => {
      toast.success('Order marked as Delivered & Stock Updated');
      queryClient.invalidateQueries(['delivery-orders']);
      setConfirmState(prev => ({ ...prev, isOpen: false }));
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Action failed')
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => deliveryService.cancel(id),
    onSuccess: () => {
      toast.success('Order Cancelled');
      queryClient.invalidateQueries(['delivery-orders']);
      setConfirmState(prev => ({ ...prev, isOpen: false }));
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Action failed')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deliveryService.delete(id),
    onSuccess: () => {
      toast.success('Order Deleted');
      queryClient.invalidateQueries(['delivery-orders']);
      setConfirmState(prev => ({ ...prev, isOpen: false }));
    }
  });

  // Action Handlers
  const handleDeliver = (id) => {
    setConfirmState({
      isOpen: true,
      type: 'success',
      title: 'Confirm Delivery',
      message: 'This will deduct items from inventory and mark the order as delivered. Continue?',
      confirmText: 'Confirm Delivery',
      action: () => deliverMutation.mutate(id)
    });
  };

  const handleCancel = (id) => {
    setConfirmState({
      isOpen: true,
      type: 'warning',
      title: 'Cancel Order',
      message: 'Are you sure you want to cancel this order?',
      confirmText: 'Cancel Order',
      action: () => cancelMutation.mutate(id)
    });
  };

  const handleDelete = (id) => {
    setConfirmState({
      isOpen: true,
      type: 'danger',
      title: 'Delete Order',
      message: 'Are you sure? This cannot be undone.',
      confirmText: 'Delete',
      action: () => deleteMutation.mutate(id)
    });
  };

  const columns = [
    {
      header: 'DO Number',
      accessor: 'do_number',
      render: (row) => <span className="font-medium text-gray-900">{row.do_number}</span>
    },
    {
      header: 'Customer',
      accessor: 'customer_name',
      render: (row) => (
        <div>
          <div className="text-gray-900 font-medium">{row.customer_name}</div>
          <div className="text-xs text-gray-500">{row.phone}</div>
        </div>
      )
    },
    {
      header: 'Date',
      accessor: 'do_date',
      render: (row) => formatDate(row.do_date)
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
      header: 'Total',
      accessor: 'total_amount',
      render: (row) => formatCurrency(row.total_amount)
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          {/* Pending Actions */}
          {row.status === 'Pending' && (
            <>
              <button 
                onClick={() => handleDeliver(row.do_id)} 
                className="p-2 text-green-600 hover:bg-green-50 rounded" 
                title="Mark as Delivered"
              >
                <Truck className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleCancel(row.do_id)} 
                className="p-2 text-orange-600 hover:bg-orange-50 rounded" 
                title="Cancel Order"
              >
                <Ban className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Delivered Status */}
          {row.status === 'Delivered' && (
            <span className="flex items-center text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded border border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              Ready
            </span>
          )}

          {/* Admin Delete */}
          {hasRole(['admin']) && (
            <button 
              onClick={() => handleDelete(row.do_id)} 
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

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">Delivery Orders</h1>
          <p className="page-subtitle">Manage counter sales and inventory issues</p>
        </div>
        {/* Only Admin, Manager, Receptionist can Create */}
        {hasRole(['admin', 'manager', 'receptionist']) && (
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary flex items-center">
            <Plus className="w-4 h-4 mr-2" /> New Order
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          <input 
            className="form-input pl-10" 
            placeholder="Search DO # or Customer Name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {error ? (
          <div className="text-center py-8 text-red-500">Failed to load Delivery Orders</div>
        ) : (
          <DataTable 
            columns={columns} 
            data={data?.data?.delivery_orders || []} 
            pagination={data?.data?.pagination || {}} 
            onPageChange={setCurrentPage}
            loading={isLoading}
            emptyMessage="No delivery orders found."
          />
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateDeliveryOrderModal 
          isOpen={showCreateModal} 
          onClose={() => setShowCreateModal(false)} 
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
        isLoading={deliverMutation.isPending || cancelMutation.isPending || deleteMutation.isPending}
      />
    </div>
  );
};

export default DeliveryOrders;