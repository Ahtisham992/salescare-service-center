// frontend/src/pages/MasterData.jsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit, Trash2, Package, Wrench, MapPin, 
  Users, Briefcase, Database, ArrowRight,
  Activity, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// Services
import api from '../services/api'; // Used for Areas
import masterDataService from '../services/masterDataService';
import tariffService from '../services/tariffService';
import vendorService from '../services/vendorService';

// Components
import ProductFormModal from '../components/master-data/ProductFormModal';
import ItemFormModal from '../components/master-data/ItemFormModal';
import ConfirmationModal from '../components/common/ConfirmationModal';

const MasterData = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  
  // State
  const [activeTab, setActiveTab] = useState('products');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stats State
  const [stats, setStats] = useState({
    products: 0,
    items: 0,
    tariffs: 0,
    areas: 0,
    vendors: 0
  });
  
  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // 1. Fetch Stats for Dashboard Cards
  const fetchStats = async () => {
    try {
      // Fetch all counts in parallel
      const [products, items, tariffsRes, areasRes, vendorsRes] = await Promise.all([
        masterDataService.getProducts({}),
        masterDataService.getItems({}),
        tariffService.getAll(),
        api.get('/areas'), // Direct API call for areas
        vendorService.getAll()
      ]);
      
      setStats({
        products: products?.length || 0,
        items: items?.length || 0,
        // Safely access data based on your backend response structure
        tariffs: tariffsRes?.data?.tariffs?.length || 0,
        areas: areasRes?.data?.data?.areas?.length || 0,
        vendors: vendorsRes?.data?.vendors?.length || 0
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // We suppress the error toast here to avoid spamming the user on page load
    }
  };

  // 2. Fetch Table Data (Products or Items)
  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'products') {
        const products = await masterDataService.getProducts({ search: searchTerm });
        setData(products);
      } else {
        const items = await masterDataService.getItems({ search: searchTerm });
        setData(items);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load table data');
    } finally {
      setLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchStats();
  }, []);

  // Reload table when tab or search changes
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchTerm]);

  // Handlers
  const handleCreate = () => {
    setSelectedItem(null);
    if (activeTab === 'products') setIsProductModalOpen(true);
    else setIsItemModalOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    if (activeTab === 'products') setIsProductModalOpen(true);
    else setIsItemModalOpen(true);
  };

  const handleDeleteClick = (item) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (activeTab === 'products') {
        await masterDataService.deleteProduct(selectedItem.product_id);
      } else {
        await masterDataService.deleteItem(selectedItem.item_id);
      }
      toast.success(`${activeTab === 'products' ? 'Product' : 'Item'} deleted successfully`);
      fetchData(); // Refresh table
      fetchStats(); // Refresh stats cards
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (activeTab === 'products') {
        if (selectedItem) {
          await masterDataService.updateProduct(selectedItem.product_id, formData);
          toast.success('Product updated');
        } else {
          await masterDataService.createProduct(formData);
          toast.success('Product created');
        }
        setIsProductModalOpen(false);
      } else {
        if (selectedItem) {
          await masterDataService.updateItem(selectedItem.item_id, formData);
          toast.success('Item updated');
        } else {
          await masterDataService.createItem(formData);
          toast.success('Item created');
        }
        setIsItemModalOpen(false);
      }
      fetchData(); // Refresh table
      fetchStats(); // Refresh stats cards
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  // Card Configuration
  const quickAccessCards = [
    {
      title: 'Products',
      count: stats.products,
      icon: Package,
      color: 'blue',
      description: 'Appliance categories',
      action: () => setActiveTab('products')
    },
    {
      title: 'Spare Parts',
      count: stats.items,
      icon: Wrench,
      color: 'green',
      description: 'Inventory items',
      action: () => setActiveTab('items')
    },
    {
      title: 'Service Tariffs',
      count: stats.tariffs,
      icon: Briefcase,
      color: 'purple',
      description: 'Pricing configuration',
      action: () => navigate('/master-data/tariffs')
    },
    {
      title: 'Areas',
      count: stats.areas,
      icon: MapPin,
      color: 'orange',
      description: 'Service locations',
      action: () => navigate('/operational-areas')
    },
    {
      title: 'Vendors',
      count: stats.vendors,
      icon: Users,
      color: 'indigo',
      description: 'Supplier management',
      action: () => navigate('/vendors')
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      indigo: 'bg-indigo-100 text-indigo-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Database className="w-6 h-6 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Master Data Hub</h1>
          </div>
          <p className="text-sm text-gray-600 ml-1">
            Centralized management for all system configuration and reference data
          </p>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {quickAccessCards.map((card, index) => (
          <button
            key={index}
            onClick={card.action}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${getColorClasses(card.color)}`}>
                <card.icon className="w-6 h-6" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gray-600 transition-colors" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {card.count}
            </h3>
            <p className="text-sm font-semibold text-gray-800">{card.title}</p>
            <p className="text-xs text-gray-500 mt-1">{card.description}</p>
          </button>
        ))}
      </div>

      {/* Quick Actions Banner */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border border-primary-100 p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white rounded-full shadow-sm">
              <Activity className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
              <p className="text-sm text-gray-600">Manage your product and inventory data efficiently</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 bg-white/50 px-3 py-1 rounded-full">
            <Clock className="w-4 h-4" />
            <span>Real-time sync enabled</span>
          </div>
        </div>
      </div>

      {/* Main Content Area - Products & Items Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
        {/* Tabs Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-gray-200 px-6 py-4 gap-4">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'products'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <Package className="w-4 h-4 mr-2" />
              Products
              <span className="ml-2 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-xs">
                {stats.products}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'items'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <Wrench className="w-4 h-4 mr-2" />
              Spare Parts
              <span className="ml-2 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-xs">
                {stats.items}
              </span>
            </button>
          </div>

          {hasRole(['admin', 'manager']) && (
            <button
              onClick={handleCreate}
              className="flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add {activeTab === 'products' ? 'Product' : 'Item'}
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'products' ? 'products by name or code' : 'items by name or code'}...`}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-primary-600 mb-4"></div>
              <p className="text-gray-500">Loading master data...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="p-12 text-center text-gray-500 bg-white">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No results found</h3>
              <p className="mt-1">
                No {activeTab} matches your search. Try a different term or add a new one.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {activeTab === 'products' ? 'Product Name' : 'Description'}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  {activeTab === 'items' && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                  )}
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((row) => (
                  <tr key={activeTab === 'products' ? row.product_id : row.item_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {activeTab === 'products' ? row.product_code : row.item_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {activeTab === 'products' ? row.product_name : row.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {row.category || 'General'}
                      </span>
                    </td>
                    {activeTab === 'items' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                        Rs. {row.unit_price?.toLocaleString()}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        row.is_active 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {row.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {hasRole(['admin', 'manager']) && (
                        <div className="flex justify-end space-x-3">
                          <button 
                            onClick={() => handleEdit(row)} 
                            className="p-1 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {hasRole(['admin']) && (
                            <button 
                              onClick={() => handleDeleteClick(row)} 
                              className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modals */}
      <ProductFormModal 
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedItem}
      />

      <ItemFormModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedItem}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${activeTab === 'products' ? 'Product' : 'Item'}`}
        message={`Are you sure you want to delete this ${activeTab === 'products' ? 'product' : 'item'}? This action cannot be undone.`}
        type="danger"
        confirmText="Delete"
      />
    </div>
  );
};

export default MasterData;