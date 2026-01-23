import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import requisitionService from '../services/requisitionService';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import CreateMRQSModal from '../components/requisitions/CreateMRQSModal';
import { toast } from 'react-hot-toast';
import { Plus, Check, X, Box, FileText } from 'lucide-react';
import { formatDate, getStatusColor } from '../utils/formatters';

const MaterialRequisitions = () => {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['mrqs-list', page],
    queryFn: () => requisitionService.getAllMRQS({ page, limit: 10 })
  });

  const approveMutation = useMutation({
    mutationFn: (id) => requisitionService.approveMRQS(id),
    onSuccess: () => {
      toast.success('MRQS Approved');
      queryClient.invalidateQueries(['mrqs-list']);
    }
  });

  const issueMutation = useMutation({
    mutationFn: (id) => requisitionService.issueMRQS(id),
    onSuccess: () => {
      toast.success('Materials Issued');
      queryClient.invalidateQueries(['mrqs-list']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Issue failed')
  });

  const columns = [
    {
      header: 'MRQS #',
      accessor: 'mrqs_number',
      render: (row) => <span className="font-bold text-gray-900">{row.mrqs_number}</span>
    },
    {
      header: 'Complaint',
      accessor: 'complaint_number',
      render: (row) => (
        <div>
          <div className="text-primary-700 font-medium">{row.complaint_number}</div>
          <div className="text-xs text-gray-500">{row.product_name}</div>
        </div>
      )
    },
    {
      header: 'Technician',
      accessor: 'technician_name',
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
      header: 'Date',
      accessor: 'mrqs_date',
      render: (row) => formatDate(row.mrqs_date)
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex gap-2">
          {/* Approve Button (Admin/Manager + Pending) */}
          {hasRole(['admin', 'manager']) && row.status === 'Pending' && (
            <button 
              onClick={() => approveMutation.mutate(row.mrqs_id)}
              className="p-1 text-green-600 hover:bg-green-50 rounded border border-green-200"
              title="Approve"
            >
              <Check className="w-4 h-4" />
            </button>
          )}

          {/* Issue Button (Admin/Manager + Approved) */}
          {hasRole(['admin', 'manager']) && row.status === 'Approved' && (
            <button 
              onClick={() => issueMutation.mutate(row.mrqs_id)}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded border border-blue-200 flex items-center gap-1 px-2"
              title="Issue Materials"
            >
              <Box className="w-4 h-4" /> Issue
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">Material Requisitions (MRQS)</h1>
          <p className="page-subtitle">Manage parts requests for complaints</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary flex items-center">
          <Plus className="w-4 h-4 mr-2" /> New MRQS
        </button>
      </div>

      <div className="card">
        <DataTable 
          columns={columns} 
          data={data?.data?.mrqs_list || []}
          pagination={data?.data?.pagination || {}}
          onPageChange={setPage}
          loading={isLoading}
        />
      </div>

      {showCreateModal && (
        <CreateMRQSModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
};

export default MaterialRequisitions;