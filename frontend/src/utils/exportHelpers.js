// frontend/src/utils/exportHelpers.js

/**
 * Export data to CSV file
 */
export const exportToCSV = (data, filename = 'export.csv') => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Convert data to CSV
  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add headers
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Handle commas, quotes, and newlines in values
      if (value === null || value === undefined) return '';
      const escaped = String(value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  // Create blob and download
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
 * Export table to Excel (CSV format)
 */
export const exportTableToExcel = (tableData, filename = 'report.csv') => {
  exportToCSV(tableData, filename);
};

/**
 * Print report
 */
export const printReport = () => {
  window.print();
};

/**
 * Format data for export (clean up for CSV)
 */
export const formatForExport = (data, mapping = {}) => {
  return data.map(item => {
    const formatted = {};
    
    Object.keys(mapping).forEach(key => {
      const sourceKey = mapping[key] || key;
      formatted[key] = item[sourceKey];
    });
    
    return Object.keys(formatted).length > 0 ? formatted : item;
  });
};

/**
 * Generate filename with timestamp
 */
export const generateFilename = (prefix = 'report', extension = 'csv') => {
  const date = new Date();
  const timestamp = date.toISOString().split('T')[0];
  return `${prefix}_${timestamp}.${extension}`;
};

export default {
  exportToCSV,
  exportTableToExcel,
  printReport,
  formatForExport,
  generateFilename,
};