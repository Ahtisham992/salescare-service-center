// frontend/src/pages/master-data/ServiceTariffs.jsx
import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, ArrowLeft, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import tariffService from "../services/tariffService";
import TariffFormModal from "../components/master-data/TariffFormModal";
import { useAuth } from "../context/AuthContext";

const ServiceTariffs = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTariff, setSelectedTariff] = useState(null);

  const fetchTariffs = async () => {
    try {
      setLoading(true);
      const res = await tariffService.getAll();
      if (res.success) {
        setTariffs(res.data.tariffs);
      }
    } catch (error) {
      console.error("Error fetching tariffs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTariffs();
  }, []);

  const handleEdit = (tariff) => {
    setSelectedTariff(tariff);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this tariff?")) {
      try {
        await tariffService.delete(id);
        fetchTariffs();
      } catch (error) {
        console.error("Error deleting tariff:", error);
        alert("Failed to delete tariff");
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTariff(null);
  };

  const filteredTariffs = tariffs.filter((t) =>
    t.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.product_code.toLowerCase().includes(searchQuery.toLowerCase())
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
            <div className="p-2 bg-purple-50 rounded-lg">
              <Briefcase className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Service Tariffs</h1>
              <p className="text-sm text-gray-500">Manage standard service charges and pricing per product</p>
            </div>
          </div>
        </div>
        {hasRole(['admin', 'manager']) && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Tariff
          </button>
        )}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by product name or code..."
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
                  Product
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Visit (24h)
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Visit (48h)
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Gas
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Service/Wash
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-primary-600 mb-4"></div>
                    <p>Loading tariffs...</p>
                  </td>
                </tr>
              ) : filteredTariffs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <Briefcase className="w-6 h-6 text-gray-400" />
                    </div>
                    <p>No tariffs found. Add a tariff to get started.</p>
                  </td>
                </tr>
              ) : (
                filteredTariffs.map((tariff) => (
                  <tr key={tariff.tariff_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {tariff.product_name}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {tariff.product_code}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700 font-mono">
                      {Number(tariff.visit_charges_24h).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700 font-mono">
                      {Number(tariff.visit_charges_48h).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700 font-mono">
                      {Number(tariff.gas_charges).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700 font-mono">
                      {Number(tariff.washing_charges).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {hasRole(['admin', 'manager']) && (
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => handleEdit(tariff)}
                            className="p-1 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded transition-colors"
                            title="Edit Tariff"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {hasRole(['admin']) && (
                            <button
                              onClick={() => handleDelete(tariff.tariff_id)}
                              className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                              title="Delete Tariff"
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

      <TariffFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        tariff={selectedTariff}
        onSuccess={fetchTariffs}
      />
    </div>
  );
};

export default ServiceTariffs;