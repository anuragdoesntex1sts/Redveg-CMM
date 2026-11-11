const jwt = require('jsonwebtoken');
const { generateAuthError } = require('../utils/error-classes');
const { jwtSecret } = require('../config/env');

/**
 * Customer authentication middleware - verifies JWT token for customers
 */
const authenticateCustomer = (req, res, next) => {
  try {
    // Get token from cookies
    const token = req.cookies?.token;

    if (!token) {
      throw generateAuthError('Access denied. No token provided.');
    }

    // Verify token
    const decoded = jwt.verify(token, jwtSecret);

    // Attach customer info to request
    req.customer = {
      customerId: decoded.customerId,
      name: decoded.name,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    if (error.type === 'auth-error') {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  authenticateCustomer
};