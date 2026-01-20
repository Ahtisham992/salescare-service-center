// ============================================
// backend/controllers/areaController.js
// ============================================
const { query } = require('../config/database');

// Get all operational areas
const getAllAreas = async (req, res) => {
  try {
    const { is_active } = req.query;
    const conditions = [];
    const params = [];

    if (is_active !== undefined) {
      conditions.push('is_active = $1');
      params.push(is_active === 'true');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(`SELECT * FROM operational_areas ${whereClause} ORDER BY area_name`, params);

    res.json({ success: true, data: { areas: result.rows, count: result.rows.length } });
  } catch (error) {
    console.error('Get areas error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch operational areas' });
  }
};

// Get area by ID
const getAreaById = async (req, res) => {
  try {
    const result = await query('SELECT * FROM operational_areas WHERE area_id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Operational area not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get area error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch operational area' });
  }
};

// Create operational area
const createArea = async (req, res) => {
  try {
    const { area_name, area_code } = req.body;

    if (!area_name || !area_code) {
      return res.status(400).json({ success: false, message: 'Area name and code are required' });
    }

    const existingArea = await query('SELECT area_id FROM operational_areas WHERE area_code = $1', [area_code]);
    if (existingArea.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Area code already exists' });
    }

    const result = await query(`
      INSERT INTO operational_areas (area_name, area_code) VALUES ($1, $2) RETURNING *
    `, [area_name, area_code]);

    res.status(201).json({ success: true, message: 'Operational area created successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Create area error:', error);
    res.status(500).json({ success: false, message: 'Failed to create operational area' });
  }
};

// Update operational area
const updateArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { area_name, is_active } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (area_name !== undefined) {
      updates.push(`area_name = $${paramCount}`);
      params.push(area_name);
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
      UPDATE operational_areas SET ${updates.join(', ')} WHERE area_id = $${paramCount} RETURNING *
    `, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Operational area not found' });
    }

    res.json({ success: true, message: 'Operational area updated successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Update area error:', error);
    res.status(500).json({ success: false, message: 'Failed to update operational area' });
  }
};

// Delete operational area
const deleteArea = async (req, res) => {
  try {
    const { id } = req.params;

    const usageCheck = await query('SELECT complaint_id FROM complaints WHERE area_id = $1 LIMIT 1', [id]);
    if (usageCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete area with existing data. Deactivate instead.' });
    }

    const result = await query('DELETE FROM operational_areas WHERE area_id = $1 RETURNING area_name', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Operational area not found' });
    }

    res.json({ success: true, message: `Operational area ${result.rows[0].area_name} deleted successfully` });
  } catch (error) {
    console.error('Delete area error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete operational area' });
  }
};

const areaController = {
  getAllAreas,
  getAreaById,
  createArea,
  updateArea,
  deleteArea
};

// ============================================
// backend/controllers/tariffController.js
// ============================================

// Get all service tariffs
const getAllTariffs = async (req, res) => {
  try {
    const { product_id } = req.query;
    const conditions = [];
    const params = [];

    if (product_id) {
      conditions.push('st.product_id = $1');
      params.push(product_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(`
      SELECT 
        st.*,
        p.product_name,
        p.product_code
      FROM service_tariffs st
      JOIN products p ON st.product_id = p.product_id
      ${whereClause}
      ORDER BY p.product_name
    `, params);

    res.json({ success: true, data: { tariffs: result.rows, count: result.rows.length } });
  } catch (error) {
    console.error('Get tariffs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch service tariffs' });
  }
};

// Get tariff by ID
const getTariffById = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        st.*,
        p.product_name,
        p.product_code
      FROM service_tariffs st
      JOIN products p ON st.product_id = p.product_id
      WHERE st.tariff_id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service tariff not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get tariff error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch service tariff' });
  }
};

// Create service tariff
const createTariff = async (req, res) => {
  try {
    const {
      product_id,
      visit_charges_24h = 0,
      visit_charges_48h = 0,
      gas_charges = 0,
      inspection_charges_csc = 0,
      washing_charges = 0,
      transport_charges_per_km = 0,
      dismantling_charges = 0,
      reinstallation_charges = 0
    } = req.body;

    if (!product_id) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    // Check if tariff already exists for this product
    const existingTariff = await query('SELECT tariff_id FROM service_tariffs WHERE product_id = $1', [product_id]);
    if (existingTariff.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Service tariff already exists for this product' });
    }

    const result = await query(`
      INSERT INTO service_tariffs (
        product_id, visit_charges_24h, visit_charges_48h, gas_charges,
        inspection_charges_csc, washing_charges, transport_charges_per_km,
        dismantling_charges, reinstallation_charges
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
    `, [
      product_id, visit_charges_24h, visit_charges_48h, gas_charges,
      inspection_charges_csc, washing_charges, transport_charges_per_km,
      dismantling_charges, reinstallation_charges
    ]);

    res.status(201).json({ success: true, message: 'Service tariff created successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Create tariff error:', error);
    res.status(500).json({ success: false, message: 'Failed to create service tariff' });
  }
};

// Update service tariff
const updateTariff = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      visit_charges_24h,
      visit_charges_48h,
      gas_charges,
      inspection_charges_csc,
      washing_charges,
      transport_charges_per_km,
      dismantling_charges,
      reinstallation_charges
    } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (visit_charges_24h !== undefined) {
      updates.push(`visit_charges_24h = $${paramCount}`);
      params.push(visit_charges_24h);
      paramCount++;
    }

    if (visit_charges_48h !== undefined) {
      updates.push(`visit_charges_48h = $${paramCount}`);
      params.push(visit_charges_48h);
      paramCount++;
    }

    if (gas_charges !== undefined) {
      updates.push(`gas_charges = $${paramCount}`);
      params.push(gas_charges);
      paramCount++;
    }

    if (inspection_charges_csc !== undefined) {
      updates.push(`inspection_charges_csc = $${paramCount}`);
      params.push(inspection_charges_csc);
      paramCount++;
    }

    if (washing_charges !== undefined) {
      updates.push(`washing_charges = $${paramCount}`);
      params.push(washing_charges);
      paramCount++;
    }

    if (transport_charges_per_km !== undefined) {
      updates.push(`transport_charges_per_km = $${paramCount}`);
      params.push(transport_charges_per_km);
      paramCount++;
    }

    if (dismantling_charges !== undefined) {
      updates.push(`dismantling_charges = $${paramCount}`);
      params.push(dismantling_charges);
      paramCount++;
    }

    if (reinstallation_charges !== undefined) {
      updates.push(`reinstallation_charges = $${paramCount}`);
      params.push(reinstallation_charges);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const result = await query(`
      UPDATE service_tariffs SET ${updates.join(', ')} WHERE tariff_id = $${paramCount} RETURNING *
    `, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service tariff not found' });
    }

    res.json({ success: true, message: 'Service tariff updated successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Update tariff error:', error);
    res.status(500).json({ success: false, message: 'Failed to update service tariff' });
  }
};

// Delete service tariff
const deleteTariff = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM service_tariffs WHERE tariff_id = $1 RETURNING tariff_id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service tariff not found' });
    }

    res.json({ success: true, message: 'Service tariff deleted successfully' });
  } catch (error) {
    console.error('Delete tariff error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete service tariff' });
  }
};

const tariffController = {
  getAllTariffs,
  getTariffById,
  createTariff,
  updateTariff,
  deleteTariff
};

// Export both controllers
module.exports = {
  areaController,
  tariffController
};