const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../../middleware/auth.middleware');
const { createCombo, updateCombo, setComboActive, getCombos } = require('./combos.controller');

router.get('/', getCombos);
router.use('/admin', protect, authorize('admin'));
router.get('/admin', getCombos);
router.post('/admin', createCombo);
router.put('/admin/:id', updateCombo);
router.patch('/admin/:id/status', setComboActive);

module.exports = router;
