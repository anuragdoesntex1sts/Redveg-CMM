const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../../../middleware/auth.middleware');
const {
  getAllLocations,
  updateAvailability
} = require('./delivery-locations.controller');

// Admin routes - protected and authorized for admins only
router.get('/', protect, authorize('admin'), getAllLocations);
router.patch('/:pincode/availability', protect, authorize('admin'), updateAvailability);

module.exports = router;