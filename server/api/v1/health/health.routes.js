const express = require('express');
const router = express.Router();

// Health check endpoint (for Render.com sleep prevention)
// This is also defined in app.js, but we'll keep it here for consistency
router.get('/ping', (req, res) => {
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
});

module.exports = router;