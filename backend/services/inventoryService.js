// backend/services/inventoryService.js
const { query, transaction } = require('../config/database');

/**
 * Get or create inventory record for item in specific area
 */
const getOrCreateInventory = async (client, itemId, areaId) => {
  // Check if inventory record exists
  let result = await client.query(
    'SELECT * FROM inventory WHERE item_id = $1 AND area_id = $2',
    [itemId, areaId]
  );

  if (result.rows.length === 0) {
    // Create new inventory record
    result = await client.query(`
      INSERT INTO inventory (item_id, area_id, quantity_in_hand)
      VALUES ($1, $2, 0)
      RETURNING *
    `, [itemId, areaId]);
  }

  return result.rows[0];
};

/**
 * Update inventory quantity
 */
const updateInventoryQuantity = async (client, itemId, areaId, quantityChange, transactionData) => {
  // Get current inventory
  const inventory = await getOrCreateInventory(client, itemId, areaId);
  
  const quantityBefore = inventory.quantity_in_hand;
  const quantityAfter = quantityBefore + quantityChange;

  if (quantityAfter < 0) {
    throw new Error(`Insufficient stock for item ${itemId}. Available: ${quantityBefore}, Required: ${Math.abs(quantityChange)}`);
  }

  // Update inventory
  await client.query(`
    UPDATE inventory 
    SET 
      quantity_in_hand = $1,
      last_updated = CURRENT_TIMESTAMP
    WHERE item_id = $2 AND area_id = $3
  `, [quantityAfter, itemId, areaId]);

  // Log transaction
  await client.query(`
    INSERT INTO inventory_transactions (
      item_id,
      area_id,
      transaction_type,
      reference_id,
      reference_number,
      quantity_change,
      quantity_before,
      quantity_after,
      unit_price,
      performed_by,
      notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `, [
    itemId,
    areaId,
    transactionData.type,
    transactionData.referenceId,
    transactionData.referenceNumber,
    quantityChange,
    quantityBefore,
    quantityAfter,
    transactionData.unitPrice || 0,
    transactionData.performedBy,
    transactionData.notes || null
  ]);

  return {
    quantityBefore,
    quantityAfter,
    quantityChange
  };
};

/**
 * Process goods receipt - Add inventory
 */
const processGoodsReceipt = async (grId, grNumber, grItems, areaId, performedBy) => {
  return await transaction(async (client) => {
    const results = [];

    for (const item of grItems) {
      const result = await updateInventoryQuantity(
        client,
        item.item_id,
        areaId,
        item.quantity_received,
        {
          type: 'GR',
          referenceId: grId,
          referenceNumber: grNumber,
          unitPrice: item.unit_price,
          performedBy,
          notes: `Goods receipt from GR ${grNumber}`
        }
      );

      results.push({
        item_id: item.item_id,
        ...result
      });
    }

    return results;
  });
};

/**
 * Process MRQS issue - Deduct inventory
 */
const processMRQSIssue = async (mrqsId, mrqsNumber, mrqsItems, areaId, performedBy) => {
  return await transaction(async (client) => {
    const results = [];

    for (const item of mrqsItems) {
      const result = await updateInventoryQuantity(
        client,
        item.item_id,
        areaId,
        -item.quantity, // Negative for deduction
        {
          type: 'MRQS_ISSUE',
          referenceId: mrqsId,
          referenceNumber: mrqsNumber,
          unitPrice: item.unit_price,
          performedBy,
          notes: `Parts issued via MRQS ${mrqsNumber}`
        }
      );

      results.push({
        item_id: item.item_id,
        ...result
      });
    }

    return results;
  });
};

/**
 * Process MRTS return - Add inventory back
 */
const processMRTSReturn = async (mrtsId, mrtsNumber, mrtsItems, areaId, performedBy) => {
  return await transaction(async (client) => {
    const results = [];

    for (const item of mrtsItems) {
      const result = await updateInventoryQuantity(
        client,
        item.item_id,
        areaId,
        item.quantity, // Positive for return
        {
          type: 'MRTS_RETURN',
          referenceId: mrtsId,
          referenceNumber: mrtsNumber,
          unitPrice: item.unit_price,
          performedBy,
          notes: `Parts returned via MRTS ${mrtsNumber}`
        }
      );

      results.push({
        item_id: item.item_id,
        ...result
      });
    }

    return results;
  });
};

/**
 * Process delivery order - Deduct inventory
 */
const processDOIssue = async (doId, doNumber, doItems, areaId, performedBy) => {
  return await transaction(async (client) => {
    const results = [];

    for (const item of doItems) {
      const result = await updateInventoryQuantity(
        client,
        item.item_id,
        areaId,
        -item.quantity, // Negative for deduction
        {
          type: 'DO_ISSUE',
          referenceId: doId,
          referenceNumber: doNumber,
          unitPrice: item.unit_price,
          performedBy,
          notes: `Counter sale via DO ${doNumber}`
        }
      );

      results.push({
        item_id: item.item_id,
        ...result
      });
    }

    return results;
  });
};

/**
 * Check stock availability for multiple items
 */
const checkStockAvailability = async (items, areaId) => {
  const unavailableItems = [];

  for (const item of items) {
    const result = await query(`
      SELECT i.quantity_in_hand, it.description
      FROM inventory i
      JOIN items it ON i.item_id = it.item_id
      WHERE i.item_id = $1 AND i.area_id = $2
    `, [item.item_id, areaId]);

    if (result.rows.length === 0 || result.rows[0].quantity_in_hand < item.quantity) {
      unavailableItems.push({
        item_id: item.item_id,
        description: result.rows[0]?.description || 'Unknown item',
        required: item.quantity,
        available: result.rows[0]?.quantity_in_hand || 0
      });
    }
  }

  return {
    available: unavailableItems.length === 0,
    unavailableItems
  };
};

/**
 * Get current stock for an item in specific area
 */
const getCurrentStock = async (itemId, areaId) => {
  const result = await query(`
    SELECT 
      i.inventory_id,
      i.quantity_in_hand,
      it.item_code,
      it.description,
      it.unit_price,
      oa.area_name
    FROM inventory i
    JOIN items it ON i.item_id = it.item_id
    JOIN operational_areas oa ON i.area_id = oa.area_id
    WHERE i.item_id = $1 AND i.area_id = $2
  `, [itemId, areaId]);

  return result.rows[0] || null;
};

/**
 * Get inventory valuation
 */
const getInventoryValuation = async (areaId = null) => {
  let whereClause = '';
  const params = [];

  if (areaId) {
    whereClause = 'WHERE i.area_id = $1';
    params.push(areaId);
  }

  const result = await query(`
    SELECT 
      i.item_id,
      it.item_code,
      it.description,
      it.category,
      it.unit_price,
      SUM(i.quantity_in_hand) as total_quantity,
      SUM(i.quantity_in_hand * it.unit_price) as total_value
    FROM inventory i
    JOIN items it ON i.item_id = it.item_id
    ${whereClause}
    GROUP BY i.item_id, it.item_code, it.description, it.category, it.unit_price
    HAVING SUM(i.quantity_in_hand) > 0
    ORDER BY total_value DESC
  `, params);

  const summary = await query(`
    SELECT 
      COUNT(DISTINCT i.item_id) as unique_items,
      SUM(i.quantity_in_hand) as total_units,
      SUM(i.quantity_in_hand * it.unit_price) as total_value
    FROM inventory i
    JOIN items it ON i.item_id = it.item_id
    ${whereClause}
  `, params);

  return {
    items: result.rows,
    summary: summary.rows[0]
  };
};

module.exports = {
  getOrCreateInventory,
  updateInventoryQuantity,
  processGoodsReceipt,
  processMRQSIssue,
  processMRTSReturn,
  processDOIssue,
  checkStockAvailability,
  getCurrentStock,
  getInventoryValuation
};