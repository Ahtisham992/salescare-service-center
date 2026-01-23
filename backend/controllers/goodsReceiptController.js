// backend/controllers/goodsReceiptController.js
const { query, transaction } = require("../config/database");
const { generateGRNumber } = require("../utils/autoNumber");
const { processGoodsReceipt } = require("../services/inventoryService");

// @desc    Get all goods receipts
// @route   GET /api/goods-receipts
// @access  Private
const getAllGoodsReceipts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      po_id,
      area_id,
      date_from,
      date_to,
      search,
    } = req.query;

    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (po_id) {
      conditions.push(`gr.po_id = $${paramCount}`);
      params.push(po_id);
      paramCount++;
    }

    if (area_id) {
      conditions.push(`gr.area_id = $${paramCount}`);
      params.push(area_id);
      paramCount++;
    }

    if (date_from) {
      conditions.push(`gr.gr_date >= $${paramCount}`);
      params.push(date_from);
      paramCount++;
    }

    if (date_to) {
      conditions.push(`gr.gr_date <= $${paramCount}`);
      params.push(date_to);
      paramCount++;
    }

    if (search) {
      conditions.push(`(
        gr.gr_number ILIKE $${paramCount} OR
        po.po_number ILIKE $${paramCount} OR
        v.vendor_name ILIKE $${paramCount}
      )`);
      params.push(`%${search}%`);
      paramCount++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get total count
    const countResult = await query(
      `
      SELECT COUNT(*) as total FROM goods_receipts gr ${whereClause}
    `,
      params,
    );

    const totalGRs = parseInt(countResult.rows[0].total);

    // Get goods receipts
    params.push(limit, offset);

    const result = await query(
      `
      SELECT 
        gr.gr_id,
        gr.gr_number,
        gr.gr_date,
        gr.notes,
        gr.created_at,
        po.po_id,
        po.po_number,
        po.po_date,
        v.vendor_name,
        v.vendor_code,
        oa.area_name,
        u.full_name as received_by_name,
        creator.full_name as created_by_name,
        (SELECT COUNT(*) FROM gr_items WHERE gr_id = gr.gr_id) as items_count,
        (
          SELECT SUM(gi.quantity_received * gi.unit_price)
          FROM gr_items gi
          WHERE gi.gr_id = gr.gr_id
        ) as total_amount
      FROM goods_receipts gr
      JOIN purchase_orders po ON gr.po_id = po.po_id
      JOIN vendors v ON po.vendor_id = v.vendor_id
      JOIN operational_areas oa ON gr.area_id = oa.area_id
      LEFT JOIN users u ON gr.received_by = u.user_id
      LEFT JOIN users creator ON po.created_by = creator.user_id
      ${whereClause}
      ORDER BY gr.gr_date DESC, gr.gr_id DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `,
      params,
    );

    res.json({
      success: true,
      data: {
        goods_receipts: result.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalGRs / limit),
          total_items: totalGRs,
          items_per_page: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get goods receipts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch goods receipts",
    });
  }
};

// @desc    Get goods receipt by ID
// @route   GET /api/goods-receipts/:id
// @access  Private
const getGoodsReceiptById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get GR header
    const grResult = await query(
      `
      SELECT 
        gr.*,
        po.po_number,
        po.po_date,
        v.vendor_id,
        v.vendor_name,
        v.vendor_code,
        v.vendor_type,
        oa.area_name,
        oa.area_code,
        u.full_name as received_by_name
      FROM goods_receipts gr
      JOIN purchase_orders po ON gr.po_id = po.po_id
      JOIN vendors v ON po.vendor_id = v.vendor_id
      JOIN operational_areas oa ON gr.area_id = oa.area_id
      LEFT JOIN users u ON gr.received_by = u.user_id
      WHERE gr.gr_id = $1
    `,
      [id],
    );

    if (grResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Goods receipt not found",
      });
    }

    // Get GR items
    const itemsResult = await query(
      `
      SELECT 
        gi.*,
        i.item_code,
        i.description,
        i.category,
        (gi.quantity_received * gi.unit_price) as line_total
      FROM gr_items gi
      JOIN items i ON gi.item_id = i.item_id
      WHERE gi.gr_id = $1
      ORDER BY gi.gr_item_id
    `,
      [id],
    );

    res.json({
      success: true,
      data: {
        ...grResult.rows[0],
        items: itemsResult.rows,
      },
    });
  } catch (error) {
    console.error("Get goods receipt error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch goods receipt details",
    });
  }
};

// @desc    Create goods receipt
// @route   POST /api/goods-receipts
// @access  Private
const createGoodsReceipt = async (req, res) => {
  try {
    const { po_id, gr_date, area_id, items, notes } = req.body;

    // 1. Basic Validation
    if (!po_id || !gr_date || !area_id) {
      return res
        .status(400)
        .json({
          success: false,
          message: "PO ID, GR date, and area are required",
        });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "At least one item is required" });
    }

    // 2. Fetch PO and its Items
    const poCheck = await query(
      `
      SELECT po.po_id, po.status, po.vendor_id 
      FROM purchase_orders po WHERE po.po_id = $1
    `,
      [po_id],
    );

    if (poCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase order not found" });
    }

    const purchaseOrder = poCheck.rows[0];
    if (purchaseOrder.status === "cancelled") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Cannot receive goods for cancelled purchase order",
        });
    }
    // Allow 'approved' (first time) or 'received' (if adding more items to a partially received PO - though usually status stays approved if partial)
    // For this logic, we assume status stays 'approved' until fully received.

    // 3. Fetch "Targets" (What was ordered)
    const poItemsResult = await query(
      "SELECT item_id, quantity, unit_price, status FROM po_items WHERE po_id = $1",
      [po_id],
    );

    // 4. Fetch "History" (What was already received in previous GRs)
    const previousReceiptsResult = await query(
      `
      SELECT gi.item_id, SUM(gi.quantity_received) as total_received
      FROM gr_items gi
      JOIN goods_receipts gr ON gi.gr_id = gr.gr_id
      WHERE gr.po_id = $1
      GROUP BY gi.item_id
    `,
      [po_id],
    );

    // Create a map of History
    const historyMap = {};
    previousReceiptsResult.rows.forEach((row) => {
      historyMap[row.item_id] = parseInt(row.total_received);
    });

    // 5. Build "Remaining Balance" Map
    const validationMap = {}; // item_id -> { allowed, unit_price, status, ordered }
    let isPOFullyCompleted = true; // Assumption, will be checked below

    poItemsResult.rows.forEach((poItem) => {
      const previouslyReceived = historyMap[poItem.item_id] || 0;
      const remaining = poItem.quantity - previouslyReceived;

      validationMap[poItem.item_id] = {
        ordered: poItem.quantity,
        received_before: previouslyReceived,
        remaining_allowed: remaining,
        unit_price: parseFloat(poItem.unit_price),
        status: poItem.status,
      };
    });

    // 6. Validate Incoming Items against Remaining Balance
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const validData = validationMap[item.item_id];

      if (!validData) {
        return res.status(400).json({
          success: false,
          message: `Item ID ${item.item_id} is not part of this Purchase Order.`,
        });
      }

      const qtyToReceive = parseInt(item.quantity_received);

      if (qtyToReceive <= 0) {
        return res.status(400).json({
          success: false,
          message: `Item ${item.item_id}: Quantity must be greater than 0.`,
        });
      }

      if (qtyToReceive > validData.remaining_allowed) {
        return res.status(400).json({
          success: false,
          message: `Item ${item.item_id} Error: You are trying to receive ${qtyToReceive}, but only ${validData.remaining_allowed} are remaining pending (Ordered: ${validData.ordered}, Prev Received: ${validData.received_before}).`,
        });
      }
    }

    // 7. Generate GR Number & Execute Transaction
    const grNumber = await generateGRNumber();

    const result = await transaction(async (client) => {
      // A. Insert GR Header
      const grResult = await client.query(
        `
        INSERT INTO goods_receipts (gr_number, po_id, gr_date, area_id, received_by, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
        [grNumber, po_id, gr_date, area_id, req.user.user_id, notes || null],
      );

      const grId = grResult.rows[0].gr_id;
      const grItems = [];

      // B. Insert GR Items
      for (const item of items) {
        const itemData = validationMap[item.item_id];

        const itemResult = await client.query(
          `
          INSERT INTO gr_items (gr_id, item_id, quantity_received, unit_price) 
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `,
          [grId, item.item_id, item.quantity_received, itemData.unit_price],
        );

        grItems.push({
          ...itemResult.rows[0],
          status: itemData.status,
        });
      }

      // C. Determine Final PO Status
      // We need to check if *after this transaction*, everything is fully received.
      let allItemsFullyReceived = true;

      for (const poItem of poItemsResult.rows) {
        // Find how much we are receiving NOW for this item
        const currentItem = items.find((i) => i.item_id === poItem.item_id);
        const nowReceiving = currentItem
          ? parseInt(currentItem.quantity_received)
          : 0;

        const previous = historyMap[poItem.item_id] || 0;
        const totalAfterThis = previous + nowReceiving;

        if (totalAfterThis < poItem.quantity) {
          allItemsFullyReceived = false;
          break; // Found one item that is still pending
        }
      }

      const newStatus = allItemsFullyReceived ? "received" : "approved";

      // Update PO Status
      await client.query(
        `
        UPDATE purchase_orders
        SET status = $1
        WHERE po_id = $2
      `,
        [newStatus, po_id],
      );

      return {
        gr: grResult.rows[0],
        items: grItems,
        poStatus: newStatus,
      };
    });

    // 8. Process Inventory (Outside DB transaction to keep it clean, or inside if inventoryService supports it)
    const inventoryResults = await processGoodsReceipt(
      result.gr.gr_id,
      result.gr.gr_number,
      result.items,
      area_id,
      req.user.user_id,
    );

    res.status(201).json({
      success: true,
      message: `Goods receipt created. PO Status: ${result.poStatus}`,
      data: {
        ...result,
        inventory_changes: inventoryResults,
      },
    });
  } catch (error) {
    console.error("Create goods receipt error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create goods receipt",
    });
  }
};

// @desc    Delete goods receipt
// @route   DELETE /api/goods-receipts/:id
// @access  Private (Admin only)
const deleteGoodsReceipt = async (req, res) => {
  try {
    const { id } = req.params;

    // Note: This should also reverse inventory transactions
    // For now, just prevent deletion if inventory was updated
    const txnCheck = await query(
      "SELECT transaction_id FROM inventory_transactions WHERE reference_id = $1 AND transaction_type = 'GR' LIMIT 1",
      [id],
    );

    if (txnCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete goods receipt with inventory transactions. Contact administrator.",
      });
    }

    const result = await query(
      "DELETE FROM goods_receipts WHERE gr_id = $1 RETURNING gr_number",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Goods receipt not found",
      });
    }

    res.json({
      success: true,
      message: `Goods receipt ${result.rows[0].gr_number} deleted successfully`,
    });
  } catch (error) {
    console.error("Delete GR error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete goods receipt",
    });
  }
};

module.exports = {
  getAllGoodsReceipts,
  getGoodsReceiptById,
  createGoodsReceipt,
  deleteGoodsReceipt,
};
