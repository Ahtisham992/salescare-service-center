// frontend/src/components/reports/ReportCard.jsx
import React from 'react';
import { Download, Printer, RefreshCw } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const ReportCard = ({ 
  title, 
  description, 
  children, 
  loading = false,
  onExport,
  onPrint,
  onRefresh,
  actions
}) => {
  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          
          {onExport && (
            <button
              onClick={onExport}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Export to CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          
          {onPrint && (
            <button
              onClick={onPrint}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Print"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}

          {actions}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12">
          <LoadingSpinner size="lg" message="Generating report..." />
        </div>
      ) : (
        children
      )}
    </div>
  );
};

export default ReportCard;