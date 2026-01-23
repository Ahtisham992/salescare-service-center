// frontend/src/pages/Vendors.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import vendorService from '../services/vendorService';
import DataTable from '../components/common/DataTable';
import CreateVendorModal from '../components/vendors/CreateVendorModal';
import EditVendorModal from '../components/vendors/EditVendorModal';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import {
  Search,
  Filter,
  X,
  Plus,
  Edit,
  Trash2,
  Building,
  TrendingUp,
  Users,
  CheckCircle
} from 'lucide-react';

const Vendors = () => {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    vendor_type: '',
    is_active: 'true'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [deleteVendor, setDeleteVendor] = useState(null);

  // Build query params
  const queryParams = {
    ...(searchTerm && { search: searchTerm }),
    ...(filters.vendor_type && { vendor_type: filters.vendor_type }),
    ...(filters.is_active && { is_active: filters.is_active })
  };

  // Fetch vendors
  const { data, isLoading } = useQuery({
    queryKey: ['vendors', queryParams],
    queryFn: () => vendorService.getAll(queryParams)
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => 
      vendorService.update(id, { is_active }),
    onSuccess: () => {
      toast.success('Vendor status updated');
      queryClient.invalidateQueries(['vendors']);
    },
    onError: () => {
      toast.error('Failed to update vendor status');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => vendorService.delete(id),
    onSuccess: () => {
      toast.success('Vendor deleted successfully');
      setDeleteVendor(null);
      queryClient.invalidateQueries(['vendors']);
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Failed to delete vendor';
      toast.error(msg);
    }
  });

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      vendor_type: '',
      is_active: 'true'
    });
    setSearchTerm('');
  };

  const handleToggleActive = (vendor) => {
    toggleActiveMutation.mutate({
      id: vendor.vendor_id,
      is_active: !vendor.is_active
    });
  };

  // Table columns
  const columns = [
    {
      header: 'Vendor Code',
      accessor: 'vendor_code',
      render: (row) => (
        <div className="flex items-center">
          <Building className="w-4 h-4 text-primary-600 mr-2" />
          <span className="font-medium text-gray-900">{row.vendor_code}</span>
        </div>
      )
    },
    {
      header: 'Vendor Name',
      accessor: 'vendor_name',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.vendor_name}</div>
          {row.contact_person && (
            <div className="text-sm text-gray-500">Contact: {row.contact_person}</div>
          )}
        </div>
      )
    },
    {
      header: 'Type',
      accessor: 'vendor_type',
      render: (row) => (
        <span className={`badge ${
          row.vendor_type === 'LPR' ? 'badge-primary' : 'badge-info'
        }`}>
          {row.vendor_type}
        </span>
      )
    },
    {
      header: 'Contact',
      accessor: 'phone',
      render: (row) => (
        <div className="text-sm">
          {row.phone && <div className="text-gray-900">{row.phone}</div>}
          {row.email && <div className="text-gray-500">{row.email}</div>}
        </div>
      )
    },
    {
      header: 'Address',
      accessor: 'address',
      render: (row) => (
        <div className="text-sm text-gray-600 max-w-xs truncate">
          {row.address || '-'}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'is_active',
      render: (row) => (
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={row.is_active}
            onChange={() => handleToggleActive(row)}
            className="sr-only peer"
            disabled={!hasRole(['admin', 'manager'])}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
        </label>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          {hasRole(['admin', 'manager']) && (
            <>
              <button
                onClick={() => setEditVendor(row)}
                className="btn-icon btn-icon-warning"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleteVendor(row)}
                className="btn-icon btn-icon-danger"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  const vendors = data?.data?.vendors || [];
  
  // Calculate stats
  const totalVendors = vendors.length;
  const activeVendors = vendors.filter(v => v.is_active).length;
  const lprVendors = vendors.filter(v => v.vendor_type === 'LPR').length;
  const regularVendors = vendors.filter(v => v.vendor_type === 'Vendor').length;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">Vendor Management</h1>
          <p className="page-subtitle">
            Manage suppliers and local purchase requisitions
          </p>
        </div>
        {hasRole(['admin', 'manager']) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Vendor
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Vendors</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalVendors}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-success-600 mt-1">{activeVendors}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">LPR</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{lprVendors}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Regular</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{regularVendors}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
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
              placeholder="Search by name, code, or contact..."
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

            {(Object.values(filters).some(v => v && v !== 'true') || searchTerm) && (
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
              <label className="form-label">Vendor Type</label>
              <select
                value={filters.vendor_type}
                onChange={(e) => handleFilterChange('vendor_type', e.target.value)}
                className="form-input"
              >
                <option value="">All Types</option>
                <option value="LPR">LPR (Local Purchase Requisition)</option>
                <option value="Vendor">Regular Vendor</option>
              </select>
            </div>

            <div>
              <label className="form-label">Status</label>
              <select
                value={filters.is_active}
                onChange={(e) => handleFilterChange('is_active', e.target.value)}
                className="form-input"
              >
                <option value="">All Status</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card">
        <DataTable
          columns={columns}
          data={vendors}
          loading={isLoading}
          emptyMessage="No vendors found."
        />
      </div>

      {/* Modals */}
      <CreateVendorModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {editVendor && (
        <EditVendorModal
          isOpen={!!editVendor}
          onClose={() => setEditVendor(null)}
          vendor={editVendor}
        />
      )}

      {deleteVendor && (
        <ConfirmationModal
          isOpen={!!deleteVendor}
          onClose={() => setDeleteVendor(null)}
          onConfirm={() => deleteMutation.mutate(deleteVendor.vendor_id)}
          title="Delete Vendor"
          message={`Are you sure you want to delete vendor "${deleteVendor.vendor_name}"? This action cannot be undone.`}
          confirmText="Delete"
          confirmButtonClass="btn-danger"
        />
      )}
    </div>
  );
};

export default Vendors;