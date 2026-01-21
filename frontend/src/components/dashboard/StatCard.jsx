// frontend/src/components/dashboard/StatCard.jsx
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  change, 
  changeType, 
  icon: Icon, 
  iconBg = 'bg-primary-100', 
  iconColor = 'text-primary-600',
  alert,
  onClick
}) => {
  const getTrendIcon = () => {
    if (!change) return null;
    
    if (changeType === 'positive') {
      return <TrendingUp className="w-3 h-3" />;
    } else if (changeType === 'negative') {
      return <TrendingDown className="w-3 h-3" />;
    } else {
      return <Minus className="w-3 h-3" />;
    }
  };

  const getTrendColor = () => {
    if (changeType === 'positive') return 'text-success-600';
    if (changeType === 'negative') return 'text-danger-600';
    return 'text-gray-600';
  };

  return (
    <div 
      className={`stat-card ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          
          {change && (
            <div className={`flex items-center mt-2 text-xs font-medium ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="ml-1">{change}</span>
              <span className="text-gray-500 ml-1">vs last month</span>
            </div>
          )}

          {alert && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                ⚠️ Needs attention
              </span>
            </div>
          )}
        </div>
        
        <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;