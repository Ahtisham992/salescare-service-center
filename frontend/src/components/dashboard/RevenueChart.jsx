// frontend/src/components/dashboard/RevenueChart.jsx
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const RevenueChart = ({ data, type = 'bar' }) => {
  // Transform data for chart
  const chartData = data?.map(item => ({
    period: item.period,
    revenue: parseFloat(item.revenue) || 0,
    counter_sale: parseFloat(item.counter_sale_revenue) || 0,
    service: parseFloat(item.service_revenue) || 0,
    invoice_count: parseInt(item.invoice_count) || 0,
  })) || [];

  // Colors for bars
  const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between space-x-4 mb-1">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm text-gray-600 capitalize">{entry.name}:</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
          {payload[0]?.payload?.invoice_count && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <span className="text-xs text-gray-500">
                {payload[0].payload.invoice_count} invoices
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Format Y-axis values
  const formatYAxis = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value;
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
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="period" 
          stroke="#9ca3af"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke="#9ca3af"
          style={{ fontSize: '12px' }}
          tickFormatter={formatYAxis}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ fontSize: '14px' }}
          iconType="square"
        />
        <Bar 
          dataKey="revenue" 
          fill="#3b82f6" 
          radius={[4, 4, 0, 0]}
          name="Total Revenue"
        />
        <Bar 
          dataKey="counter_sale" 
          fill="#22c55e" 
          radius={[4, 4, 0, 0]}
          name="Counter Sale"
        />
        <Bar 
          dataKey="service" 
          fill="#f59e0b" 
          radius={[4, 4, 0, 0]}
          name="Service"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default RevenueChart;