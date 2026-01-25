// frontend/src/pages/StockMovementReport.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import reportService from '../services/reportService';
import DataTable from '../components/common/DataTable';
import ReportCard from '../components/reports/ReportCard';
import ReportFilters from '../components/reports/ReportFilters';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Package,
  ArrowUpRight,
  ArrowDownRight 
} from 'lucide-react';
import { formatDate, formatCurrency, formatNumber } from '../utils/formatters';
import { exportToCSV, generateFilename } from '../utils/exportHelpers';
import toast from 'react-hot-toast';

const StockMovementReport = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    area_id: '',
    item_id: '',
    transaction_type: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({});

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
  };

  const handleClearFilters = () => {
    const cleared = {
      date_from: '',
      date_to: '',
      area_id: '',
      item_id: '',
      transaction_type: '',
    };
    setFilters(cleared);
    setAppliedFilters(cleared);
  };

  // Fetch inventory movement data
  const { data, isLoading } = useQuery({
    queryKey: ['inventory-movement', appliedFilters],
    queryFn: () => reportService.getInventoryMovement(appliedFilters),
  });

  const summary = data?.data?.summary_by_type || [];
  const topItems = data?.data?.top_items || [];
  const recentTransactions = data?.data?.recent_transactions || [];

  // Calculate totals
  const totalIn = summary.reduce((sum, s) => sum + parseFloat(s.total_in || 0), 0);
  const totalOut = summary.reduce((sum, s) => sum + parseFloat(s.total_out || 0), 0);
  const netChange = totalIn - totalOut;

  const handleExportSummary = () => {
    const exportData = summary.map(item => ({
      'Transaction Type': item.transaction_type,
      'Count': item.transaction_count,
      'Total In': item.total_in,
      'Total Out': item.total_out,
      'Total Value': item.total_value,
    }));
    
    exportToCSV(exportData, generateFilename('stock_movement_summary'));
    toast.success('Summary exported successfully');
  };

  const handleExportTransactions = () => {
    const exportData = recentTransactions.map(t => ({
      'Date': formatDate(t.transaction_date),
      'Type': t.transaction_type,
      'Reference': t.reference_number || 'N/A',
      'Item Code': t.item_code,
      'Description': t.description,
      'Quantity': t.quantity_change,
      'Before': t.quantity_before,
      'After': t.quantity_after,
      'Area': t.area_name,
      'Performed By': t.performed_by,
    }));
    
    exportToCSV(exportData, generateFilename('stock_transactions'));
    toast.success('Transactions exported successfully');
  };

  const transactionColumns = [
    {
      header: 'Date',
      accessor: 'transaction_date',
      render: (row) => (
        <div className="text-sm text-gray-900">
          {formatDate(row.transaction_date)}
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: 'transaction_type',
      render: (row) => {
        const types = {
          GR: { label: 'Goods Receipt', color: 'success' },
          MRQS_ISSUE: { label: 'MRQS Issue', color: 'warning' },
          MRTS_RETURN: { label: 'MRTS Return', color: 'info' },
          DO_ISSUE: { label: 'Delivery Order', color: 'primary' },
          ADJUSTMENT: { label: 'Adjustment', color: 'gray' },
        };
        const type = types[row.transaction_type] || { label: row.transaction_type, color: 'gray' };
        
        return (
          <span className={`badge badge-${type.color}`}>
            {type.label}
          </span>
        );
      },
    },
    {
      header: 'Reference',
      accessor: 'reference_number',
      render: (row) => (
        <span className="text-sm text-gray-600">
          {row.reference_number || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Item',
      accessor: 'description',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.item_code}</div>
          <div className="text-sm text-gray-600">{row.description}</div>
        </div>
      ),
    },
    {
      header: 'Quantity',
      accessor: 'quantity_change',
      render: (row) => {
        const isPositive = row.quantity_change > 0;
        return (
          <div className="flex items-center">
            {isPositive ? (
              <ArrowUpRight className="w-4 h-4 text-success-600 mr-1" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-danger-600 mr-1" />
            )}
            <span className={`font-bold ${isPositive ? 'text-success-600' : 'text-danger-600'}`}>
              {isPositive ? '+' : ''}{row.quantity_change}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Stock Level',
      accessor: 'quantity_after',
      render: (row) => (
        <div className="text-sm text-gray-600">
          {row.quantity_before} → <span className="font-medium text-gray-900">{row.quantity_after}</span>
        </div>
      ),
    },
    {
      header: 'Area',
      accessor: 'area_name',
    },
    {
      header: 'Performed By',
      accessor: 'performed_by',
      render: (row) => (
        <span className="text-sm text-gray-600">
          {row.performed_by || 'System'}
        </span>
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
          <h1 className="page-title">Stock Movement Report</h1>
          <p className="page-subtitle">
            Track inventory transactions and stock flow
          </p>
        </div>
      </div>

      {/* Filters */}
      <ReportFilters
        filters={filters}
        onChange={setFilters}
        onClear={handleClearFilters}
        onApply={handleApplyFilters}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total In</span>
            <TrendingUp className="w-5 h-5 text-success-600" />
          </div>
          <div className="text-3xl font-bold text-success-600">
            {formatNumber(totalIn)}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total Out</span>
            <TrendingDown className="w-5 h-5 text-danger-600" />
          </div>
          <div className="text-3xl font-bold text-danger-600">
            {formatNumber(totalOut)}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Net Change</span>
            <Package className="w-5 h-5 text-primary-600" />
          </div>
          <div className={`text-3xl font-bold ${netChange >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
            {netChange >= 0 ? '+' : ''}{formatNumber(netChange)}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Transactions</span>
            <Package className="w-5 h-5 text-gray-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {summary.reduce((sum, s) => sum + parseInt(s.transaction_count || 0), 0)}
          </div>
        </div>
      </div>

      {/* Summary by Type */}
      <ReportCard
        title="Movement by Transaction Type"
        description="Breakdown of stock movements"
        loading={isLoading}
        onExport={handleExportSummary}
      >
        <div className="space-y-3">
          {summary.map((item, index) => {
            const totalValue = parseFloat(item.total_value || 0);
            
            return (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.transaction_type}</h4>
                    <p className="text-sm text-gray-600">{item.transaction_count} transactions</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(totalValue)}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">In:</span>
                    <span className="font-medium text-success-600">+{formatNumber(item.total_in)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Out:</span>
                    <span className="font-medium text-danger-600">-{formatNumber(item.total_out)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ReportCard>

      {/* Top Items */}
      <ReportCard
        title="Most Active Items"
        description="Items with highest transaction volume"
        loading={isLoading}
      >
        <DataTable
          columns={[
            { header: 'Item Code', accessor: 'item_code' },
            { header: 'Description', accessor: 'description' },
            { header: 'Category', accessor: 'category' },
            { 
              header: 'Transactions', 
              accessor: 'transaction_count',
              render: (row) => <span className="font-medium">{row.transaction_count}</span>
            },
            { 
              header: 'Received', 
              accessor: 'total_received',
              render: (row) => <span className="text-success-600">+{formatNumber(row.total_received)}</span>
            },
            { 
              header: 'Issued', 
              accessor: 'total_issued',
              render: (row) => <span className="text-danger-600">-{formatNumber(row.total_issued)}</span>
            },
            { 
              header: 'Net Change', 
              accessor: 'net_change',
              render: (row) => {
                const netChange = parseInt(row.net_change || 0);
                return (
                  <span className={`font-bold ${netChange >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                    {netChange >= 0 ? '+' : ''}{formatNumber(netChange)}
                  </span>
                );
              }
            },
          ]}
          data={topItems}
          loading={isLoading}
        />
      </ReportCard>

      {/* Recent Transactions */}
      <ReportCard
        title="Recent Transactions"
        description="Latest stock movements"
        loading={isLoading}
        onExport={handleExportTransactions}
      >
        <DataTable
          columns={transactionColumns}
          data={recentTransactions}
          loading={isLoading}
          emptyMessage="No transactions found for the selected period"
        />
      </ReportCard>
    </div>
  );
};

export default StockMovementReport;