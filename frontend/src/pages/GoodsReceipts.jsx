// frontend/src/pages/GoodsReceipts.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import goodsReceiptService from '../services/goodsReceiptService';
import DataTable from '../components/common/DataTable';
import CreateGoodsReceiptModal from '../components/goods-receipt/CreateGoodsReceiptModal';
import ViewGoodsReceiptModal from '../components/goods-receipt/ViewGoodsReceiptModal';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import {
  Search,
  Filter,
  X,
  Plus,
  Eye,
  Trash2,
  Package,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

const GoodsReceipts = () => {
  const { hasRole } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    po_id: '',
    area_id: '',
    date_from: '',
    date_to: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewGR, setViewGR] = useState(null);
  const [deleteGR, setDeleteGR] = useState(null);

  // Build query params
  const queryParams = {
    page: currentPage,
    limit: 10,
    ...(searchTerm && { search: searchTerm }),
    ...(filters.po_id && { po_id: filters.po_id }),
    ...(filters.area_id && { area_id: filters.area_id }),
    ...(filters.date_from && { date_from: filters.date_from }),
    ...(filters.date_to && { date_to: filters.date_to })
  };

  // Fetch goods receipts
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['goods-receipts', queryParams],
    queryFn: () => goodsReceiptService.getAll(queryParams)
  });

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
      po_id: '',
      area_id: '',
      date_from: '',
      date_to: ''
    });
    setSearchTerm('');
  };

  const handleDelete = async () => {
    try {
      await goodsReceiptService.delete(deleteGR.gr_id);
      toast.success('Goods receipt deleted successfully');
      setDeleteGR(null);
      refetch();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to delete goods receipt';
      toast.error(msg);
    }
  };

  // Table columns
  const columns = [
    {
      header: 'GR Number',
      accessor: 'gr_number',
      render: (row) => (
        <div className="flex items-center">
          <Package className="w-4 h-4 text-primary-600 mr-2" />
          <span className="font-medium text-gray-900">{row.gr_number}</span>
        </div>
      )
    },
    {
      header: 'PO Number',
      accessor: 'po_number',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.po_number}</div>
          <div className="text-sm text-gray-500">{formatDate(row.po_date)}</div>
        </div>
      )
    },
    {
      header: 'Vendor',
      accessor: 'vendor_name',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.vendor_name}</div>
          <div className="text-sm text-gray-500">{row.vendor_code}</div>
        </div>
      )
    },
    {
      header: 'GR Date',
      accessor: 'gr_date',
      render: (row) => formatDate(row.gr_date)
    },
    {
      header: 'Area',
      accessor: 'area_name'
    },
    {
      header: 'Items',
      accessor: 'items_count',
      render: (row) => (
        <span className="badge badge-info">{row.items_count} items</span>
      )
    },
    {
      header: 'Total Amount',
      accessor: 'total_amount',
      render: (row) => (
        <span className="font-medium text-gray-900">
          {formatCurrency(row.total_amount)}
        </span>
      )
    },
    {
      header: 'Received By',
      accessor: 'received_by_name',
      render: (row) => (
        <div className="text-sm text-gray-600">{row.received_by_name || 'N/A'}</div>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewGR(row)}
            className="btn-icon btn-icon-primary"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {hasRole(['admin']) && (
            <button
              onClick={() => setDeleteGR(row)}
              className="btn-icon btn-icon-danger"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  const goodsReceipts = data?.data?.goods_receipts || [];
  const pagination = data?.data?.pagination || {};

  // Calculate stats
  const totalGRs = pagination.total_items || 0;
  const totalValue = goodsReceipts.reduce((sum, gr) => sum + parseFloat(gr.total_amount || 0), 0);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">Goods Receipts</h1>
          <p className="page-subtitle">
            Receive goods against purchase orders and update inventory
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Goods Receipt
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total GRs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalGRs}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value (Current Page)</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(totalValue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {goodsReceipts.filter(gr => {
                  const grDate = new Date(gr.gr_date);
                  const now = new Date();
                  return grDate.getMonth() === now.getMonth() && 
                         grDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-info-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-info-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by GR#, PO#, or vendor..."
              value={searchTerm}
              onChange={handleSearch}
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

            {(Object.values(filters).some(v => v) || searchTerm) && (
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
              <label className="form-label">Date From</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Date To</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Area</label>
              <select
                value={filters.area_id}
                onChange={(e) => handleFilterChange('area_id', e.target.value)}
                className="form-input"
              >
                <option value="">All Areas</option>
                <option value="1">Rawalpindi</option>
                <option value="2">Islamabad</option>
                <option value="3">Lahore</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card">
        <DataTable
          columns={columns}
          data={goodsReceipts}
          pagination={pagination}
          onPageChange={setCurrentPage}
          loading={isLoading}
          emptyMessage="No goods receipts found."
        />
      </div>

      {/* Modals */}
      <CreateGoodsReceiptModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          refetch();
        }}
      />

      {viewGR && (
        <ViewGoodsReceiptModal
          isOpen={!!viewGR}
          onClose={() => setViewGR(null)}
          grId={viewGR.gr_id}
        />
      )}

      {deleteGR && (
        <ConfirmationModal
          isOpen={!!deleteGR}
          onClose={() => setDeleteGR(null)}
          onConfirm={handleDelete}
          title="Delete Goods Receipt"
          message={`Are you sure you want to delete GR ${deleteGR.gr_number}? This action cannot be undone and may affect inventory if transactions exist.`}
          confirmText="Delete"
          confirmButtonClass="btn-danger"
        />
      )}
    </div>
  );
};

export default GoodsReceipts;