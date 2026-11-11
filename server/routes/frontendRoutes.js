const express = require('express');
const router = express.Router();
router.get('/', (req, res) => { res.status(200).json({ status: 'ok', message: 'Backend is running' }); });
const { login, logout } = require('../api/v1/auth/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// GET /auth/validate - check if token is valid and return user info
router.get('/auth/validate', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    data: {
      user: {
        id: req.user.userId,
        username: req.user.username,
        role: req.user.role
      }
    }
  });
});

// POST /auth/login - admin login
router.post('/auth/login', login);

// POST /auth/logout - admin logout
router.post('/auth/logout', logout);

module.exports = router;