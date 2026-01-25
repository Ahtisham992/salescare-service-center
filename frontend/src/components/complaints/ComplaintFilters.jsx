// ============================================
// 1. ComplaintFilters.jsx
// ============================================
import React from 'react';
import { Search, Filter, X } from 'lucide-react';

const ComplaintFilters = ({
  searchTerm,
  onSearchChange,
  showFilters,
  onToggleFilters,
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters
}) => {
  return (
    <div className="card mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by complaint #, customer name, phone..."
            value={searchTerm}
            onChange={onSearchChange}
            className="form-input pl-10 w-full"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleFilters}
            className={`btn ${showFilters ? "btn-primary" : "btn-outline"} flex items-center`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="btn btn-outline flex items-center text-danger-600 border-danger-600 hover:bg-danger-50"
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
          <div>
            <label className="form-label">Status</label>
            <select
              value={filters.status}
              onChange={(e) => onFilterChange("status", e.target.value)}
              className="form-input"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="form-label">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => onFilterChange("priority", e.target.value)}
              className="form-input"
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="form-label">Warranty Status</label>
            <select
              value={filters.warranty_status}
              onChange={(e) => onFilterChange("warranty_status", e.target.value)}
              className="form-input"
            >
              <option value="">All Types</option>
              <option value="In Warranty">In Warranty</option>
              <option value="Out of Warranty">Out of Warranty</option>
              <option value="Contract Warranty">Contract Warranty</option>
              <option value="Contract Paid">Contract Paid</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintFilters;
