// ============================================
// 2. ComplaintTable.jsx
// ============================================
import React from 'react';
import DataTable from '../common/DataTable';
import { FileText, Eye, Edit, Trash2, UserCheck, Clock, Download } from 'lucide-react';
import { formatDate, formatRelativeTime, getStatusColor, getPriorityColor, getWarrantyColor } from '../../utils/formatters';

const ComplaintTable = ({
  complaints,
  pagination,
  loading,
  onPageChange,
  onView,
  onEdit,
  onAssign,
  onStatusChange,
  onDownload,
  onDelete,
  hasRole
}) => {
  const columns = [
    {
      header: "Complaint #",
      accessor: "complaint_number",
      render: (row) => (
        <div className="flex items-center">
          <FileText className="w-4 h-4 text-gray-400 mr-2" />
          <span className="font-medium text-gray-900">{row.complaint_number}</span>
        </div>
      ),
    },
    {
      header: "Customer",
      accessor: "customer_name",
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.customer_name}</div>
          <div className="text-sm text-gray-500">{row.customer_phone}</div>
        </div>
      ),
    },
    {
      header: "Product",
      accessor: "product_name",
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
      header: "Status",
      accessor: "status",
      render: (row) => (
        <span className={`badge badge-${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      ),
    },
    {
      header: "Priority",
      accessor: "priority",
      render: (row) => (
        <span className={`badge badge-${getPriorityColor(row.priority)}`}>
          {row.priority}
        </span>
      ),
    },
    {
      header: "Warranty",
      accessor: "warranty_status",
      render: (row) => (
        <span className={`badge badge-${getWarrantyColor(row.warranty_status)}`}>
          {row.warranty_status}
        </span>
      ),
    },
    {
      header: "Technician",
      accessor: "technician_name",
      render: (row) => (
        <div className="text-sm">
          {row.technician_name || (
            <span className="text-gray-400 italic">Not Assigned</span>
          )}
        </div>
      ),
    },
    {
      header: "Date",
      accessor: "complaint_date",
      render: (row) => (
        <div>
          <div className="text-sm text-gray-900">{formatDate(row.complaint_date)}</div>
          <div className="text-xs text-gray-500">{formatRelativeTime(row.complaint_date)}</div>
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onView(row)}
            className="p-2 text-primary-600 hover:bg-primary-50 rounded"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>

          {hasRole(["admin", "manager", "receptionist"]) && (
            <button
              onClick={() => onEdit(row)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
              title="Edit Complaint"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}

          {hasRole(["admin", "manager"]) && (
            <button
              onClick={() => onAssign(row)}
              className="p-2 text-green-600 hover:bg-green-50 rounded"
              title="Assign Technician"
            >
              <UserCheck className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onStatusChange(row)}
            className="p-2 text-purple-600 hover:bg-purple-50 rounded"
            title="Update Status"
          >
            <Clock className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDownload(row)}
            className="p-2 text-orange-600 hover:bg-orange-50 rounded"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>

          {hasRole(["admin"]) && (
            <button
              onClick={() => onDelete(row.complaint_id)}
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

  return (
    <div className="card">
      <DataTable
        columns={columns}
        data={complaints}
        pagination={pagination}
        onPageChange={onPageChange}
        loading={loading}
        emptyMessage="No complaints found. Create your first complaint to get started."
      />
    </div>
  );
};

export default ComplaintTable;