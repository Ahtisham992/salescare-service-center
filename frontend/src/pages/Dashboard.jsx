// frontend/src/pages/Dashboard.jsx - ENHANCED VERSION
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import reportService from '../services/reportService';
import LoadingSpinner, { CardSkeleton } from '../components/common/LoadingSpinner';
import StatCard from '../components/dashboard/StatCard';
import ComplaintTrendChart from '../components/dashboard/ComplaintTrendChart';
import RevenueChart from '../components/dashboard/RevenueChart';
import WarrantyPieChart from '../components/dashboard/WarrantyPieChart';
import QuickStats from '../components/dashboard/QuickStats';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Package,
  AlertCircle,
  Users,
  TrendingUp,
  Calendar,
  Filter,
} from 'lucide-react';
import { formatCurrency, formatNumber, formatRelativeTime, getStatusColor } from '../utils/formatters';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const [dateRange, setDateRange] = useState('30'); // days
  const [chartType, setChartType] = useState('line');

  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => reportService.getDashboardStats(),
  });

  // Fetch complaint trends
  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ['complaintTrends', dateRange],
    queryFn: () => reportService.getComplaintTrends({ 
      group_by: 'day',
      date_from: getDateFrom(dateRange),
    }),
    enabled: true,
  });

  // Fetch warranty analysis
  const { data: warrantyData, isLoading: warrantyLoading } = useQuery({
    queryKey: ['warrantyAnalysis'],
    queryFn: () => reportService.getWarrantyAnalysis(),
    enabled: true,
  });

  // Fetch revenue report (admin/manager only)
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenueReport', dateRange],
    queryFn: () => reportService.getRevenueReport({ 
      group_by: 'day',
      date_from: getDateFrom(dateRange),
    }),
    enabled: hasRole(['admin', 'manager']),
  });

  // Helper function to calculate date from
  function getDateFrom(days) {
    const date = new Date();
    date.setDate(date.getDate() - parseInt(days));
    return date.toISOString().split('T')[0];
  }

  const stats = statsData?.data || {};
  const complaints = stats.complaints || {};
  const revenue = stats.revenue || {};
  const inventory = stats.inventory || {};

  if (statsLoading) {
    return (
      <div className="page-container">
        <div className="page-header mb-6">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2 skeleton"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 skeleton"></div>
        </div>
        <CardSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back, <span className="font-medium">{user?.full_name}</span>! 
            Here's what's happening with your service center.
          </p>
        </div>
        
        {/* Date Range Filter */}
        <div className="mt-4 md:mt-0 flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setDateRange('7')}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                dateRange === '7' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              7D
            </button>
            <button
              onClick={() => setDateRange('30')}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                dateRange === '30' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              30D
            </button>
            <button
              onClick={() => setDateRange('90')}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                dateRange === '90' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              90D
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mb-8">
        <QuickStats stats={stats} />
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Complaints"
          value={formatNumber(complaints.total)}
          change="+12%"
          changeType="positive"
          icon={FileText}
          iconBg="bg-primary-100"
          iconColor="text-primary-600"
          onClick={() => window.location.href = '/complaints'}
        />

        <StatCard
          title="Active Complaints"
          value={formatNumber(complaints.active)}
          subtitle={`${complaints.in_progress || 0} in progress`}
          icon={Clock}
          iconBg="bg-warning-100"
          iconColor="text-warning-600"
          onClick={() => window.location.href = '/complaints?status=active'}
        />

        <StatCard
          title="Completed Today"
          value={formatNumber(complaints.today)}
          change="+8%"
          changeType="positive"
          icon={CheckCircle}
          iconBg="bg-success-100"
          iconColor="text-success-600"
        />

        {hasRole(['admin', 'manager']) && revenue && (
          <StatCard
            title="Revenue (30 days)"
            value={formatCurrency(revenue.total_revenue || 0)}
            subtitle={`${revenue.invoice_count || 0} invoices`}
            change="+15%"
            changeType="positive"
            icon={DollarSign}
            iconBg="bg-primary-100"
            iconColor="text-primary-600"
            onClick={() => window.location.href = '/invoices'}
          />
        )}

        {!hasRole(['admin', 'manager']) && (
          <StatCard
            title="My Complaints"
            value={formatNumber(complaints.total)}
            subtitle={`${complaints.completed || 0} completed`}
            icon={Users}
            iconBg="bg-gray-100"
            iconColor="text-gray-600"
          />
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Complaint Trends */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Complaint Trends</h3>
              <p className="text-sm text-gray-600 mt-1">
                Last {dateRange} days overview
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setChartType('line')}
                className={`p-2 rounded ${chartType === 'line' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
                title="Line Chart"
              >
                <TrendingUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`p-2 rounded ${chartType === 'area' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
                title="Area Chart"
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>
          </div>
          {trendsLoading ? (
            <div className="h-64 flex items-center justify-center">
              <LoadingSpinner size="md" />
            </div>
          ) : (
            <ComplaintTrendChart 
              data={trendsData?.data?.trends} 
              type={chartType}
            />
          )}
        </div>

        {/* Warranty Distribution */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Warranty Distribution</h3>
              <p className="text-sm text-gray-600 mt-1">
                Breakdown by warranty status
              </p>
            </div>
          </div>
          {warrantyLoading ? (
            <div className="h-64 flex items-center justify-center">
              <LoadingSpinner size="md" />
            </div>
          ) : (
            <WarrantyPieChart data={warrantyData?.data?.warranty_analysis} />
          )}
        </div>
      </div>

      {/* Revenue Chart (Admin/Manager only) */}
      {hasRole(['admin', 'manager']) && (
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Revenue Analysis</h3>
              <p className="text-sm text-gray-600 mt-1">
                Sales performance over time
              </p>
            </div>
          </div>
          {revenueLoading ? (
            <div className="h-64 flex items-center justify-center">
              <LoadingSpinner size="md" />
            </div>
          ) : (
            <RevenueChart data={revenueData?.data?.time_series} />
          )}
        </div>
      )}

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Complaints */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-primary-600" />
              Recent Complaints
            </h3>
            <a 
              href="/complaints" 
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center"
            >
              View All
              <TrendingUp className="w-4 h-4 ml-1" />
            </a>
          </div>
          <div className="space-y-3">
            {stats.recent_complaints && stats.recent_complaints.length > 0 ? (
              stats.recent_complaints.map((complaint) => (
                <div
                  key={complaint.complaint_id}
                  className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/complaints/${complaint.complaint_id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900 truncate">
                        {complaint.complaint_number}
                      </p>
                      <span className={`badge badge-${getStatusColor(complaint.status)} ml-2`}>
                        {complaint.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{complaint.customer_name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500 truncate">{complaint.product_name}</p>
                      <p className="text-xs text-gray-400">
                        {formatRelativeTime(complaint.complaint_date)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No recent complaints</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Invoices or Inventory Alert */}
        {hasRole(['admin', 'manager', 'receptionist']) && stats.recent_invoices ? (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-success-600" />
                Recent Invoices
              </h3>
              <a 
                href="/invoices" 
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center"
              >
                View All
                <TrendingUp className="w-4 h-4 ml-1" />
              </a>
            </div>
            <div className="space-y-3">
              {stats.recent_invoices.length > 0 ? (
                stats.recent_invoices.map((invoice) => (
                  <div
                    key={invoice.invoice_id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/invoices/${invoice.invoice_id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{invoice.invoice_number}</p>
                      <p className="text-sm text-gray-600 truncate">{invoice.customer_name}</p>
                      <p className="text-xs text-gray-500 mt-1">{invoice.invoice_type}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(invoice.net_amount)}
                      </p>
                      <span className={`badge badge-${getStatusColor(invoice.status)} mt-1`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No recent invoices</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Package className="w-5 h-5 mr-2 text-warning-600" />
                Inventory Alerts
              </h3>
              <a 
                href="/inventory" 
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View All
              </a>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-warning-50 rounded-lg border border-warning-200">
                <div className="flex items-center">
                  <AlertCircle className="w-10 h-10 text-warning-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Low Stock Items</p>
                    <p className="text-sm text-gray-600">
                      {inventory.low_stock_items || 0} items need restocking
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-warning-600">
                  {inventory.low_stock_items || 0}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {inventory.total_items || 0}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Quantity</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatNumber(inventory.total_quantity || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;