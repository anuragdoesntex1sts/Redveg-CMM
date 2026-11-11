const express = require('express');
const router = express.Router();
const { protect } = require('../../../middleware/auth.middleware');
const {
  getLocations,
  getLocationByPincode,
  searchLocations,
  reverseGeocode
} = require('./delivery-locations.controller');

// Public routes
router.get('/', getLocations); // Get delivery locations with filtering
router.get('/search', searchLocations); // Search delivery locations
router.get('/:pincode', getLocationByPincode); // Get specific delivery location by pincode
router.post('/reverse-geocode', reverseGeocode); // Reverse geocode latitude/longitude

// Note: Delivery locations are typically reference data that might be updated infrequently
// If admin-only updates are needed, uncomment the following lines:
//
// router.use(protect);
// router.post('/', createLocation); // Create new delivery location
// router.put('/:pincode', updateLocation); // Update delivery location
// router.delete('/:pincode', deleteLocation); // Delete delivery location

module.exports = router;

