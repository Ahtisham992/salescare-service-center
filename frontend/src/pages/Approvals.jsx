// frontend/src/pages/Approvals.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import approvalService from '../services/approvalService';
import purchaseService from '../services/purchaseService';
import requisitionService from '../services/requisitionService';
import DataTable from '../components/common/DataTable';
import ApproveMRQSModal from '../components/requisitions/ApproveMRQSModal';
import ApprovePOModal from '../components/purchase/ApprovePOModal'; // <--- NEW IMPORT
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import {
  CheckCircle,
  Clock,
  FileText,
  Package,
  Filter,
  Eye,
  TrendingUp,
  X
} from 'lucide-react';
import { formatDate, formatCurrency, getStatusColor } from '../utils/formatters';

const Approvals = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all'); // 'all', 'MRQS', 'PO'
  
  // Modal States
  const [showApproveMRQSModal, setShowApproveMRQSModal] = useState(false);
  const [selectedMRQS, setSelectedMRQS] = useState(null);
  
  const [showApprovePOModal, setShowApprovePOModal] = useState(false); // <--- NEW STATE
  const [selectedPO, setSelectedPO] = useState(null); // <--- NEW STATE

  // Fetch pending approvals
  const { data: approvalsData, isLoading } = useQuery({
    queryKey: ['pending-approvals', filter],
    queryFn: () => approvalService.getPendingApprovals(
      filter !== 'all' ? { document_type: filter } : {}
    )
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['approval-stats'],
    queryFn: approvalService.getApprovalStats
  });

  // Handler for MRQS
  const handleViewMRQS = (approval) => {
    setSelectedMRQS({ mrqs_id: approval.document_id });
    setShowApproveMRQSModal(true);
  };

  // Handler for PO - Opens Modal instead of auto-approving
  const handleViewPO = (approval) => {
    setSelectedPO({ po_id: approval.document_id });
    setShowApprovePOModal(true);
  };

  const columns = [
    {
      header: 'Type',
      accessor: 'document_type',
      render: (row) => (
        <div className="flex items-center">
          {row.document_type === 'MRQS' ? (
            <Package className="w-4 h-4 text-blue-600 mr-2" />
          ) : (
            <FileText className="w-4 h-4 text-purple-600 mr-2" />
          )}
          <span className={`badge ${
            row.document_type === 'MRQS' ? 'badge-info' : 'badge-primary'
          }`}>
            {row.document_type}
          </span>
        </div>
      )
    },
    {
      header: 'Document #',
      accessor: 'document_number',
      render: (row) => (
        <span className="font-medium text-gray-900">{row.document_number}</span>
      )
    },
    {
      header: 'Reference',
      accessor: 'reference',
      render: (row) => (
        <div className="text-sm text-gray-600">{row.reference}</div>
      )
    },
    {
      header: 'Requested By',
      accessor: 'requested_by_name'
    },
    {
      header: 'Date',
      accessor: 'document_date',
      render: (row) => formatDate(row.document_date)
    },
    {
      header: 'Amount',
      accessor: 'total_amount',
      render: (row) => (
        <div className="text-right font-semibold text-gray-900">
          {formatCurrency(row.total_amount)}
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <button
          onClick={() => {
            if (row.document_type === 'MRQS') {
              handleViewMRQS(row);
            } else if (row.document_type === 'PO') {
              handleViewPO(row); // <--- Updated to open modal
            }
          }}
          className="btn btn-sm btn-primary flex items-center"
        >
          <Eye className="w-4 h-4 mr-1" />
          Review
        </button>
      )
    }
  ];

  const pendingApprovals = approvalsData?.data?.pending_approvals || [];
  const stats = statsData?.data?.pending_by_type || [];
  const recentActions = statsData?.data?.recent_actions || [];

  const totalPending = stats.reduce((sum, s) => sum + parseInt(s.total_pending || 0), 0);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-6">
        <h1 className="page-title">Approvals Dashboard</h1>
        <p className="page-subtitle">Review and approve pending documents</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Pending</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalPending}</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </div>

        {stats.map((stat) => (
          <div key={stat.document_type} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.document_type}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.total_pending}
                </p>
              </div>
              <div className={`w-12 h-12 ${
                stat.document_type === 'MRQS' ? 'bg-blue-100' : 'bg-purple-100'
              } rounded-lg flex items-center justify-center`}>
                {stat.document_type === 'MRQS' ? (
                  <Package className={`w-6 h-6 ${
                    stat.document_type === 'MRQS' ? 'text-blue-600' : 'text-purple-600'
                  }`} />
                ) : (
                  <FileText className="w-6 h-6 text-purple-600" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filter by Type:</span>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({totalPending})
          </button>
          {stats.map((stat) => (
            <button
              key={stat.document_type}
              onClick={() => setFilter(stat.document_type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === stat.document_type
                  ? stat.document_type === 'MRQS' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {stat.document_type} ({stat.total_pending})
            </button>
          ))}
        </div>
      </div>

      {/* Pending Approvals Table */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Approvals</h2>
        <DataTable
          columns={columns}
          data={pendingApprovals}
          loading={isLoading}
          emptyMessage="No pending approvals. Great job!"
        />
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
          Recent Approval Activity
        </h2>
        <div className="space-y-3">
          {recentActions.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No recent activity</p>
          ) : (
            recentActions.map((action) => (
              <div
                key={action.approval_id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    action.action === 'Approved' ? 'bg-green-100' :
                    action.action === 'Rejected' ? 'bg-red-100' :
                    'bg-blue-100'
                  }`}>
                    {action.action === 'Approved' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : action.action === 'Rejected' ? (
                      <X className="w-5 h-5 text-red-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {action.document_number} {action.action}
                    </p>
                    <p className="text-xs text-gray-500">
                      by {action.performed_by_name} • {formatDate(action.performed_at)}
                    </p>
                  </div>
                </div>
                <span className={`badge badge-${getStatusColor(action.new_status)}`}>
                  {action.new_status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      {showApproveMRQSModal && selectedMRQS && (
        <ApproveMRQSModal
          isOpen={showApproveMRQSModal}
          onClose={() => {
            setShowApproveMRQSModal(false);
            setSelectedMRQS(null);
          }}
          mrqsId={selectedMRQS.mrqs_id}
        />
      )}

      {/* ✅ PO Approval Modal */}
      {showApprovePOModal && selectedPO && (
        <ApprovePOModal
          isOpen={showApprovePOModal}
          onClose={() => {
            setShowApprovePOModal(false);
            setSelectedPO(null);
          }}
          poId={selectedPO.po_id}
        />
      )}
    </div>
  );
};

export default Approvals;