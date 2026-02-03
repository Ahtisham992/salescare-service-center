// ============================================
// backend/controllers/productItemController.js - UPDATED WITH SELLING PRICE
// ============================================
const { query } = require('../config/database');

// ============================================
// PRODUCT CONTROLLER
// ============================================

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const { category, is_active, search } = req.query;
    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (category) {
      conditions.push(`category = $${paramCount}`);
      params.push(category);
      paramCount++;
    }

    if (is_active !== undefined) {
      conditions.push(`is_active = $${paramCount}`);
      params.push(is_active === 'true');
      paramCount++;
    }

    if (search) {
      conditions.push(`(product_name ILIKE $${paramCount} OR product_code ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(`
      SELECT * FROM products ${whereClause} ORDER BY product_name
    `, params);

    res.json({ success: true, data: { products: result.rows, count: result.rows.length } });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const result = await query('SELECT * FROM products WHERE product_id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
};

// Create product
const createProduct = async (req, res) => {
  try {
    const { product_name, product_code, category } = req.body;

    if (!product_name || !product_code) {
      return res.status(400).json({ success: false, message: 'Product name and code are required' });
    }

    const existingProduct = await query('SELECT product_id FROM products WHERE product_code = $1', [product_code]);
    if (existingProduct.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Product code already exists' });
    }

    const result = await query(`
      INSERT INTO products (product_name, product_code, category)
      VALUES ($1, $2, $3) RETURNING *
    `, [product_name, product_code, category]);

    res.status(201).json({ success: true, message: 'Product created successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { product_name, category, is_active } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (product_name !== undefined) {
      updates.push(`product_name = $${paramCount}`);
      params.push(product_name);
      paramCount++;
    }

    if (category !== undefined) {
      updates.push(`category = $${paramCount}`);
      params.push(category);
      paramCount++;
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      params.push(is_active);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    params.push(id);
    const result = await query(`
      UPDATE products SET ${updates.join(', ')} WHERE product_id = $${paramCount} RETURNING *
    `, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: 'Product updated successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const complaintCheck = await query('SELECT complaint_id FROM complaints WHERE product_id = $1 LIMIT 1', [id]);
    if (complaintCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete product with existing complaints' });
    }

    const result = await query('DELETE FROM products WHERE product_id = $1 RETURNING product_name', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: `Product ${result.rows[0].product_name} deleted successfully` });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
};

const productController = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};

// ============================================
// ITEM CONTROLLER - UPDATED WITH SELLING PRICE
// ============================================

// Get all items - NOW RETURNS SELLING PRICE
const getAllItems = async (req, res) => {
  try {
    const { category, is_active, search } = req.query;
    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (category) {
      conditions.push(`category = $${paramCount}`);
      params.push(category);
      paramCount++;
    }

    if (is_active !== undefined) {
      conditions.push(`is_active = $${paramCount}`);
      params.push(is_active === 'true');
      paramCount++;
    }

    if (search) {
      conditions.push(`(item_code ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(`
      SELECT 
        item_id,
        item_code,
        description,
        category,
        unit_price,
        selling_price,
        markup_percentage,
        is_active,
        created_at,
        (selling_price - unit_price) as profit_per_unit
      FROM items 
      ${whereClause} 
      ORDER BY item_code
    `, params);

    res.json({ success: true, data: { items: result.rows, count: result.rows.length } });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch items' });
  }
};

// Get item by ID
const getItemById = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        *,
        (selling_price - unit_price) as profit_per_unit
      FROM items 
      WHERE item_id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch item' });
  }
};

// Create item - WITH MARKUP SUPPORT
const createItem = async (req, res) => {
  try {
    const { 
      item_code, 
      description, 
      category, 
      unit_price,
      markup_percentage // NEW: Allow custom markup
    } = req.body;

    if (!item_code || !description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Item code and description are required' 
      });
    }

    const existingItem = await query('SELECT item_id FROM items WHERE item_code = $1', [item_code]);
    if (existingItem.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Item code already exists' 
      });
    }

    // Use provided markup or default to 20%
    const finalMarkup = markup_percentage !== undefined ? markup_percentage : 20.00;

    const result = await query(`
      INSERT INTO items (
        item_code, 
        description, 
        category, 
        unit_price,
        markup_percentage
      )
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `, [
      item_code, 
      description, 
      category, 
      unit_price || 0,
      finalMarkup
    ]);

    res.status(201).json({ 
      success: true, 
      message: 'Item created successfully', 
      data: result.rows[0] 
    });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ success: false, message: 'Failed to create item' });
  }
};

// Update item - WITH MARKUP SUPPORT
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      description, 
      category, 
      unit_price, 
      markup_percentage, // NEW: Allow markup updates
      is_active 
    } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      params.push(description);
      paramCount++;
    }

    if (category !== undefined) {
      updates.push(`category = $${paramCount}`);
      params.push(category);
      paramCount++;
    }

    if (unit_price !== undefined) {
      updates.push(`unit_price = $${paramCount}`);
      params.push(unit_price);
      paramCount++;
    }

    // NEW: Support markup percentage updates
    if (markup_percentage !== undefined) {
      updates.push(`markup_percentage = $${paramCount}`);
      params.push(markup_percentage);
      paramCount++;
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      params.push(is_active);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    params.push(id);
    const result = await query(`
      UPDATE items 
      SET ${updates.join(', ')} 
      WHERE item_id = $${paramCount} 
      RETURNING *,
        (selling_price - unit_price) as profit_per_unit
    `, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.json({ 
      success: true, 
      message: 'Item updated successfully', 
      data: result.rows[0] 
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ success: false, message: 'Failed to update item' });
  }
};

// Delete item
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    const usageCheck = await query('SELECT po_item_id FROM po_items WHERE item_id = $1 LIMIT 1', [id]);
    if (usageCheck.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete item with existing transactions' 
      });
    }

    const result = await query('DELETE FROM items WHERE item_id = $1 RETURNING description', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.json({ 
      success: true, 
      message: `Item ${result.rows[0].description} deleted successfully` 
    });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete item' });
  }
};

const itemController = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem
};

// Export both controllers
module.exports = {
  productController,
  itemController
};