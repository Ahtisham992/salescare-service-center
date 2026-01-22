// ----------------------------------------------------------
// frontend/src/components/reports/ReportFilters.jsx
import React from 'react';
import { Filter, X } from 'lucide-react';

const ReportFilters = ({ filters, onChange, onClear, onApply }) => {
  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.values(filters).some(val => val !== '');

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Filter className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="btn btn-sm btn-outline flex items-center text-danger-600 border-danger-600 hover:bg-danger-50"
          >
            <X className="w-4 h-4 mr-1" />
            Clear All
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="form-label">Date From</label>
          <input
            type="date"
            value={filters.date_from || ''}
            onChange={(e) => handleChange('date_from', e.target.value)}
            className="form-input"
          />
        </div>
        
        <div>
          <label className="form-label">Date To</label>
          <input
            type="date"
            value={filters.date_to || ''}
            onChange={(e) => handleChange('date_to', e.target.value)}
            className="form-input"
          />
        </div>
        
        <div>
          <label className="form-label">Area</label>
          <select
            value={filters.area_id || ''}
            onChange={(e) => handleChange('area_id', e.target.value)}
            className="form-input"
          >
            <option value="">All Areas</option>
            <option value="1">Rawalpindi</option>
            <option value="2">Islamabad</option>
            <option value="3">Lahore</option>
          </select>
        </div>
        
        <div>
          <label className="form-label">Status</label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleChange('status', e.target.value)}
            className="form-input"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        
        <div>
          <label className="form-label">Warranty Status</label>
          <select
            value={filters.warranty_status || ''}
            onChange={(e) => handleChange('warranty_status', e.target.value)}
            className="form-input"
          >
            <option value="">All Types</option>
            <option value="In Warranty">In Warranty</option>
            <option value="Out of Warranty">Out of Warranty</option>
            <option value="Contract Warranty">Contract Warranty</option>
            <option value="Contract Paid">Contract Paid</option>
          </select>
        </div>
        
        <div>
          <label className="form-label">Group By</label>
          <select
            value={filters.group_by || 'day'}
            onChange={(e) => handleChange('group_by', e.target.value)}
            className="form-input"
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
          </select>
        </div>
      </div>
      
      <div className="mt-4 flex justify-end">
        <button
          onClick={onApply}
          className="btn btn-primary"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default ReportFilters;