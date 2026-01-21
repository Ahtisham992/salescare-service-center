// frontend/src/components/dashboard/WarrantyPieChart.jsx
import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const WarrantyPieChart = ({ data }) => {
  // Transform data for pie chart
  const chartData = data?.map(item => ({
    name: item.warranty_status,
    value: parseInt(item.count) || 0,
    revenue: parseFloat(item.total_revenue) || 0,
  })) || [];

  // Colors for warranty statuses
  const COLORS = {
    'In Warranty': '#22c55e',
    'Out of Warranty': '#ef4444',
    'Contract Warranty': '#3b82f6',
    'Contract Paid': '#f59e0b',
  };

  // Get color for warranty status
  const getColor = (name) => COLORS[name] || '#6b7280';

  // Custom label
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{data.name}</p>
          <div className="space-y-1">
            <div className="flex justify-between space-x-4">
              <span className="text-sm text-gray-600">Count:</span>
              <span className="text-sm font-semibold text-gray-900">{data.value}</span>
            </div>
            <div className="flex justify-between space-x-4">
              <span className="text-sm text-gray-600">Revenue:</span>
              <span className="text-sm font-semibold text-gray-900">
                Rs. {parseFloat(data.revenue).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomLabel}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColor(entry.name)} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          formatter={(value, entry) => (
            <span className="text-sm">
              {value} ({entry.payload.value})
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default WarrantyPieChart;