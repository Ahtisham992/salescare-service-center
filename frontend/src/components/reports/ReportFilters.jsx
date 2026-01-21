// frontend/src/components/reports/ReportFilters.jsx
import React from 'react';
import { Calendar, X } from 'lucide-react';

const ReportFilters = ({ filters, onChange, onClear, onApply }) => {
  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  const hasFilters = Object.values(filters).some(v => v !== '' && v !== null);

  return (
    <div className="card mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Filters</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Date From */}
        <div>
          <label className="form-label">
            <Calendar className="w-4 h-4 inline mr-1" />
            From Date
          </label>
          <input
            type="date"
            value={filters.date_from || ''}
            onChange={(e) => handleChange('date_from', e.target.value)}
            className="form-input"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="form-label">
            <Calendar className="w-4 h-4 inline mr-1" />
            To Date
          </label>
          <input
            type="date"
            value={filters.date_to || ''}
            onChange={(e) => handleChange('date_to', e.target.value)}
            className="form-input"
          />
        </div>

        {/* Area Filter */}
        <div>
          <label className="form-label">Operational Area</label>
          <select
            value={filters.area_id || ''}
            onChange={(e) => handleChange('area_id', e.target.value)}
            className="form-input"
          >
            <option value="">All Areas</option>
            <option value="1">Rawalpindi Service Center</option>
            <option value="2">Islamabad Service Center</option>
            <option value="3">Lahore Service Center</option>
          </select>
        </div>

        {/* Status Filter (conditional) */}
        {filters.hasOwnProperty('status') && (
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
        )}

        {/* Warranty Filter (conditional) */}
        {filters.hasOwnProperty('warranty_status') && (
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
        )}

        {/* Group By (conditional) */}
        {filters.hasOwnProperty('group_by') && (
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
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 mt-4">
        {hasFilters && (
          <button
            onClick={onClear}
            className="btn btn-outline flex items-center text-gray-600"
          >
            <X className="w-4 h-4 mr-2" />
            Clear Filters
          </button>
        )}
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