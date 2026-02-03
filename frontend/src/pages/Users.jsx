// frontend/src/pages/Users.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import userService from '../services/userService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmationModal from '../components/common/ConfirmationModal';
import CreateUserModal from '../components/users/CreateUserModal';
import EditUserModal from '../components/users/EditUserModal';
import ResetPasswordModal from '../components/users/ResetPasswordModal';
import DataTable from '../components/common/DataTable'; // Ensure you use this
import { toast } from 'react-hot-toast';
import { 
  UserPlus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Key,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Shield
} from 'lucide-react';
import { formatDate } from '../utils/formatters';

const Users = () => {
  const queryClient = useQueryClient();

  // State
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    is_active: '',
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(1);

  // Fetch Users
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['users', page, filters],
    queryFn: () => userService.getAll({ page, limit: 10, ...filters }),
    keepPreviousData: true,
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => userService.delete(id),
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries(['users']);
      setShowDeleteModal(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
      setShowDeleteModal(false);
    },
  });

  // Handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      deleteMutation.mutate(selectedUser.user_id);
    }
  };

  // ✅ FIXED: Added 'className' to columns to distribute width evenly
  const columns = [
    { 
      header: 'User Info', 
      accessor: 'full_name',
      className: 'w-1/4', // 25% Width
      render: (user) => (
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold mr-3">
            {user.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-gray-900">{user.full_name}</div>
            <div className="text-xs text-gray-500">@{user.username}</div>
          </div>
        </div>
      )
    },
    { 
      header: 'Role', 
      accessor: 'role',
      className: 'w-1/6', // ~16% Width
      render: (user) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
          ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
            user.role === 'manager' ? 'bg-blue-100 text-blue-800' : 
            user.role === 'technician' ? 'bg-orange-100 text-orange-800' : 
            'bg-gray-100 text-gray-800'}`}>
          {user.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
          {user.role}
        </span>
      )
    },
    { 
      header: 'Contact', 
      accessor: 'email',
      className: 'w-1/4', // 25% Width
      render: (user) => (
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex items-center">
            <Mail className="w-3 h-3 mr-2 text-gray-400" />
            {user.email}
          </div>
          <div className="flex items-center">
            <Phone className="w-3 h-3 mr-2 text-gray-400" />
            {user.phone || 'N/A'}
          </div>
        </div>
      )
    },
    { 
      header: 'Status', 
      accessor: 'is_active',
      className: 'w-1/6 text-center', // Center align status
      render: (user) => (
        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium
          ${user.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {user.is_active ? <UserCheck className="w-3 h-3 mr-1" /> : <UserX className="w-3 h-3 mr-1" />}
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      className: 'w-1/6 text-right', // Push actions to right
      render: (user) => (
        <div className="flex justify-end space-x-2">
           <button 
             onClick={() => { setSelectedUser(user); setShowResetPasswordModal(true); }}
             className="p-1 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded"
             title="Reset Password"
           >
             <Key className="w-4 h-4" />
           </button>
           <button 
             onClick={() => { setSelectedUser(user); setShowEditModal(true); }}
             className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
             title="Edit User"
           >
             <Edit3 className="w-4 h-4" />
           </button>
           <button 
             onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
             className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
             title="Delete User"
           >
             <Trash2 className="w-4 h-4" />
           </button>
        </div>
      )
    }
  ];

  return (
    <div className="page-container w-full max-w-full"> {/* Ensure full width */}
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="page-title text-2xl font-bold text-gray-900">User Management</h1>
          <p className="page-subtitle text-gray-500">Manage system access, roles, and permissions</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)} 
          className="btn btn-primary flex items-center shadow-sm"
        >
          <UserPlus className="w-4 h-4 mr-2" /> 
          Add New User
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full md:w-auto">
          <input
            type="text"
            placeholder="Search users..."
            className="form-input pl-10 w-full"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            className="form-input w-full md:w-40"
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="technician">Technician</option>
            <option value="receptionist">Receptionist</option>
          </select>

          <select 
            className="form-input w-full md:w-40"
            value={filters.is_active}
            onChange={(e) => handleFilterChange('is_active', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          
          <button 
            onClick={() => setFilters({ search: '', role: '', is_active: '' })}
            className="btn btn-outline text-gray-600"
            title="Clear Filters"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table Card - Added overflow-hidden to contain table */}
      <div className="card w-full overflow-hidden shadow-sm border border-gray-200 rounded-lg">
        <DataTable 
          columns={columns} 
          data={data?.data?.users || []}
          pagination={data?.data?.pagination || {}}
          onPageChange={setPage}
          loading={isLoading}
        />
      </div>

      {/* Modals */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => refetch()}
      />

      <EditUserModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSuccess={() => refetch()}
      />

      <ResetPasswordModal
        isOpen={showResetPasswordModal}
        onClose={() => {
          setShowResetPasswordModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSuccess={() => refetch()}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        onConfirm={confirmDelete}
        title="Delete User"
        message={
          selectedUser ? (
            <div>
              <p>Are you sure you want to delete <strong>{selectedUser.full_name}</strong>?</p>
              <p className="mt-2 text-sm text-gray-600">
                This action cannot be undone. Consider deactivating the user instead.
              </p>
            </div>
          ) : null
        }
        confirmText="Delete User"
        confirmButtonClass="btn-danger"
      />
    </div>
  );
};

export default Users;