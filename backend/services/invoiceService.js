// backend/services/invoiceService.js
const { query } = require('../config/database');

/**
 * Calculate GST amount
 * @param {number} amount - Base amount
 * @param {number} gstPercentage - GST percentage (e.g., 18)
 * @returns {number} GST amount
 */
const calculateGST = (amount, gstPercentage = 18) => {
  return (amount * gstPercentage) / 100;
};

/**
 * Calculate FST amount
 * @param {number} amount - Base amount
 * @param {number} fstPercentage - FST percentage (e.g., 16)
 * @returns {number} FST amount
 */
const calculateFST = (amount, fstPercentage = 16) => {
  return (amount * fstPercentage) / 100;
};

/**
 * Calculate line item totals with taxes
 */
const calculateLineItem = (quantity, ratePerUnit, gstPercentage = 0, fstPercentage = 0, discount = 0) => {
  const amount = quantity * ratePerUnit;
  const gstAmount = calculateGST(amount, gstPercentage);
  const fstAmount = calculateFST(amount, fstPercentage);
  const netAmount = amount + gstAmount + fstAmount - discount;

  return {
    amount: parseFloat(amount.toFixed(2)),
    gst_amount: parseFloat(gstAmount.toFixed(2)),
    fst_amount: parseFloat(fstAmount.toFixed(2)),
    discount: parseFloat(discount.toFixed(2)),
    net_amount: parseFloat(netAmount.toFixed(2))
  };
};

/**
 * Get MRQS items for a complaint to include in invoice
 */
const getMRQSItemsForComplaint = async (complaintId) => {
  const result = await query(`
    SELECT 
      mi.item_id,
      it.description,
      SUM(mi.quantity) as total_quantity,
      mi.unit_price,
      mi.item_status,
      SUM(mi.amount) as total_amount
    FROM material_requisitions mr
    JOIN mrqs_items mi ON mr.mrqs_id = mi.mrqs_id
    JOIN items it ON mi.item_id = it.item_id
    WHERE mr.complaint_id = $1 
      AND mr.status = 'Issued'
    GROUP BY mi.item_id, it.description, mi.unit_price, mi.item_status
  `, [complaintId]);

  return result.rows;
};

/**
 * Get MRTS items for a complaint to subtract from invoice
 */
const getMRTSItemsForComplaint = async (complaintId) => {
  const result = await query(`
    SELECT 
      mi.item_id,
      SUM(mi.quantity) as total_returned_quantity,
      SUM(mi.amount) as total_returned_amount
    FROM material_returns mr
    JOIN mrts_items mi ON mr.mrts_id = mi.mrts_id
    WHERE mr.complaint_id = $1
    GROUP BY mi.item_id
  `, [complaintId]);

  return result.rows;
};

/**
 * Calculate net parts amount for complaint (MRQS - MRTS)
 */
const calculateComplaintPartsAmount = async (complaintId) => {
  const mrqsItems = await getMRQSItemsForComplaint(complaintId);
  const mrtsItems = await getMRTSItemsForComplaint(complaintId);

  // Create a map of returned quantities
  const returnedMap = {};
  mrtsItems.forEach(item => {
    returnedMap[item.item_id] = {
      quantity: parseInt(item.total_returned_quantity),
      amount: parseFloat(item.total_returned_amount)
    };
  });

  // Calculate net items
  const netItems = mrqsItems.map(item => {
    const returned = returnedMap[item.item_id] || { quantity: 0, amount: 0 };
    const netQuantity = parseInt(item.total_quantity) - returned.quantity;
    const netAmount = parseFloat(item.total_amount) - returned.amount;

    return {
      item_id: item.item_id,
      description: item.description,
      quantity: netQuantity,
      unit_price: parseFloat(item.unit_price),
      item_status: item.item_status,
      amount: netAmount
    };
  }).filter(item => item.quantity > 0); // Only include items with net positive quantity

  const totalPartsAmount = netItems.reduce((sum, item) => sum + item.amount, 0);

  return {
    items: netItems,
    totalAmount: parseFloat(totalPartsAmount.toFixed(2))
  };
};

/**
 * Get service charges from complaint
 */
const getServiceCharges = async (complaintId) => {
  const result = await query(`
    SELECT 
      c.selected_service_charge,
      c.warranty_status,
      st.visit_charges_24h,
      st.visit_charges_48h,
      st.gas_charges,
      st.inspection_charges_csc,
      st.washing_charges,
      st.transport_charges_per_km,
      st.dismantling_charges,
      st.reinstallation_charges,
      p.product_name
    FROM complaints c
    LEFT JOIN service_tariffs st ON c.service_tariff_id = st.tariff_id
    LEFT JOIN products p ON c.product_id = p.product_id
    WHERE c.complaint_id = $1
  `, [complaintId]);

  return result.rows[0];
};

/**
 * Build complaint service invoice items
 */
const buildComplaintInvoiceItems = async (complaintId, serviceChargeType = null, additionalCharges = {}) => {
  const items = [];
  
  // Get service charges
  const serviceData = await getServiceCharges(complaintId);
  
  if (serviceData.selected_service_charge && parseFloat(serviceData.selected_service_charge) > 0) {
    // Use selected service charge
    items.push({
      item_type: 'SER',
      description: `Service Charges - ${serviceData.product_name || 'General Service'}`,
      quantity: 1,
      rate_per_unit: parseFloat(serviceData.selected_service_charge),
      gst_percentage: 0,
      fst_percentage: 16,
      discount: 0
    });
  } else if (serviceChargeType && serviceData[serviceChargeType]) {
    // Use specific tariff charge
    const chargeAmount = parseFloat(serviceData[serviceChargeType]);
    const chargeDescription = serviceChargeType
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    
    items.push({
      item_type: 'SER',
      description: chargeDescription,
      quantity: 1,
      rate_per_unit: chargeAmount,
      gst_percentage: 0,
      fst_percentage: 16,
      discount: 0
    });
  }

  // Add additional service charges if provided
  if (additionalCharges.transport && additionalCharges.transport > 0) {
    items.push({
      item_type: 'SER',
      description: 'Transport Charges',
      quantity: 1,
      rate_per_unit: parseFloat(additionalCharges.transport),
      gst_percentage: 0,
      fst_percentage: 0,
      discount: 0
    });
  }

  if (additionalCharges.dismantling && additionalCharges.dismantling > 0) {
    items.push({
      item_type: 'SER',
      description: 'Dismantling Charges',
      quantity: 1,
      rate_per_unit: parseFloat(additionalCharges.dismantling),
      gst_percentage: 0,
      fst_percentage: 0,
      discount: 0
    });
  }

  if (additionalCharges.reinstallation && additionalCharges.reinstallation > 0) {
    items.push({
      item_type: 'SER',
      description: 'Re-installation Charges',
      quantity: 1,
      rate_per_unit: parseFloat(additionalCharges.reinstallation),
      gst_percentage: 0,
      fst_percentage: 0,
      discount: 0
    });
  }

  // Get parts from MRQS (net of MRTS)
  const partsData = await calculateComplaintPartsAmount(complaintId);
  
  partsData.items.forEach(item => {
    items.push({
      item_type: 'PRD',
      description: item.description,
      quantity: item.quantity,
      rate_per_unit: item.unit_price,
      gst_percentage: 18,
      fst_percentage: 0,
      discount: 0
    });
  });

  return items;
};

/**
 * Calculate invoice totals from items
 */
const calculateInvoiceTotals = (items, globalDiscount = 0, waiveOff = 0) => {
  let subtotal = 0;
  let gstTotal = 0;
  let fstTotal = 0;

  items.forEach(item => {
    const itemCalc = calculateLineItem(
      item.quantity,
      item.rate_per_unit,
      item.gst_percentage || 0,
      item.fst_percentage || 0,
      item.discount || 0
    );

    subtotal += itemCalc.amount;
    gstTotal += itemCalc.gst_amount;
    fstTotal += itemCalc.fst_amount;
  });

  const netAmount = subtotal + gstTotal + fstTotal - globalDiscount - waiveOff;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    gst_total: parseFloat(gstTotal.toFixed(2)),
    fst_total: parseFloat(fstTotal.toFixed(2)),
    discount: parseFloat(globalDiscount.toFixed(2)),
    waive_off: parseFloat(waiveOff.toFixed(2)),
    net_amount: parseFloat(netAmount.toFixed(2))
  };
};

/**
 * Format invoice number with area code
 */
const formatInvoiceNumber = (invoiceNumber, areaCode) => {
  // If invoice number already has area code, return as is
  if (invoiceNumber.startsWith(areaCode)) {
    return invoiceNumber;
  }
  
  // Otherwise, replace generic prefix with area code
  const parts = invoiceNumber.split('-');
  if (parts.length === 3) {
    return `${areaCode}-${parts[1]}-${parts[2]}`;
  }
  
  return invoiceNumber;
};

module.exports = {
  calculateGST,
  calculateFST,
  calculateLineItem,
  getMRQSItemsForComplaint,
  getMRTSItemsForComplaint,
  calculateComplaintPartsAmount,
  getServiceCharges,
  buildComplaintInvoiceItems,
  calculateInvoiceTotals,
  formatInvoiceNumber
};