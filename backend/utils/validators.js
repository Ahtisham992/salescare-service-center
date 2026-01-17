// backend/utils/validators.js

/**
 * Validate complaint data
 */
const validateComplaint = (data) => {
  const errors = [];

  if (!data.customer_id) {
    errors.push('Customer ID is required');
  }

  if (!data.product_id) {
    errors.push('Product ID is required');
  }

  if (!data.area_id) {
    errors.push('Operational area ID is required');
  }

  if (!data.warranty_status) {
    errors.push('Warranty status is required');
  }

  const validWarrantyStatuses = ['In Warranty', 'Out of Warranty', 'Contract Warranty', 'Contract Paid'];
  if (data.warranty_status && !validWarrantyStatuses.includes(data.warranty_status)) {
    errors.push(`Warranty status must be one of: ${validWarrantyStatuses.join(', ')}`);
  }

  if (!data.complaint_description) {
    errors.push('Complaint description is required');
  }

  if (data.priority) {
    const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
    if (!validPriorities.includes(data.priority)) {
      errors.push(`Priority must be one of: ${validPriorities.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate MRQS data
 */
const validateMRQS = (data) => {
  const errors = [];

  if (!data.complaint_id) {
    errors.push('Complaint ID is required');
  }

  if (!data.area_id) {
    errors.push('Operational area ID is required');
  }

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push('At least one item is required');
  }

  if (data.items && Array.isArray(data.items)) {
    data.items.forEach((item, index) => {
      if (!item.item_id) {
        errors.push(`Item ${index + 1}: Item ID is required`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Valid quantity is required`);
      }
      if (!item.item_status) {
        errors.push(`Item ${index + 1}: Item status is required`);
      } else {
        const validStatuses = ['UW', 'OPB', 'Con W', 'Con P'];
        if (!validStatuses.includes(item.item_status)) {
          errors.push(`Item ${index + 1}: Status must be one of: ${validStatuses.join(', ')}`);
        }
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};


/**
 * Validate MRTS data
 */
const validateMRTS = (data) => {
  const errors = [];

  if (!data.complaint_id) {
    errors.push('Complaint ID is required');
  }

  if (!data.area_id) {
    errors.push('Operational area ID is required');
  }

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push('At least one item is required');
  }

  if (data.items && Array.isArray(data.items)) {
    data.items.forEach((item, index) => {
      if (!item.item_id) {
        errors.push(`Item ${index + 1}: Item ID is required`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Valid quantity is required`);
      }
      if (!item.item_status) {
        errors.push(`Item ${index + 1}: Item status is required`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate invoice data
 */
const validateInvoice = (data) => {
  const errors = [];

  if (!data.invoice_type) {
    errors.push('Invoice type is required');
  }

  const validTypes = ['Counter Sale', 'Complaint Service'];
  if (data.invoice_type && !validTypes.includes(data.invoice_type)) {
    errors.push(`Invoice type must be one of: ${validTypes.join(', ')}`);
  }

  if (data.invoice_type === 'Complaint Service' && !data.complaint_id) {
    errors.push('Complaint ID is required for complaint service invoice');
  }

  if (data.invoice_type === 'Counter Sale' && !data.do_id) {
    errors.push('Delivery order ID is required for counter sale invoice');
  }

  if (!data.area_id) {
    errors.push('Operational area ID is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate purchase order data
 */
const validatePurchaseOrder = (data) => {
  const errors = [];

  if (!data.vendor_id) {
    errors.push('Vendor ID is required');
  }

  if (!data.po_date) {
    errors.push('Purchase order date is required');
  }

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push('At least one item is required');
  }

  if (data.items && Array.isArray(data.items)) {
    data.items.forEach((item, index) => {
      if (!item.item_id) {
        errors.push(`Item ${index + 1}: Item ID is required`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Valid quantity is required`);
      }
      if (!item.unit_price || item.unit_price < 0) {
        errors.push(`Item ${index + 1}: Valid unit price is required`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate goods receipt data
 */
const validateGoodsReceipt = (data) => {
  const errors = [];

  if (!data.po_id) {
    errors.push('Purchase order ID is required');
  }

  if (!data.gr_date) {
    errors.push('Goods receipt date is required');
  }

  if (!data.area_id) {
    errors.push('Operational area ID is required');
  }

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push('At least one item is required');
  }

  if (data.items && Array.isArray(data.items)) {
    data.items.forEach((item, index) => {
      if (!item.item_id) {
        errors.push(`Item ${index + 1}: Item ID is required`);
      }
      if (!item.quantity_received || item.quantity_received <= 0) {
        errors.push(`Item ${index + 1}: Valid quantity is required`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateComplaint,
  validateMRQS,
  validateMRTS,
  validateInvoice,
  validatePurchaseOrder,
  validateGoodsReceipt
};