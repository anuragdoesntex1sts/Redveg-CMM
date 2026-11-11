const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../../middleware/auth.middleware');
const {
  getUiSettings,
  createUiSetting,
  updateUiSetting,
  deleteUiSetting
} = require('./ui.controller');

// Public routes
router.get('/', getUiSettings); // Get all UI settings or filter by type via query param
router.get('/:type', getUiSettings); // Get all UI settings of a specific type
router.get('/:type/:id', getUiSettings); // Get specific UI setting by type and ID

// Admin only routes
router.use(protect);
router.use(authorize('admin'));

router.post('/', createUiSetting); // Create new UI setting
router.put('/:id', updateUiSetting); // Update UI setting
router.delete('/:id', deleteUiSetting); // Delete UI setting

module.exports = router;

