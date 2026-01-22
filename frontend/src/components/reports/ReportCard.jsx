// frontend/src/components/reports/ReportCard.jsx
import React from 'react';
import { Download, FileDown } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const ReportCard = ({ 
  title, 
  description, 
  children, 
  loading = false,
  onExport,
  onExportPDF
}) => {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        
        {(onExport || onExportPDF) && !loading && (
          <div className="flex space-x-2">
            {onExport && (
              <button
                onClick={onExport}
                className="btn btn-sm btn-outline flex items-center"
                title="Export to CSV"
              >
                <Download className="w-4 h-4 mr-1" />
                CSV
              </button>
            )}
            {onExportPDF && (
              <button
                onClick={onExportPDF}
                className="btn btn-sm btn-outline flex items-center"
                title="Export to PDF"
              >
                <FileDown className="w-4 h-4 mr-1" />
                PDF
              </button>
            )}
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        children
      )}
    </div>
  );
};

export default ReportCard;