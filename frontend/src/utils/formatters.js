// frontend/src/utils/formatters.js
import { format, formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Format currency (Pakistani Rupees)
 */
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'Rs. 0.00';
  
  const num = parseFloat(amount);
  return `Rs. ${num.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format number with commas
 */
export const formatNumber = (number) => {
  if (!number && number !== 0) return '0';
  return parseFloat(number).toLocaleString('en-PK');
};

/**
 * Format date to readable string
 */
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
};

/**
 * Format date with time
 */
export const formatDateTime = (date) => {
  return formatDate(date, 'MMM dd, yyyy HH:mm');
};

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date) => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    console.error('Relative time formatting error:', error);
    return 'Unknown';
  }
};

/**
 * Format phone number (Pakistani format)
 */
export const formatPhone = (phone) => {
  if (!phone) return 'N/A';
  
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as 0300-1234567
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }
  
  return phone;
};

/**
 * Get status badge color
 */
export const getStatusColor = (status) => {
  const statusLower = status?.toLowerCase() || '';
  
  const colorMap = {
    // Complaint statuses
    'open': 'warning',
    'assigned': 'info',
    'in progress': 'primary',
    'completed': 'success',
    'cancelled': 'gray',
    
    // Invoice statuses
    'draft': 'gray',
    'issued': 'warning',
    'paid': 'success',
    
    // PO statuses
    'pending': 'warning',
    'approved': 'info',
    'received': 'success',
    
    // Delivery statuses
    'delivered': 'success',
    
    // MRQS statuses
    'rejected': 'danger',
  };
  
  return colorMap[statusLower] || 'gray';
};

/**
 * Get priority badge color
 */
export const getPriorityColor = (priority) => {
  const priorityLower = priority?.toLowerCase() || '';
  
  const colorMap = {
    'low': 'gray',
    'medium': 'info',
    'high': 'warning',
    'critical': 'danger',
  };
  
  return colorMap[priorityLower] || 'gray';
};

/**
 * Get warranty status badge color
 */
export const getWarrantyColor = (warrantyStatus) => {
  const statusLower = warrantyStatus?.toLowerCase() || '';
  
  if (statusLower.includes('in warranty')) return 'success';
  if (statusLower.includes('out of warranty')) return 'danger';
  if (statusLower.includes('contract')) return 'info';
  
  return 'gray';
};

/**
 * Truncate text
 */
export const truncate = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Capitalize first letter
 */
export const capitalize = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Format percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  if (!value && value !== 0) return '0%';
  return `${parseFloat(value).toFixed(decimals)}%`;
};

/**
 * Calculate percentage change
 */
export const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return null;
  return ((current - previous) / previous * 100).toFixed(1);
};

/**
 * Get initials from name
 */
export const getInitials = (name) => {
  if (!name) return '??';
  
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  
  return name.substring(0, 2).toUpperCase();
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

/**
 * Parse error message
 */
export const parseErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.response?.data?.errors) {
    const errors = error.response.data.errors;
    if (Array.isArray(errors)) {
      return errors.join(', ');
    }
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

/**
 * Debounce function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Download data as CSV
 */
export const downloadCSV = (data, filename) => {
  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * Convert array of objects to CSV
 */
const convertToCSV = (data) => {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(val => 
      typeof val === 'string' && val.includes(',') ? `"${val}"` : val
    ).join(',')
  );
  
  return [headers, ...rows].join('\n');
};

export default {
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatPhone,
  getStatusColor,
  getPriorityColor,
  getWarrantyColor,
  truncate,
  capitalize,
  formatPercentage,
  calculatePercentageChange,
  getInitials,
  formatFileSize,
  parseErrorMessage,
  debounce,
  downloadCSV,
};