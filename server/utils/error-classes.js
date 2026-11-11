/**
 * Custom error classes for the RedVeg backend
 */

/**
 * Base custom error class
 */
class CustomError extends Error {
  constructor(message, type) {
    super(message);
    this.name = this.constructor.name;
    this.type = type; // e.g., 'validation-error', 'not-found', etc.
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error - for invalid input data
 */
class ValidationError extends CustomError {
  constructor(message) {
    super(message, 'validation-error');
  }
}

/**
 * Not found error - for resources that don't exist
 */
class NotFoundError extends CustomError {
  constructor(message) {
    super(message, 'not-found');
  }
}

/**
 * Authentication error - for auth/authorization issues
 */
class AuthError extends CustomError {
  constructor(message) {
    super(message, 'auth-error');
  }
}

/**
 * Out of stock error - for inventory issues
 */
class OutOfStockError extends CustomError {
  constructor(message) {
    super(message, 'out-of-stock');
  }
}

/**
 * Generate a validation error
 */
const generateValidationError = (message) => {
  return new ValidationError(message);
};

/**
 * Generate a not found error
 */
const generateNotFoundError = (message) => {
  return new NotFoundError(message);
};

/**
 * Generate an authentication error
 */
const generateAuthError = (message) => {
  return new AuthError(message);
};

/**
 * Generate an out of stock error
 */
const generateOutOfStockError = (message) => {
  return new OutOfStockError(message);
};

module.exports = {
  ValidationError,
  NotFoundError,
  AuthError,
  OutOfStockError,
  generateValidationError,
  generateNotFoundError,
  generateAuthError,
  generateOutOfStockError
};