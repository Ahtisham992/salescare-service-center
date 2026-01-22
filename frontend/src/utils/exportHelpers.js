// frontend/src/utils/exportHelpers.js

/**
 * Convert array of objects to CSV string
 */
export const convertToCSV = (data) => {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      
      // Handle null/undefined
      if (value === null || value === undefined) return '';
      
      // Handle strings with commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
};

/**
 * Download CSV file
 */
export const exportToCSV = (data, filename = 'export.csv') => {
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
    URL.revokeObjectURL(url);
  } else {
    alert('Your browser does not support downloading files');
  }
};

/**
 * Generate filename with timestamp
 */
export const generateFilename = (baseName) => {
  const date = new Date();
  const timestamp = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return `${baseName}_${timestamp}.csv`;
};

/**
 * Export table to PDF (simple text-based)
 */
export const exportToPDF = (data, title, filename = 'export.txt') => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }
  
  const headers = Object.keys(data[0]);
  const maxWidths = headers.map(header => {
    const values = data.map(row => String(row[header] || '').length);
    return Math.max(header.length, ...values);
  });
  
  // Create header row
  let content = title + '\n';
  content += '='.repeat(80) + '\n\n';
  
  // Add headers
  content += headers.map((h, i) => h.padEnd(maxWidths[i])).join(' | ') + '\n';
  content += headers.map((h, i) => '-'.repeat(maxWidths[i])).join('-+-') + '\n';
  
  // Add data rows
  data.forEach(row => {
    content += headers.map((h, i) => 
      String(row[h] || '').padEnd(maxWidths[i])
    ).join(' | ') + '\n';
  });
  
  content += '\n' + '='.repeat(80) + '\n';
  content += `Generated: ${new Date().toLocaleString()}\n`;
  
  // Download as text file
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.replace('.txt', '_report.txt');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export data in multiple formats
 */
export const exportData = (data, filename, format = 'csv') => {
  if (format === 'csv') {
    exportToCSV(data, generateFilename(filename));
  } else if (format === 'pdf') {
    exportToPDF(data, filename.replace(/_/g, ' ').toUpperCase(), generateFilename(filename));
  }
};

export default {
  convertToCSV,
  exportToCSV,
  exportToPDF,
  exportData,
  generateFilename,
};