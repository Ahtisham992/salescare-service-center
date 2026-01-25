// frontend/src/pages/ComplaintAgingReport.jsx - FIXED VERSION
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import complaintService from '../services/complaintService'; // CHANGED: Use complaintService instead
import DataTable from '../components/common/DataTable';
import ReportCard from '../components/reports/ReportCard';
import { ArrowLeft, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import { formatDate, formatRelativeTime, getStatusColor, getPriorityColor } from '../utils/formatters';
import { exportToCSV, generateFilename } from '../utils/exportHelpers';
import toast from 'react-hot-toast';

const ComplaintAgingReport = () => {
  const navigate = useNavigate();
  const [ageThreshold, setAgeThreshold] = useState(7); // days

  // FIXED: Fetch ALL active complaints directly
  const { data, isLoading } = useQuery({
    queryKey: ['complaint-aging', ageThreshold],
    queryFn: async () => {
      // Fetch all active complaints (no status filter to get ALL)
      const result = await complaintService.getAll({
        limit: 1000, // Large limit to get all complaints
        page: 1
      });
      
      const complaints = result?.data?.complaints || [];
      
      // Filter only active complaints and calculate aging
      const now = new Date();
      
      return complaints
        .filter(c => ['Open', 'Assigned', 'In Progress'].includes(c.status))
        .map(complaint => {
          const created = new Date(complaint.complaint_date);
          const ageInDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
          const ageInHours = Math.floor((now - created) / (1000 * 60 * 60));
          
          return {
            ...complaint,
            age_days: ageInDays,
            age_hours: ageInHours,
            is_overdue: ageInDays > ageThreshold,
          };
        })
        .sort((a, b) => b.age_days - a.age_days);
    },
  });

  const complaints = data || [];
  const overdueComplaints = complaints.filter(c => c.is_overdue);
  const criticalOverdue = complaints.filter(c => c.is_overdue && c.priority === 'Critical');
  const avgAge = complaints.length > 0
    ? Math.round(complaints.reduce((sum, c) => sum + c.age_days, 0) / complaints.length)
    : 0;

  // Group by age bracket
  const ageBrackets = {
    '0-3 days': complaints.filter(c => c.age_days <= 3).length,
    '4-7 days': complaints.filter(c => c.age_days > 3 && c.age_days <= 7).length,
    '8-14 days': complaints.filter(c => c.age_days > 7 && c.age_days <= 14).length,
    '15-30 days': complaints.filter(c => c.age_days > 14 && c.age_days <= 30).length,
    '30+ days': complaints.filter(c => c.age_days > 30).length,
  };

  // Group by technician
  const byTechnician = complaints.reduce((acc, complaint) => {
    const tech = complaint.technician_name || 'Unassigned';
    if (!acc[tech]) {
      acc[tech] = {
        name: tech,
        total: 0,
        overdue: 0,
        avg_age: 0,
        ages: []
      };
    }
    acc[tech].total++;
    if (complaint.is_overdue) acc[tech].overdue++;
    acc[tech].ages.push(complaint.age_days);
    return acc;
  }, {});

  // Calculate averages
  Object.values(byTechnician).forEach(tech => {
    tech.avg_age = tech.ages.length > 0 
      ? Math.round(tech.ages.reduce((sum, age) => sum + age, 0) / tech.ages.length)
      : 0;
  });

  const technicianData = Object.values(byTechnician).sort((a, b) => b.overdue - a.overdue);

  const handleExport = () => {
    if (complaints.length === 0) {
      toast.error('No data to export');
      return;
    }

    const exportData = complaints.map(c => ({
      'Complaint #': c.complaint_number,
      'Customer': c.customer_name,
      'Product': c.product_name,
      'Status': c.status,
      'Priority': c.priority,
      'Age (Days)': c.age_days,
      'Technician': c.technician_name || 'Unassigned',
      'Created Date': formatDate(c.complaint_date),
    }));
    
    exportToCSV(exportData, generateFilename('complaint_aging_report'));
    toast.success('Report exported successfully');
  };

  const columns = [
    {
      header: 'Complaint #',
      accessor: 'complaint_number',
      render: (row) => (
        <div className="flex items-center">
          <AlertCircle className={`w-4 h-4 mr-2 ${row.is_overdue ? 'text-danger-600' : 'text-gray-400'}`} />
          <span className="font-medium text-gray-900">{row.complaint_number}</span>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: 'customer_name',
    },
    {
      header: 'Product',
      accessor: 'product_name',
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
      header: 'Age',
      accessor: 'age_days',
      render: (row) => (
        <div>
          <div className={`font-bold ${row.is_overdue ? 'text-danger-600' : 'text-gray-900'}`}>
            {row.age_days} days
          </div>
          <div className="text-xs text-gray-500">{row.age_hours}h</div>
        </div>
      ),
    },
    {
      header: 'Technician',
      accessor: 'technician_name',
      render: (row) => (
        <span className={!row.technician_name ? 'text-gray-400 italic' : 'text-gray-900'}>
          {row.technician_name || 'Not Assigned'}
        </span>
      ),
    },
    {
      header: 'Created',
      accessor: 'complaint_date',
      render: (row) => (
        <div>
          <div className="text-sm text-gray-900">{formatDate(row.complaint_date)}</div>
          <div className="text-xs text-gray-500">{formatRelativeTime(row.complaint_date)}</div>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/reports')}
          className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="page-title">Complaint Aging Report</h1>
          <p className="page-subtitle">
            Track open complaints and identify overdue items
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total Active</span>
            <Clock className="w-5 h-5 text-primary-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{complaints.length}</div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Overdue</span>
            <AlertCircle className="w-5 h-5 text-danger-600" />
          </div>
          <div className="text-3xl font-bold text-danger-600">{overdueComplaints.length}</div>
          <div className="text-xs text-gray-500 mt-1">
            &gt; {ageThreshold} days
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Critical Overdue</span>
            <TrendingUp className="w-5 h-5 text-warning-600" />
          </div>
          <div className="text-3xl font-bold text-warning-600">{criticalOverdue.length}</div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Avg Age</span>
            <Clock className="w-5 h-5 text-gray-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{avgAge}</div>
          <div className="text-xs text-gray-500 mt-1">days</div>
        </div>
      </div>

      {/* Age Threshold Selector */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div>
            <label className="form-label">Overdue Threshold (Days)</label>
            <p className="text-sm text-gray-600">
              Complaints older than this will be marked as overdue
            </p>
          </div>
          <select
            value={ageThreshold}
            onChange={(e) => setAgeThreshold(parseInt(e.target.value))}
            className="form-input w-32"
          >
            <option value="3">3 days</option>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
          </select>
        </div>
      </div>

      {/* Age Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ReportCard
          title="Age Distribution"
          description="Complaints grouped by age"
          loading={isLoading}
        >
          <div className="space-y-3">
            {Object.entries(ageBrackets).map(([bracket, count]) => (
              <div key={bracket} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">{bracket}</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className={`h-2 rounded-full ${
                        bracket === '30+ days' ? 'bg-danger-600' :
                        bracket === '15-30 days' ? 'bg-warning-600' :
                        'bg-primary-600'
                      }`}
                      style={{ width: complaints.length > 0 ? `${(count / complaints.length) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="font-bold text-gray-900 w-12 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </ReportCard>

        <ReportCard
          title="By Technician"
          description="Overdue complaints per technician"
          loading={isLoading}
        >
          {technicianData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No technician data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {technicianData.slice(0, 5).map((tech) => (
                <div key={tech.name} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{tech.name}</span>
                    <span className={`font-bold ${tech.overdue > 0 ? 'text-danger-600' : 'text-gray-900'}`}>
                      {tech.overdue} overdue
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Total: {tech.total}</span>
                    <span>Avg Age: {tech.avg_age} days</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ReportCard>
      </div>

      {/* Complaints Table */}
      <ReportCard
        title="Active Complaints"
        description={`All open and in-progress complaints sorted by age (${complaints.length} total)`}
        loading={isLoading}
        onExport={handleExport}
      >
        {complaints.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Complaints</h3>
            <p className="text-gray-600">
              There are currently no open, assigned, or in-progress complaints.
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={complaints}
            loading={isLoading}
            emptyMessage="No active complaints found"
          />
        )}
      </ReportCard>
    </div>
  );
};

export default ComplaintAgingReport;