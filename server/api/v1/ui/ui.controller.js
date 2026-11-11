const { getDatabaseConnection } = require('../../../config/turso');
const { generateNotFoundError, generateValidationError } = require('../../../utils/error-classes');
const { generateUiId } = require('../../../utils/id-generator');
const logger = require('../../../utils/logger');

/**
 * Get UI settings by type and/or ID
 * @route GET /api/v1/ui/:type?
 * @route GET /api/v1/ui/:type/:id
 */
const getUiSettings = async (req, res) => {
  try {
    const db = await getDatabaseConnection('catalog');
    let sql = 'SELECT * FROM ui_settings';
    const args = [];

    if (req.params.type) {
      sql += ' WHERE type = ?';
      args.push(req.params.type);

      if (req.params.id) {
        sql += ' AND id = ?';
        args.push(req.params.id);
      }
    }

    sql += ' ORDER BY display_order ASC';

    const result = await db.execute({
      sql,
      args
    });

    if (req.params.type && req.params.id && result.rows.length === 0) {
      throw generateNotFoundError('UI setting not found');
    }

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: req.params.id ? result.rows[0] : result.rows
    });
  } catch (error) {
    if (error.type === 'not-found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    logger.error('Error fetching UI settings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create new UI setting
 * @route POST /api/v1/ui
 */
const createUiSetting = async (req, res) => {
  try {
    const { type, name, image_url, link_url, display_order, is_active } = req.body;

    // Validate required fields
    if (!type || !name) {
      throw generateValidationError('Type and name are required');
    }

    // Validate is_active if provided
    if (is_active !== undefined && typeof is_active !== 'boolean') {
      throw generateValidationError('is_active must be a boolean');
    }

    const db = await getDatabaseConnection('catalog');
    const uiId = generateUiId();

    await db.execute({
      sql: `
        INSERT INTO ui_settings (id, type, name, image_url, link_url, display_order, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        uiId,
        type,
        name,
        image_url || null,
        link_url || null,
        display_order !== undefined ? display_order : 0,
        is_active !== undefined ? (is_active ? 1 : 0) : 1
      ]
    });

    logger.info(`UI setting created: ${uiId} of type: ${type}`);

    res.status(201).json({
      success: true,
      message: 'UI setting created successfully',
      data: {
        id: uiId,
        type,
        name,
        image_url: image_url || null,
        link_url: link_url || null,
        display_order: display_order !== undefined ? display_order : 0,
        is_active: is_active !== undefined ? is_active : true
      }
    });
  } catch (error) {
    if (error.type === 'validation-error') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    logger.error('Error creating UI setting:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update UI setting
 * @route PUT /api/v1/ui/:id
 */
const updateUiSetting = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, name, image_url, link_url, display_order, is_active } = req.body;

    const db = await getDatabaseConnection('catalog');

    // Check if UI setting exists
    const uiResult = await db.execute({
      sql: 'SELECT id FROM ui_settings WHERE id = ?',
      args: [id]
    });

    if (uiResult.rows.length === 0) {
      throw generateNotFoundError('UI setting not found');
    }

    // If type is being updated, validate it
    if (type !== undefined) {
      const typeCheckResult = await db.execute({
        sql: 'SELECT id FROM ui_settings WHERE id = ? AND type = ?',
        args: [id, type]
      });

      if (typeCheckResult.rows.length === 0) {
        throw generateValidationError('UI setting type mismatch');
      }
    }

    // Build update query dynamically
    const updates = [];
    const args = [];

    if (name !== undefined) {
      updates.push('name = ?');
      args.push(name);
    }

    if (image_url !== undefined) {
      updates.push('image_url = ?');
      args.push(image_url);
    }

    if (link_url !== undefined) {
      updates.push('link_url = ?');
      args.push(link_url);
    }

    if (display_order !== undefined) {
      updates.push('display_order = ?');
      args.push(display_order);
    }

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      args.push(is_active ? 1 : 0);
    }

    // Only update type if explicitly provided and valid
    if (type !== undefined) {
      updates.push('type = ?');
      args.push(type);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    args.push(id);

    await db.execute({
      sql: `UPDATE ui_settings SET ${updates.join(', ')} WHERE id = ?`,
      args
    });

    logger.info(`UI setting updated: ${id}`);

    res.status(200).json({
      success: true,
      message: 'UI setting updated successfully'
    });
  } catch (error) {
    if (error.type === 'validation-error') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.type === 'not-found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    logger.error('Error updating UI setting:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete UI setting
 * @route DELETE /api/v1/ui/:id
 */
const deleteUiSetting = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabaseConnection('catalog');

    // Check if UI setting exists
    const uiResult = await db.execute({
      sql: 'SELECT id FROM ui_settings WHERE id = ?',
      args: [id]
    });

    if (uiResult.rows.length === 0) {
      throw generateNotFoundError('UI setting not found');
    }

    await db.execute({
      sql: 'DELETE FROM ui_settings WHERE id = ?',
      args: [id]
    });

    logger.info(`UI setting deleted: ${id}`);

    res.status(200).json({
      success: true,
      message: 'UI setting deleted successfully'
    });
  } catch (error) {
    if (error.type === 'not-found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    logger.error('Error deleting UI setting:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getUiSettings,
  createUiSetting,
  updateUiSetting,
  deleteUiSetting
};

