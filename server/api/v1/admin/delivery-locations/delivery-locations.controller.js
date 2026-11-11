const { getDatabaseConnection } = require('../../../../config/turso');
const { generateNotFoundError, generateValidationError } = require('../../../../utils/error-classes');
const logger = require('../../../../utils/logger');

/**
 * Get all delivery locations (including unavailable) for admin
 * @route GET /api/v1/admin/delivery-locations
 */
const getAllLocations = async (req, res) => {
  try {
    const { limit, offset } = req.query;

    let sql = 'SELECT * FROM available_pincodes';
    const args = [];

    if (limit !== undefined) {
      sql += ' LIMIT ?';
      args.push(parseInt(limit));
    }

    if (offset !== undefined) {
      sql += ' OFFSET ?';
      args.push(parseInt(offset));
    }

    const db = await getDatabaseConnection('availablePincodes');
    const result = args.length > 0 ? await db.execute({ sql, args }) : await db.execute(sql);

    const locations = result.rows.map(location => ({
      pincode: location.pincode,
      area: location.area || '',
      city: location.city || '',
      state: location.state || '',
      isServiceable: location.is_serviceable === 1,
      latitude: location.latitude,
      longitude: location.longitude,
      updatedAt: location.updated_at
    }));

    res.status(200).json({
      success: true,
      count: locations.length,
      total: locations.length,
      serviceableCount: locations.filter(loc => loc.isServiceable).length,
      data: locations
    });
  } catch (error) {
    if (error.type === 'validation-error') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    logger.error('Error fetching all delivery locations:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update delivery location availability
 * @route PATCH /api/v1/admin/delivery-locations/:pincode/availability
 */
const updateAvailability = async (req, res) => {
  try {
    const { pincode } = req.params;
    const { isServiceable } = req.body;

    // Validate pincode format
    if (!/^\d{6}$/.test(pincode)) {
      throw generateValidationError('Invalid pincode format');
    }

    // Validate isServiceable is boolean
    if (typeof isServiceable !== 'boolean') {
      throw generateValidationError('isServiceable must be a boolean');
    }

    const db = await getDatabaseConnection('availablePincodes');
    const result = await db.execute({
      sql: 'UPDATE available_pincodes SET is_serviceable = ?, updated_at = CURRENT_TIMESTAMP WHERE pincode = ?',
      args: [isServiceable ? 1 : 0, pincode]
    });

    if (result.rowsAffected === 0) {
      throw generateNotFoundError('Delivery location not found');
    }

    // Fetch the updated record
    const updatedResult = await db.execute({
      sql: 'SELECT * FROM available_pincodes WHERE pincode = ?',
      args: [pincode]
    });

    const location = updatedResult.rows[0];

    res.status(200).json({
      success: true,
      data: {
        pincode: location.pincode,
        area: location.area || '',
        city: location.city || '',
        state: location.state || '',
        isServiceable: location.is_serviceable === 1,
        latitude: location.latitude,
        longitude: location.longitude,
        updatedAt: location.updated_at
      }
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

    logger.error('Error updating delivery location availability:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllLocations,
  updateAvailability
};



