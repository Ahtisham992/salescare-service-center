// backend/utils/autoNumber.js
const { query } = require('../config/database');

/**
 * Generate unique complaint number
 * Format: AREA_CODE-YYYY-NNNNNN
 * Example: RWP-2025-000001
 */
const generateComplaintNumber = async (areaCode) => {
  const year = new Date().getFullYear();
  const prefix = `${areaCode}-${year}`;

  const result = await query(`
    SELECT complaint_number 
    FROM complaints 
    WHERE complaint_number LIKE $1 
    ORDER BY complaint_number DESC 
    LIMIT 1
  `, [`${prefix}-%`]);

  let nextNumber = 1;

  if (result.rows.length > 0) {
    const lastNumber = result.rows[0].complaint_number;
    const lastSeq = parseInt(lastNumber.split('-')[2]);
    nextNumber = lastSeq + 1;
  }

  const paddedNumber = String(nextNumber).padStart(6, '0');
  return `${prefix}-${paddedNumber}`;
};

/**
 * Generate unique MRQS number
 * Format: MRQS-YYYY-NNNNNN
 * Example: MRQS-2025-000001
 */
const generateMRQSNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `MRQS-${year}`;

  const result = await query(`
    SELECT mrqs_number 
    FROM material_requisitions 
    WHERE mrqs_number LIKE $1 
    ORDER BY mrqs_number DESC 
    LIMIT 1
  `, [`${prefix}-%`]);

  let nextNumber = 1;

  if (result.rows.length > 0) {
    const lastNumber = result.rows[0].mrqs_number;
    const lastSeq = parseInt(lastNumber.split('-')[2]);
    nextNumber = lastSeq + 1;
  }

  const paddedNumber = String(nextNumber).padStart(6, '0');
  return `${prefix}-${paddedNumber}`;
};

/**
 * Generate unique MRTS number
 * Format: MRTS-YYYY-NNNNNN
 * Example: MRTS-2025-000001
 */
const generateMRTSNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `MRTS-${year}`;

  const result = await query(`
    SELECT mrts_number 
    FROM material_returns 
    WHERE mrts_number LIKE $1 
    ORDER BY mrts_number DESC 
    LIMIT 1
  `, [`${prefix}-%`]);

  let nextNumber = 1;

  if (result.rows.length > 0) {
    const lastNumber = result.rows[0].mrts_number;
    const lastSeq = parseInt(lastNumber.split('-')[2]);
    nextNumber = lastSeq + 1;
  }

  const paddedNumber = String(nextNumber).padStart(6, '0');
  return `${prefix}-${paddedNumber}`;
};

/**
 * Generate unique invoice number (will be prefixed with area code later)
 * Format: YYYY-NNNNNN
 * Example: 2025-000001 (area code added in controller)
 */
const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();

  const result = await query(`
    SELECT invoice_number 
    FROM invoices 
    WHERE invoice_number LIKE $1 
    ORDER BY invoice_number DESC 
    LIMIT 1
  `, [`%-${year}-%`]);

  let nextNumber = 1;

  if (result.rows.length > 0) {
    const lastNumber = result.rows[0].invoice_number;
    const parts = lastNumber.split('-');
    if (parts.length === 3) {
      const lastSeq = parseInt(parts[2]);
      nextNumber = lastSeq + 1;
    }
  }

  const paddedNumber = String(nextNumber).padStart(6, '0');
  return `${year}-${paddedNumber}`;
};

/**
 * Generate unique delivery order number
 * Format: DO-YYYY-NNNNNN
 * Example: DO-2025-000001
 */
const generateDONumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `DO-${year}`;

  const result = await query(`
    SELECT do_number 
    FROM delivery_orders 
    WHERE do_number LIKE $1 
    ORDER BY do_number DESC 
    LIMIT 1
  `, [`${prefix}-%`]);

  let nextNumber = 1;

  if (result.rows.length > 0) {
    const lastNumber = result.rows[0].do_number;
    const lastSeq = parseInt(lastNumber.split('-')[2]);
    nextNumber = lastSeq + 1;
  }

  const paddedNumber = String(nextNumber).padStart(6, '0');
  return `${prefix}-${paddedNumber}`;
};

/**
 * Generate unique purchase order number
 * Format: PO-YYYY-NNNNNN
 * Example: PO-2025-000001
 */
const generatePONumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `PO-${year}`;

  const result = await query(`
    SELECT po_number 
    FROM purchase_orders 
    WHERE po_number LIKE $1 
    ORDER BY po_number DESC 
    LIMIT 1
  `, [`${prefix}-%`]);

  let nextNumber = 1;

  if (result.rows.length > 0) {
    const lastNumber = result.rows[0].po_number;
    const lastSeq = parseInt(lastNumber.split('-')[2]);
    nextNumber = lastSeq + 1;
  }

  const paddedNumber = String(nextNumber).padStart(6, '0');
  return `${prefix}-${paddedNumber}`;
};

/**
 * Generate unique goods receipt number
 * Format: GR-YYYY-NNNNNN
 * Example: GR-2025-000001
 */
const generateGRNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `GR-${year}`;

  const result = await query(`
    SELECT gr_number 
    FROM goods_receipts 
    WHERE gr_number LIKE $1 
    ORDER BY gr_number DESC 
    LIMIT 1
  `, [`${prefix}-%`]);

  let nextNumber = 1;

  if (result.rows.length > 0) {
    const lastNumber = result.rows[0].gr_number;
    const lastSeq = parseInt(lastNumber.split('-')[2]);
    nextNumber = lastSeq + 1;
  }

  const paddedNumber = String(nextNumber).padStart(6, '0');
  return `${prefix}-${paddedNumber}`;
};

module.exports = {
  generateComplaintNumber,
  generateMRQSNumber,
  generateMRTSNumber,
  generateInvoiceNumber,
  generateDONumber,
  generatePONumber,
  generateGRNumber
};