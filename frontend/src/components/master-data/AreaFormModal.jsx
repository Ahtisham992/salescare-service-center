// frontend/src/components/master-data/AreaFormModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const AreaFormModal = ({ isOpen, onClose, area, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    area_name: '',
    area_code: '',
    is_active: true
  });

  useEffect(() => {
    if (area) {
      setFormData({
        area_name: area.area_name || '',
        area_code: area.area_code || '',
        is_active: area.is_active !== undefined ? area.is_active : true
      });
    } else {
      setFormData({
        area_name: '',
        area_code: '',
        is_active: true
      });
    }
    setError('');
  }, [area, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.area_name.trim()) {
      setError('Area name is required');
      setLoading(false);
      return;
    }

    if (!formData.area_code.trim()) {
      setError('Area code is required');
      setLoading(false);
      return;
    }

    try {
      if (area) {
        // Update existing area
        await api.put(`/areas/${area.area_id}`, formData);
      } else {
        // Create new area
        await api.post('/areas', formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save operational area');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {area ? 'Edit Operational Area' : 'New Operational Area'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-center text-sm">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Area Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Area Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="area_name"
              value={formData.area_name}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="e.g., Rawalpindi Service Center"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Full name of the service center or location</p>
          </div>

          {/* Area Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Area Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="area_code"
              value={formData.area_code}
              onChange={handleChange}
              disabled={!!area} // Disable editing area code for existing areas
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="e.g., RWP"
              maxLength={10}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {area 
                ? '🔒 Area code cannot be changed after creation' 
                : 'Short code used in document numbering (e.g., RWP-2025-000001)'}
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center pt-2">
            <input
              id="is_active"
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              Active Status
            </label>
          </div>
          <p className="text-xs text-gray-500 ml-6">
            Inactive areas won't appear in dropdowns for new documents
          </p>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : area ? 'Update Area' : 'Create Area'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AreaFormModal;