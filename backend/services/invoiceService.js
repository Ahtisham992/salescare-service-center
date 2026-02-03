// backend/services/invoiceService.js - WITH WARRANTY LOGIC
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
 * Determine if charges should be applied based on warranty status
 * 
 * STANDARD INDUSTRY RULES:
 * - Under Warranty (UW): Service FREE, Parts FREE, Visit CHARGED
 * - Out of Warranty (OPB): Service CHARGED, Parts CHARGED, Visit CHARGED
 * - Contract Warranty (Con W): Service FREE, Parts FREE, Visit CHARGED
 * - Contract Paid (Con P): Service CHARGED, Parts CHARGED, Visit CHARGED
 */
const getWarrantyChargeRules = (warrantyStatus) => {
  const rules = {
    'In Warranty': {
      chargeService: false,  // FREE
      chargeParts: false,    // FREE
      chargeVisit: true      // CHARGED
    },
    'Out of Warranty': {
      chargeService: true,   // CHARGED
      chargeParts: true,     // CHARGED
      chargeVisit: true      // CHARGED
    },
    'Contract Warranty': {
      chargeService: false,  // FREE (covered by contract)
      chargeParts: false,    // FREE (covered by contract)
      chargeVisit: true      // CHARGED
    },
    'Contract Paid': {
      chargeService: true,   // CHARGED (at contract rates)
      chargeParts: true,     // CHARGED
      chargeVisit: true      // CHARGED
    }
  };

  return rules[warrantyStatus] || rules['Out of Warranty']; // Default to charging if unknown
};

/**
 * Get MRQS items for a complaint to include in invoice
 * Now includes warranty-based filtering
 */
const getMRQSItemsForComplaint = async (complaintId, warrantyStatus) => {
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

  const rules = getWarrantyChargeRules(warrantyStatus);
  
  // Filter items based on warranty rules
  return result.rows.map(item => {
    let chargeAmount = parseFloat(item.total_amount);
    let unitPrice = parseFloat(item.unit_price);
    
    // Apply warranty rules
    if (!rules.chargeParts) {
      // Under warranty or contract warranty - parts are FREE
      chargeAmount = 0;
      unitPrice = 0;
    }
    
    return {
      ...item,
      total_quantity: parseInt(item.total_quantity),
      unit_price: unitPrice,
      total_amount: chargeAmount,
      warranty_waived: !rules.chargeParts // Flag to show it was waived
    };
  });
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
 * Calculate net parts amount for complaint (MRQS - MRTS) with warranty rules
 */
const calculateComplaintPartsAmount = async (complaintId, warrantyStatus) => {
  const mrqsItems = await getMRQSItemsForComplaint(complaintId, warrantyStatus);
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
      amount: netAmount,
      warranty_waived: item.warranty_waived
    };
  }).filter(item => item.quantity > 0); // Only include items with net positive quantity

  const totalPartsAmount = netItems.reduce((sum, item) => sum + item.amount, 0);

  return {
    items: netItems,
    totalAmount: parseFloat(totalPartsAmount.toFixed(2))
  };
};

/**
 * Get service charges from complaint with warranty info
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
 * Determine if a service charge is a "visit charge"
 */
const isVisitCharge = (serviceChargeType) => {
  return serviceChargeType === 'visit_charges_24h' || 
         serviceChargeType === 'visit_charges_48h';
};

/**
 * Build complaint service invoice items with WARRANTY LOGIC
 */
const buildComplaintInvoiceItems = async (complaintId, serviceChargeType = null, additionalCharges = {}) => {
  const items = [];
  
  // Get service charges and warranty status
  const serviceData = await getServiceCharges(complaintId);
  
  if (!serviceData) {
    throw new Error('Complaint data not found');
  }

  const warrantyStatus = serviceData.warranty_status;
  const rules = getWarrantyChargeRules(warrantyStatus);

  // Map service charge types to readable descriptions
  const serviceDescriptions = {
    'visit_charges_24h': 'Visit Charges (24 Hours)',
    'visit_charges_48h': 'Visit Charges (48 Hours)',
    'gas_charges': 'Gas Filling Charges',
    'inspection_charges_csc': 'Inspection Charges (CSC)',
    'washing_charges': 'Washing/Service Charges',
    'transport_charges_per_km': 'Transport Charges (per km)',
    'dismantling_charges': 'Dismantling Charges',
    'reinstallation_charges': 'Re-installation Charges'
  };

  // Add service charge based on serviceChargeType parameter with WARRANTY RULES
  if (serviceChargeType && serviceData[serviceChargeType]) {
    let chargeAmount = parseFloat(serviceData[serviceChargeType]);
    const isVisit = isVisitCharge(serviceChargeType);
    
    // Apply warranty rules for service charges
    if (!rules.chargeService && !isVisit) {
      // Under warranty or contract warranty - service is FREE (except visit charges)
      chargeAmount = 0;
    }
    
    // Only add if amount is greater than 0 OR if it's warranty-waived (to show as line item)
    if (chargeAmount > 0 || (!rules.chargeService && !isVisit)) {
      const description = serviceDescriptions[serviceChargeType] || 'Service Charges';
      const finalDescription = chargeAmount === 0 
        ? `${description} (Warranty Covered)` 
        : description;
      
      items.push({
        item_type: 'SER',
        description: finalDescription,
        quantity: 1,
        rate_per_unit: chargeAmount,
        gst_percentage: chargeAmount > 0 ? 18 : 0,
        fst_percentage: 0,
        discount: 0
      });
    }
  } 
  // Fallback: Use selected_service_charge if no serviceChargeType provided
  else if (serviceData.selected_service_charge && parseFloat(serviceData.selected_service_charge) > 0) {
    let chargeAmount = parseFloat(serviceData.selected_service_charge);
    
    // Apply warranty rules
    if (!rules.chargeService) {
      chargeAmount = 0;
    }
    
    if (chargeAmount > 0 || !rules.chargeService) {
      const description = chargeAmount === 0
        ? `Service Charges - ${serviceData.product_name || 'General Service'} (Warranty Covered)`
        : `Service Charges - ${serviceData.product_name || 'General Service'}`;
      
      items.push({
        item_type: 'SER',
        description: description,
        quantity: 1,
        rate_per_unit: chargeAmount,
        gst_percentage: chargeAmount > 0 ? 18 : 0,
        fst_percentage: 0,
        discount: 0
      });
    }
  }

  // Add custom additional charges (these are ALWAYS charged regardless of warranty)
  if (additionalCharges && typeof additionalCharges === 'object') {
    Object.values(additionalCharges).forEach(charge => {
      if (charge.description && charge.amount && parseFloat(charge.amount) > 0) {
        items.push({
          item_type: 'SER',
          description: charge.description,
          quantity: 1,
          rate_per_unit: parseFloat(charge.amount),
          gst_percentage: parseFloat(charge.gst_percentage || 18),
          fst_percentage: 0,
          discount: 0
        });
      }
    });
  }

  // Get parts from MRQS (net of MRTS) with warranty rules applied
  const partsData = await calculateComplaintPartsAmount(complaintId, warrantyStatus);
  
  partsData.items.forEach(item => {
    const description = item.warranty_waived && item.unit_price === 0
      ? `${item.description} (${item.item_status}) - Warranty Covered`
      : `${item.description} (${item.item_status})`;
    
    items.push({
      item_type: 'PRD',
      description: description,
      quantity: item.quantity,
      rate_per_unit: item.unit_price,
      gst_percentage: item.unit_price > 0 ? 18 : 0,
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
  formatInvoiceNumber,
  getWarrantyChargeRules // Export for testing/reference
};