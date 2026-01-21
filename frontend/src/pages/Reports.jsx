// frontend/src/pages/Reports.jsx - COMPLETE VERSION
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import reportService from '../services/reportService';
import ReportFilters from '../components/reports/ReportFilters';
import ReportCard from '../components/reports/ReportCard';
import ComplaintTrendChart from '../components/dashboard/ComplaintTrendChart';
import RevenueChart from '../components/dashboard/RevenueChart';
import WarrantyPieChart from '../components/dashboard/WarrantyPieChart';
import DataTable from '../components/common/DataTable';
import toast from 'react-hot-toast';
import { 
  FileText, 
  DollarSign, 
  Users, 
  Package,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { 
  formatCurrency, 
  formatNumber, 
  formatDate,
  getStatusColor 
} from '../utils/formatters';
import { exportToCSV, generateFilename } from '../utils/exportHelpers';

const Reports = () => {
  const [activeReport, setActiveReport] = useState('complaints');
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    area_id: '',
    status: '',
    warranty_status: '',
    group_by: 'day',
  });
  const [appliedFilters, setAppliedFilters] = useState({});

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      date_from: '',
      date_to: '',
      area_id: '',
      status: '',
      warranty_status: '',
      group_by: 'day',
    };
    setFilters(clearedFilters);
    setAppliedFilters(clearedFilters);
  };

  // Report types
  const reportTypes = [
    {
      id: 'complaints',
      name: 'Complaint Summary',
      icon: FileText,
      color: 'primary',
    },
    {
      id: 'revenue',
      name: 'Revenue Analysis',
      icon: DollarSign,
      color: 'success',
    },
    {
      id: 'technician',
      name: 'Technician Performance',
      icon: Users,
      color: 'info',
    },
    {
      id: 'inventory',
      name: 'Inventory Status',
      icon: Package,
      color: 'warning',
    },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header mb-6">
        <h1 className="page-title">Reports & Analytics</h1>
        <p className="page-subtitle">
          Comprehensive business intelligence and performance reports
        </p>
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          const isActive = activeReport === report.id;
          
          return (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className={`card p-4 text-left transition-all ${
                isActive 
                  ? 'ring-2 ring-primary-600 bg-primary-50' 
                  : 'hover:shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-10 h-10 bg-${report.color}-100 rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 text-${report.color}-600`} />
                </div>
                {isActive && (
                  <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                )}
              </div>
              <p className="font-medium text-gray-900">{report.name}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <ReportFilters
        filters={filters}
        onChange={setFilters}
        onClear={handleClearFilters}
        onApply={handleApplyFilters}
      />

      {/* Report Content */}
      {activeReport === 'complaints' && (
        <ComplaintReport filters={appliedFilters} />
      )}
      {activeReport === 'revenue' && (
        <RevenueReport filters={appliedFilters} />
      )}
      {activeReport === 'technician' && (
        <TechnicianReport filters={appliedFilters} />
      )}
      {activeReport === 'inventory' && (
        <InventoryReport filters={appliedFilters} />
      )}
    </div>
  );
};

// ============================================
// COMPLAINT REPORT
// ============================================
const ComplaintReport = ({ filters }) => {
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['complaint-summary', filters],
    queryFn: () => reportService.getComplaintSummary(filters),
  });

  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ['complaint-trends', filters],
    queryFn: () => reportService.getComplaintTrends(filters),
  });

  const { data: warrantyData, isLoading: warrantyLoading } = useQuery({
    queryKey: ['warranty-analysis', filters],
    queryFn: () => reportService.getWarrantyAnalysis(filters),
  });

  const summary = summaryData?.data?.summary || {};
  const byProduct = summaryData?.data?.by_product || [];
  const byArea = summaryData?.data?.by_area || [];

  const handleExportSummary = () => {
    const exportData = [
      { Metric: 'Total Complaints', Value: summary.total_complaints },
      { Metric: 'Open', Value: summary.open },
      { Metric: 'In Progress', Value: summary.in_progress },
      { Metric: 'Completed', Value: summary.completed },
      { Metric: 'Avg Resolution Hours', Value: summary.avg_resolution_hours?.toFixed(2) },
      { Metric: 'Total Revenue', Value: summary.total_revenue },
    ];
    
    exportToCSV(exportData, generateFilename('complaint_summary'));
    toast.success('Report exported successfully');
  };

  const handleExportByProduct = () => {
    const exportData = byProduct.map(item => ({
      Product: item.product_name,
      Category: item.category,
      'Total Complaints': item.count,
      Completed: item.completed,
      Active: item.active,
    }));
    
    exportToCSV(exportData, generateFilename('complaints_by_product'));
    toast.success('Report exported successfully');
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <ReportCard
        title="Complaint Summary"
        description="Overview of complaint statistics"
        loading={summaryLoading}
        onExport={handleExportSummary}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total Complaints</p>
            <p className="text-3xl font-bold text-gray-900">{formatNumber(summary.total_complaints)}</p>
          </div>
          <div className="text-center p-4 bg-warning-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Open</p>
            <p className="text-3xl font-bold text-warning-600">{formatNumber(summary.open)}</p>
          </div>
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">In Progress</p>
            <p className="text-3xl font-bold text-primary-600">{formatNumber(summary.in_progress)}</p>
          </div>
          <div className="text-center p-4 bg-success-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-3xl font-bold text-success-600">{formatNumber(summary.completed)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-6">
          <div className="p-4 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Avg Resolution Time</p>
            <p className="text-2xl font-bold text-gray-900">
              {summary.avg_resolution_hours ? `${Math.round(summary.avg_resolution_hours)}h` : 'N/A'}
            </p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(summary.total_revenue)}
            </p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Parts Cost</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(summary.total_parts_cost)}
            </p>
          </div>
        </div>
      </ReportCard>

      {/* Trends Chart */}
      <ReportCard
        title="Complaint Trends"
        description="Complaint volume over time"
        loading={trendsLoading}
      >
        <ComplaintTrendChart data={trendsData?.data?.trends} type="area" />
      </ReportCard>

      {/* Warranty Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportCard
          title="Warranty Distribution"
          description="Breakdown by warranty status"
          loading={warrantyLoading}
        >
          <WarrantyPieChart data={warrantyData?.data?.warranty_analysis} />
        </ReportCard>

        <ReportCard
          title="By Product"
          description="Top products by complaint count"
          loading={summaryLoading}
          onExport={handleExportByProduct}
        >
          <div className="space-y-3">
            {byProduct.slice(0, 5).map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{product.product_name}</p>
                  <p className="text-sm text-gray-500">{product.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{product.count}</p>
                  <p className="text-xs text-gray-500">{product.completed} completed</p>
                </div>
              </div>
            ))}
          </div>
        </ReportCard>
      </div>

      {/* By Area Table */}
      <ReportCard
        title="Complaints by Area"
        description="Area-wise complaint breakdown"
        loading={summaryLoading}
        onExport={() => {
          exportToCSV(byArea.map(item => ({
            Area: item.area_name,
            'Total Complaints': item.count,
            Completed: item.completed,
            Active: item.active,
          })), generateFilename('complaints_by_area'));
          toast.success('Report exported');
        }}
      >
        <DataTable
          columns={[
            { header: 'Area', accessor: 'area_name' },
            { header: 'Total', accessor: 'count', render: (row) => formatNumber(row.count) },
            { header: 'Completed', accessor: 'completed', render: (row) => formatNumber(row.completed) },
            { header: 'Active', accessor: 'active', render: (row) => formatNumber(row.active) },
          ]}
          data={byArea}
          loading={summaryLoading}
        />
      </ReportCard>
    </div>
  );
};

// ============================================
// REVENUE REPORT
// ============================================
const RevenueReport = ({ filters }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['revenue-report', filters],
    queryFn: () => reportService.getRevenueReport(filters),
  });

  const summary = data?.data?.summary || {};
  const timeSeries = data?.data?.time_series || [];
  const byArea = data?.data?.by_area || [];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <ReportCard
        title="Revenue Summary"
        description="Financial performance overview"
        loading={isLoading}
        onExport={() => {
          exportToCSV([{
            'Total Invoices': summary.total_invoices,
            'Total Revenue': summary.total_revenue,
            'Paid Amount': summary.paid_amount,
            'Pending Amount': summary.pending_amount,
            'Average Invoice': summary.avg_invoice_value,
          }], generateFilename('revenue_summary'));
          toast.success('Report exported');
        }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-primary-600">
              {formatCurrency(summary.total_revenue)}
            </p>
          </div>
          <div className="text-center p-4 bg-success-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Paid</p>
            <p className="text-3xl font-bold text-success-600">
              {formatCurrency(summary.paid_amount)}
            </p>
          </div>
          <div className="text-center p-4 bg-warning-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-3xl font-bold text-warning-600">
              {formatCurrency(summary.pending_amount)}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Avg Invoice</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(summary.avg_invoice_value)}
            </p>
          </div>
        </div>
      </ReportCard>

      {/* Revenue Chart */}
      <ReportCard
        title="Revenue Trends"
        description="Revenue over time"
        loading={isLoading}
      >
        <RevenueChart data={timeSeries} />
      </ReportCard>

      {/* By Area */}
      <ReportCard
        title="Revenue by Area"
        description="Area-wise revenue breakdown"
        loading={isLoading}
        onExport={() => {
          exportToCSV(byArea.map(item => ({
            Area: item.area_name,
            'Invoice Count': item.invoice_count,
            Revenue: item.revenue,
            'Counter Sale': item.counter_sale_revenue,
            'Service Revenue': item.service_revenue,
          })), generateFilename('revenue_by_area'));
          toast.success('Report exported');
        }}
      >
        <DataTable
          columns={[
            { header: 'Area', accessor: 'area_name' },
            { header: 'Invoices', accessor: 'invoice_count' },
            { header: 'Revenue', accessor: 'revenue', render: (row) => formatCurrency(row.revenue) },
            { header: 'Counter Sale', accessor: 'counter_sale_revenue', render: (row) => formatCurrency(row.counter_sale_revenue) },
            { header: 'Service', accessor: 'service_revenue', render: (row) => formatCurrency(row.service_revenue) },
          ]}
          data={byArea}
          loading={isLoading}
        />
      </ReportCard>
    </div>
  );
};

// ============================================
// TECHNICIAN REPORT
// ============================================
const TechnicianReport = ({ filters }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['technician-performance', filters],
    queryFn: () => reportService.getTechnicianPerformance(filters),
  });

  const technicians = data?.data?.technicians || [];

  return (
    <div className="space-y-6">
      <ReportCard
        title="Technician Performance"
        description="Individual technician statistics"
        loading={isLoading}
        onExport={() => {
          exportToCSV(technicians.map(t => ({
            Technician: t.full_name,
            'Total Assigned': t.total_assigned,
            Completed: t.completed,
            'In Progress': t.in_progress,
            'Avg Resolution (hrs)': t.avg_resolution_hours?.toFixed(2),
            'Total Revenue': t.total_revenue,
          })), generateFilename('technician_performance'));
          toast.success('Report exported');
        }}
      >
        <DataTable
          columns={[
            { 
              header: 'Technician', 
              accessor: 'full_name',
              render: (row) => (
                <div>
                  <div className="font-medium text-gray-900">{row.full_name}</div>
                  <div className="text-sm text-gray-500">{row.email}</div>
                </div>
              )
            },
            { header: 'Assigned', accessor: 'total_assigned' },
            { header: 'Completed', accessor: 'completed', render: (row) => (
              <span className="font-medium text-success-600">{row.completed}</span>
            )},
            { header: 'In Progress', accessor: 'in_progress' },
            { header: 'Avg Time (hrs)', accessor: 'avg_resolution_hours', render: (row) => (
              row.avg_resolution_hours ? Math.round(row.avg_resolution_hours) : 'N/A'
            )},
            { header: 'Revenue', accessor: 'total_revenue', render: (row) => formatCurrency(row.total_revenue) },
          ]}
          data={technicians}
          loading={isLoading}
        />
      </ReportCard>
    </div>
  );
};

// ============================================
// INVENTORY REPORT
// ============================================
const InventoryReport = ({ filters }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['inventory-status', filters],
    queryFn: () => reportService.getInventoryStatus(filters),
  });

  const summary = data?.data?.summary || {};
  const lowStock = data?.data?.low_stock_items || [];
  const byCategory = data?.data?.by_category || [];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <ReportCard
        title="Inventory Summary"
        description="Current stock status"
        loading={isLoading}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total Items</p>
            <p className="text-3xl font-bold text-primary-600">{formatNumber(summary.total_items)}</p>
          </div>
          <div className="text-center p-4 bg-success-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total Value</p>
            <p className="text-3xl font-bold text-success-600">{formatCurrency(summary.total_value)}</p>
          </div>
          <div className="text-center p-4 bg-warning-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Low Stock</p>
            <p className="text-3xl font-bold text-warning-600">{formatNumber(summary.low_stock_items)}</p>
          </div>
          <div className="text-center p-4 bg-danger-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Out of Stock</p>
            <p className="text-3xl font-bold text-danger-600">{formatNumber(summary.out_of_stock_items)}</p>
          </div>
        </div>
      </ReportCard>

      {/* Low Stock Items */}
      {lowStock.length > 0 && (
        <ReportCard
          title="Low Stock Alert"
          description="Items that need restocking"
          loading={isLoading}
          onExport={() => {
            exportToCSV(lowStock.map(item => ({
              'Item Code': item.item_code,
              Description: item.description,
              Category: item.category,
              Quantity: item.quantity_in_hand,
              'Unit Price': item.unit_price,
              Area: item.area_name,
            })), generateFilename('low_stock_items'));
            toast.success('Report exported');
          }}
        >
          <DataTable
            columns={[
              { header: 'Item Code', accessor: 'item_code' },
              { header: 'Description', accessor: 'description' },
              { header: 'Category', accessor: 'category' },
              { 
                header: 'Quantity', 
                accessor: 'quantity_in_hand',
                render: (row) => (
                  <span className="text-warning-600 font-medium">{row.quantity_in_hand}</span>
                )
              },
              { header: 'Unit Price', accessor: 'unit_price', render: (row) => formatCurrency(row.unit_price) },
              { header: 'Area', accessor: 'area_name' },
            ]}
            data={lowStock}
            loading={isLoading}
          />
        </ReportCard>
      )}

      {/* By Category */}
      <ReportCard
        title="Inventory by Category"
        description="Category-wise breakdown"
        loading={isLoading}
        onExport={() => {
          exportToCSV(byCategory.map(item => ({
            Category: item.category,
            'Item Count': item.item_count,
            'Total Quantity': item.total_quantity,
            'Total Value': item.total_value,
          })), generateFilename('inventory_by_category'));
          toast.success('Report exported');
        }}
      >
        <DataTable
          columns={[
            { header: 'Category', accessor: 'category' },
            { header: 'Items', accessor: 'item_count' },
            { header: 'Quantity', accessor: 'total_quantity', render: (row) => formatNumber(row.total_quantity) },
            { header: 'Value', accessor: 'total_value', render: (row) => formatCurrency(row.total_value) },
          ]}
          data={byCategory}
          loading={isLoading}
        />
      </ReportCard>
    </div>
  );
};

export default Reports;