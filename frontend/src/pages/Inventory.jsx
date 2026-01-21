// frontend/src/pages/Inventory.jsx - COMPLETE VERSION
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import inventoryService from '../services/inventoryService';
import DataTable from '../components/common/DataTable';
import { 
  Search, 
  Filter, 
  X,
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Box
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';

const Inventory = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    area_id: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' or 'transactions'

  // Build query params
  const queryParams = {
    page: currentPage,
    limit: 10,
    ...(searchTerm && { search: searchTerm }),
    ...(filters.category && { category: filters.category }),
    ...(filters.area_id && { area_id: filters.area_id }),
  };

  // Fetch stock data
  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ['inventory-stock', queryParams],
    queryFn: () => inventoryService.getStock(queryParams),
    enabled: activeTab === 'stock',
  });

  // Fetch transactions
  const { data: transactionsData, isLoading: transLoading } = useQuery({
    queryKey: ['inventory-transactions', queryParams],
    queryFn: () => inventoryService.getTransactions(queryParams),
    enabled: activeTab === 'transactions',
  });

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      area_id: '',
    });
    setSearchTerm('');
  };

  // Stock table columns
  const stockColumns = [
    {
      header: 'Item Code',
      accessor: 'item_code',
      render: (row) => (
        <div className="flex items-center">
          <Package className="w-4 h-4 text-gray-400 mr-2" />
          <span className="font-medium text-gray-900">{row.item_code}</span>
        </div>
      ),
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.description}</div>
          {row.category && (
            <div className="text-sm text-gray-500">{row.category}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Area',
      accessor: 'area_name',
    },
    {
      header: 'Quantity',
      accessor: 'quantity_in_hand',
      render: (row) => {
        const qty = parseInt(row.quantity_in_hand);
        const isLow = qty <= 10;
        const isOut = qty === 0;
        
        return (
          <div className="flex items-center">
            <span className={`font-semibold ${
              isOut ? 'text-danger-600' : isLow ? 'text-warning-600' : 'text-gray-900'
            }`}>
              {formatNumber(qty)}
            </span>
            {isLow && !isOut && (
              <AlertTriangle className="w-4 h-4 text-warning-600 ml-2" />
            )}
          </div>
        );
      },
    },
    {
      header: 'Unit Price',
      accessor: 'unit_price',
      render: (row) => (
        <span className="text-gray-900">{formatCurrency(row.unit_price)}</span>
      ),
    },
    {
      header: 'Stock Value',
      accessor: 'stock_value',
      render: (row) => (
        <span className="font-medium text-gray-900">
          {formatCurrency(row.quantity_in_hand * row.unit_price)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const qty = parseInt(row.quantity_in_hand);
        
        if (qty === 0) {
          return <span className="badge badge-danger">Out of Stock</span>;
        } else if (qty <= 10) {
          return <span className="badge badge-warning">Low Stock</span>;
        } else {
          return <span className="badge badge-success">In Stock</span>;
        }
      },
    },
  ];

  // Transaction table columns
  const transactionColumns = [
    {
      header: 'Date',
      accessor: 'transaction_date',
      render: (row) => (
        <div className="text-sm text-gray-900">{formatDate(row.transaction_date)}</div>
      ),
    },
    {
      header: 'Type',
      accessor: 'transaction_type',
      render: (row) => (
        <span className={`badge ${
          row.quantity_change > 0 ? 'badge-success' : 'badge-warning'
        }`}>
          {row.transaction_type}
        </span>
      ),
    },
    {
      header: 'Item',
      accessor: 'item_code',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.item_code}</div>
          <div className="text-sm text-gray-500">{row.description}</div>
        </div>
      ),
    },
    {
      header: 'Reference',
      accessor: 'reference_number',
    },
    {
      header: 'Change',
      accessor: 'quantity_change',
      render: (row) => (
        <div className="flex items-center">
          {row.quantity_change > 0 ? (
            <>
              <TrendingUp className="w-4 h-4 text-success-600 mr-1" />
              <span className="text-success-600 font-medium">+{row.quantity_change}</span>
            </>
          ) : (
            <>
              <TrendingDown className="w-4 h-4 text-warning-600 mr-1" />
              <span className="text-warning-600 font-medium">{row.quantity_change}</span>
            </>
          )}
        </div>
      ),
    },
    {
      header: 'Before',
      accessor: 'quantity_before',
    },
    {
      header: 'After',
      accessor: 'quantity_after',
      render: (row) => (
        <span className="font-medium">{row.quantity_after}</span>
      ),
    },
    {
      header: 'Area',
      accessor: 'area_name',
    },
  ];

  const stock = stockData?.data?.stock || [];
  const stockPagination = stockData?.data?.pagination || {};
  
  const transactions = transactionsData?.data?.transactions || [];
  const transPagination = transactionsData?.data?.pagination || {};

  // Calculate stats from stock data
  const totalItems = stock.length;
  const totalValue = stock.reduce((sum, item) => 
    sum + (item.quantity_in_hand * item.unit_price), 0
  );
  const lowStock = stock.filter(item => item.quantity_in_hand <= 10 && item.quantity_in_hand > 0).length;
  const outOfStock = stock.filter(item => item.quantity_in_hand === 0).length;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header mb-6">
        <h1 className="page-title">Inventory Management</h1>
        <p className="page-subtitle">
          Track stock levels, movements, and manage your inventory
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalItems}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(totalValue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <Box className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-warning-600 mt-1">{lowStock}</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-danger-600 mt-1">{outOfStock}</p>
            </div>
            <div className="w-12 h-12 bg-danger-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-danger-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('stock')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stock'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Stock Levels
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Transactions
          </button>
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by item code or description..."
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
            
            {(filters.category || filters.area_id || searchTerm) && (
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
              <label className="form-label">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="form-input"
              >
                <option value="">All Categories</option>
                <option value="Spare Part">Spare Part</option>
                <option value="Compressor">Compressor</option>
                <option value="PCB">PCB</option>
              </select>
            </div>

            <div>
              <label className="form-label">Area</label>
              <select
                value={filters.area_id}
                onChange={(e) => handleFilterChange('area_id', e.target.value)}
                className="form-input"
              >
                <option value="">All Areas</option>
                <option value="1">Rawalpindi</option>
                <option value="2">Islamabad</option>
                <option value="3">Lahore</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card">
        {activeTab === 'stock' ? (
          <DataTable
            columns={stockColumns}
            data={stock}
            pagination={stockPagination}
            onPageChange={setCurrentPage}
            loading={stockLoading}
            emptyMessage="No inventory items found."
          />
        ) : (
          <DataTable
            columns={transactionColumns}
            data={transactions}
            pagination={transPagination}
            onPageChange={setCurrentPage}
            loading={transLoading}
            emptyMessage="No transactions found."
          />
        )}
      </div>
    </div>
  );
};

export default Inventory;