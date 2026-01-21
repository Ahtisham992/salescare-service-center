// frontend/src/components/dashboard/QuickStats.jsx
import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const QuickStats = ({ stats }) => {
  const quickStats = [
    {
      label: 'Today',
      value: stats?.complaints?.today || 0,
      change: '+5',
      changeType: 'positive',
    },
    {
      label: 'This Week',
      value: stats?.complaints?.active || 0,
      change: '+12',
      changeType: 'positive',
    },
    {
      label: 'Avg Resolution',
      value: stats?.avg_resolution_hours ? `${Math.round(stats.avg_resolution_hours)}h` : 'N/A',
      change: '-2h',
      changeType: 'positive',
    },
    {
      label: 'Success Rate',
      value: stats?.complaints?.total > 0 
        ? `${Math.round((stats.complaints.completed / stats.complaints.total) * 100)}%`
        : '0%',
      change: '+3%',
      changeType: 'positive',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {quickStats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {stat.label}
            </span>
            {stat.change && (
              <span className={`flex items-center text-xs font-medium ${
                stat.changeType === 'positive' ? 'text-success-600' : 'text-danger-600'
              }`}>
                {stat.changeType === 'positive' ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {stat.change}
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuickStats;