import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import api from '../../services/api'; // Using direct api for product fetch if productService isn't generic

const TariffFormModal = ({ isOpen, onClose, tariff, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    product_id: '',
    visit_charges_24h: 0,
    visit_charges_48h: 0,
    gas_charges: 0,
    inspection_charges_csc: 0,
    washing_charges: 0,
    transport_charges_per_km: 0,
    dismantling_charges: 0,
    reinstallation_charges: 0
  });

  // Fetch Products for Dropdown
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products?is_active=true');
        if (res.data.success) {
          setProducts(res.data.data.products);
        }
      } catch (err) {
        console.error("Failed to load products", err);
      }
    };
    if (isOpen) fetchProducts();
  }, [isOpen]);

  // Load data if editing
  useEffect(() => {
    if (tariff) {
      setFormData({
        product_id: tariff.product_id,
        visit_charges_24h: tariff.visit_charges_24h || 0,
        visit_charges_48h: tariff.visit_charges_48h || 0,
        gas_charges: tariff.gas_charges || 0,
        inspection_charges_csc: tariff.inspection_charges_csc || 0,
        washing_charges: tariff.washing_charges || 0,
        transport_charges_per_km: tariff.transport_charges_per_km || 0,
        dismantling_charges: tariff.dismantling_charges || 0,
        reinstallation_charges: tariff.reinstallation_charges || 0
      });
    } else {
      // Reset form for new entry
      setFormData({
        product_id: '',
        visit_charges_24h: 0,
        visit_charges_48h: 0,
        gas_charges: 0,
        inspection_charges_csc: 0,
        washing_charges: 0,
        transport_charges_per_km: 0,
        dismantling_charges: 0,
        reinstallation_charges: 0
      });
    }
    setError('');
  }, [tariff, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'product_id' ? value : parseFloat(value) || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (tariff) {
        await api.put(`/tariffs/${tariff.tariff_id}`, formData);
      } else {
        await api.post('/tariffs', formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save tariff');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {tariff ? 'Edit Service Tariff' : 'New Service Tariff'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-center text-sm">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}

          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Category <span className="text-red-500">*</span>
            </label>
            <select
              name="product_id"
              value={formData.product_id}
              onChange={handleChange}
              disabled={!!tariff} // Disable changing product when editing
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-100"
              required
            >
              <option value="">Select a Product</option>
              {products.map(p => (
                <option key={p.product_id} value={p.product_id}>
                  {p.product_name} ({p.product_code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visit Charges */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Visit Charges</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700">Visit (24h)</label>
                <input
                  type="number"
                  name="visit_charges_24h"
                  value={formData.visit_charges_24h}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Visit (48h)</label>
                <input
                  type="number"
                  name="visit_charges_48h"
                  value={formData.visit_charges_48h}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Service Charges */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Service Charges</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gas Charges</label>
                <input
                  type="number"
                  name="gas_charges"
                  value={formData.gas_charges}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Washing/Service</label>
                <input
                  type="number"
                  name="washing_charges"
                  value={formData.washing_charges}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Misc Charges */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Misc Charges</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700">Inspection (CSC)</label>
                <input
                  type="number"
                  name="inspection_charges_csc"
                  value={formData.inspection_charges_csc}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Transport (per km)</label>
                <input
                  type="number"
                  name="transport_charges_per_km"
                  value={formData.transport_charges_per_km}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Installation */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Installation</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700">Dismantling</label>
                <input
                  type="number"
                  name="dismantling_charges"
                  value={formData.dismantling_charges}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Re-installation</label>
                <input
                  type="number"
                  name="reinstallation_charges"
                  value={formData.reinstallation_charges}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
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
              {loading ? 'Saving...' : 'Save Tariff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TariffFormModal;