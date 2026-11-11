const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../../middleware/auth.middleware');
const {
  getVariantsByProductId,
  getVariantById,
  createVariant,
  updateVariant,
  deleteVariant
} = require('./variants.controller');

// Variants routes - nested under products for product-specific variants
router.get('/products/:productId/variants', getVariantsByProductId);

// Variant-specific routes (protect and authorize apply to all)
router.use(protect);
router.use(authorize('admin'));

router.get('/:id', getVariantById);
router.post('/products/:productId/variants', createVariant);
router.put('/:id', updateVariant);
router.delete('/:id', deleteVariant);

module.exports = router;

