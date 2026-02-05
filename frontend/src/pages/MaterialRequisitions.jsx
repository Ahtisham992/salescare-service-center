// frontend/src/pages/MaterialRequisitions.jsx (COMPLETE UPDATED VERSION)
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import requisitionService from '../services/requisitionService';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import CreateMRQSModal from '../components/requisitions/CreateMRQSModal';
import ApproveMRQSModal from '../components/requisitions/ApproveMRQSModal';
import CreateMRTSModal from '../components/requisitions/CreateMRTSModal';
import { toast } from 'react-hot-toast';
import { Plus, Eye, Box, RotateCcw, FileText } from 'lucide-react';
import { formatDate, getStatusColor } from '../utils/formatters';

const MaterialRequisitions = () => {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  
  // State
  const [activeTab, setActiveTab] = useState('mrqs'); // 'mrqs' or 'mrts'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [page, setPage] = useState(1);

  // Fetch MRQS
  const { data: mrqsData, isLoading: mrqsLoading } = useQuery({
    queryKey: ['mrqs-list', page],
    queryFn: () => requisitionService.getAllMRQS({ page, limit: 10 }),
    enabled: activeTab === 'mrqs'
  });

  // Fetch MRTS
  const { data: mrtsData, isLoading: mrtsLoading } = useQuery({
    queryKey: ['mrts-list', page],
    queryFn: async () => {
      try {
        const response = await fetch(`https://salescare-service-center.onrender.com/api/requisitions/mrts?page=${page}&limit=10`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch MRTS');
        return await response.json();
      } catch (error) {
        console.error('MRTS fetch error:', error);
        return { data: { mrts_list: [], pagination: {} } };
      }
    },
    enabled: activeTab === 'mrts'
  });

  // Issue mutation
  const issueMutation = useMutation({
    mutationFn: (id) => requisitionService.issueMRQS(id),
    onSuccess: () => {
      toast.success('Materials Issued');
      queryClient.invalidateQueries(['mrqs-list']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Issue failed')
  });

  // View MRQS Details
  const handleViewMRQS = async (mrqs) => {
    try {
      const response = await requisitionService.getMRQSById(mrqs.mrqs_id);
      setSelectedRequisition(response.data);
      setShowViewModal(true);
    } catch (error) {
      toast.error('Failed to load MRQS details');
    }
  };

  // View MRTS Details
  const handleViewMRTS = async (mrts) => {
    try {
      const response = await fetch(`https://salescare-service-center.onrender.com/api/requisitions/mrts/${mrts.mrts_id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch MRTS');
      const data = await response.json();
      setSelectedRequisition(data.data);
      setShowViewModal(true);
    } catch (error) {
      toast.error('Failed to load MRTS details');
    }
  };

  // MRQS Columns
  const mrqsColumns = [
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
          <button 
            onClick={() => handleViewMRQS(row)}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded border border-gray-200"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>

          {hasRole(['admin', 'manager']) && row.status === 'Pending' && (
            <button 
              onClick={() => {
                setSelectedRequisition(row);
                setShowApproveModal(true);
              }}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded border border-blue-200"
              title="Review & Approve"
            >
              <FileText className="w-4 h-4" />
            </button>
          )}

          {hasRole(['admin', 'manager']) && row.status === 'Approved' && (
            <button 
              onClick={() => issueMutation.mutate(row.mrqs_id)}
              className="p-2 text-green-600 hover:bg-green-50 rounded border border-green-200"
              title="Issue Materials"
            >
              <Box className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  // MRTS Columns
  const mrtsColumns = [
    {
      header: 'MRTS #',
      accessor: 'mrts_number',
      render: (row) => <span className="font-bold text-gray-900">{row.mrts_number}</span>
    },
    {
      header: 'Complaint',
      accessor: 'complaint_number',
      render: (row) => (
        <div>
          <div className="text-primary-700 font-medium">{row.complaint_number}</div>
          <div className="text-xs text-gray-500">{row.product_name || 'N/A'}</div>
        </div>
      )
    },
    {
      header: 'Technician',
      accessor: 'technician_name',
    },
    {
      header: 'Items',
      accessor: 'total_items',
      render: (row) => (
        <span className="text-gray-700">{row.total_items || 0} items</span>
      )
    },
    {
      header: 'Date',
      accessor: 'mrts_date',
      render: (row) => formatDate(row.mrts_date)
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <button 
          onClick={() => handleViewMRTS(row)}
          className="p-2 text-gray-600 hover:bg-gray-50 rounded border border-gray-200"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ];

  const currentData = activeTab === 'mrqs' ? mrqsData : mrtsData;
  const currentLoading = activeTab === 'mrqs' ? mrqsLoading : mrtsLoading;
  const currentList = activeTab === 'mrqs' 
    ? (currentData?.data?.mrqs_list || [])
    : (currentData?.data?.mrts_list || []);

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">Material Requisitions</h1>
          <p className="page-subtitle">Manage parts requests (MRQS) and returns (MRTS)</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setShowReturnModal(true)} 
            className="btn btn-outline flex items-center"
          >
            <RotateCcw className="w-4 h-4 mr-2" /> 
            New Return (MRTS)
          </button>

          <button 
            onClick={() => setShowCreateModal(true)} 
            className="btn btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" /> 
            New Request (MRQS)
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b">
        <button
          onClick={() => {
            setActiveTab('mrqs');
            setPage(1);
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'mrqs'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📦 Material Requests (MRQS)
        </button>
        <button
          onClick={() => {
            setActiveTab('mrts');
            setPage(1);
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'mrts'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🔄 Material Returns (MRTS)
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <DataTable 
          columns={activeTab === 'mrqs' ? mrqsColumns : mrtsColumns}
          data={currentList}
          pagination={currentData?.data?.pagination || {}}
          onPageChange={setPage}
          loading={currentLoading}
        />
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateMRQSModal 
          isOpen={showCreateModal} 
          onClose={() => setShowCreateModal(false)} 
        />
      )}

      {showApproveModal && selectedRequisition && (
        <ApproveMRQSModal
          isOpen={showApproveModal}
          onClose={() => {
            setShowApproveModal(false);
            setSelectedRequisition(null);
          }}
          mrqsId={selectedRequisition.mrqs_id}
        />
      )}

      {showReturnModal && (
        <CreateMRTSModal 
          isOpen={showReturnModal} 
          onClose={() => setShowReturnModal(false)} 
        />
      )}

      {/* Simple View Modal */}
      {showViewModal && selectedRequisition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {activeTab === 'mrqs' ? 'MRQS Details' : 'MRTS Details'}
            </h3>
            <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto">
              {JSON.stringify(selectedRequisition, null, 2)}
            </pre>
            <button 
              onClick={() => setShowViewModal(false)}
              className="mt-4 btn btn-primary w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialRequisitions;