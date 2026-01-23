import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package, Wrench } from 'lucide-react';
import { toast } from 'react-hot-toast';
import masterDataService from '../services/masterDataService';
import ProductFormModal from '../components/master-data/ProductFormModal';
import ItemFormModal from '../components/master-data/ItemFormModal';
import ConfirmationModal from '../components/common/ConfirmationModal';

const MasterData = () => {
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'items'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Fetch Data
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
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchTerm]);

  // Handle Create
  const handleCreate = () => {
    setSelectedItem(null);
    if (activeTab === 'products') setIsProductModalOpen(true);
    else setIsItemModalOpen(true);
  };

  // Handle Edit
  const handleEdit = (item) => {
    setSelectedItem(item);
    if (activeTab === 'products') setIsProductModalOpen(true);
    else setIsItemModalOpen(true);
  };

  // Handle Delete
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
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
    }
  };

  // Handle Form Submit
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
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Master Data Management</h1>
        <button
          onClick={handleCreate}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add {activeTab === 'products' ? 'Product' : 'Item'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'products'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Package className="w-4 h-4 mr-2" />
          Products (Appliances)
        </button>
        <button
          onClick={() => setActiveTab('items')}
          className={`flex items-center py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'items'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Wrench className="w-4 h-4 mr-2" />
          Items (Spare Parts)
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading data...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No records found.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name / Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                {activeTab === 'items' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row) => (
                <tr key={activeTab === 'products' ? row.product_id : row.item_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {activeTab === 'products' ? row.product_code : row.item_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {activeTab === 'products' ? row.product_name : row.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row.category || '-'}
                  </td>
                  {activeTab === 'items' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Rs. {row.unit_price}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      row.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {row.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(row)} className="text-blue-600 hover:text-blue-900 mr-4">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteClick(row)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
      />
    </div>
  );
};

export default MasterData;