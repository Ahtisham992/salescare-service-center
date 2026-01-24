// frontend/src/pages/OperationalAreas.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, MapPin, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AreaFormModal from '../components/master-data/AreaFormModal';
import ConfirmationModal from '../components/common/ConfirmationModal';

const OperationalAreas = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchAreas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/areas');
      if (response.data.success) {
        setAreas(response.data.data.areas || []);
      }
    } catch (error) {
      console.error('Error fetching areas:', error);
      toast.error('Failed to load operational areas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const handleCreate = () => {
    setSelectedArea(null);
    setIsModalOpen(true);
  };

  const handleEdit = (area) => {
    setSelectedArea(area);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (area) => {
    setSelectedArea(area);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/areas/${selectedArea.area_id}`);
      toast.success('Operational area deleted successfully');
      fetchAreas();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete area');
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedArea(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedArea(null);
  };

  const handleModalSuccess = () => {
    fetchAreas();
    setIsModalOpen(false);
    setSelectedArea(null);
  };

  const filteredAreas = areas.filter((area) =>
    area.area_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    area.area_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <button
            onClick={() => navigate('/master-data')}
            className="flex items-center text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Master Data
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <MapPin className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Operational Areas</h1>
              <p className="text-sm text-gray-500">Manage service center locations and coverage areas</p>
            </div>
          </div>
        </div>
        {hasRole(['admin', 'manager']) && (
          <button
            onClick={handleCreate}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Area
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Areas</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{areas.length}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Areas</p>
              <h3 className="text-2xl font-bold text-green-600 mt-1">
                {areas.filter(a => a.is_active).length}
              </h3>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Inactive Areas</p>
              <h3 className="text-2xl font-bold text-gray-400 mt-1">
                {areas.filter(a => !a.is_active).length}
              </h3>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <XCircle className="w-6 h-6 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by area name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Area Code
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Area Name
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-primary-600 mb-4"></div>
                    <p>Loading operational areas...</p>
                  </td>
                </tr>
              ) : filteredAreas.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <MapPin className="w-6 h-6 text-gray-400" />
                    </div>
                    <p>{searchQuery ? 'No areas found matching your search.' : 'No operational areas found.'}</p>
                  </td>
                </tr>
              ) : (
                filteredAreas.map((area) => (
                  <tr key={area.area_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="font-mono text-sm font-medium text-primary-700 bg-primary-50 px-2 py-1 rounded">
                          {area.area_code}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{area.area_name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          area.is_active
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-gray-100 text-gray-800 border-gray-200'
                        }`}
                      >
                        {area.is_active ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {hasRole(['admin', 'manager']) && (
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => handleEdit(area)}
                            className="p-1 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded transition-colors"
                            title="Edit Area"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {hasRole(['admin']) && (
                            <button
                              onClick={() => handleDeleteClick(area)}
                              className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                              title="Delete Area"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AreaFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        area={selectedArea}
        onSuccess={handleModalSuccess}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Operational Area"
        message={`Are you sure you want to delete "${selectedArea?.area_name}"? This action cannot be undone and may affect existing data.`}
        type="danger"
        confirmText="Delete Area"
      />
    </div>
  );
};

export default OperationalAreas;