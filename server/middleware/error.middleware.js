const { generateValidationError, generateNotFoundError, generateAuthError } = require('../utils/error-classes');
const logger = require('../utils/logger');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  logger.error('Unhandled error:', err);

  // Handle custom error types
  if (err.type === 'validation-error') {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  if (err.type === 'not-found') {
    return res.status(404).json({
      success: false,
      message: err.message
    });
  }

  if (err.type === 'auth-error') {
    return res.status(401).json({
      success: false,
      message: err.message
    });
  }

  if (err.type === 'out-of-stock') {
    return res.status(409).json({
      success: false,
      message: err.message
    });
  }

  // Handle Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size exceeds the limit'
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    // Only include error details in development
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
};

module.exports = {
  errorHandler
};