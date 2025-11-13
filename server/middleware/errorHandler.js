const { logger, logSecurityEvent } = require('../utils/logger');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;

  // Log error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip,
    user: req.user ? req.user.id : null,
  });

  // Determine if error is security-related
  const securityErrorPatterns = [
    'authentication',
    'authorization',
    'forbidden',
    'token',
    'permission',
    'sql injection',
    'xss',
  ];

  const isSecurityError = securityErrorPatterns.some((pattern) =>
    err.message.toLowerCase().includes(pattern)
  );

  if (isSecurityError) {
    logSecurityEvent({
      eventType: 'ERROR_SECURITY_RELATED',
      severity: 'HIGH',
      description: err.message,
      ip,
      metadata: {
        path: req.path,
        method: req.method,
        user: req.user ? req.user.id : null,
      },
    });
  }

  // Default error response
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized access';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Access forbidden';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Resource not found';
  } else if (err.code === 'SQLITE_CONSTRAINT') {
    statusCode = 409;
    message = 'Database constraint violation';
  }

  // Don't expose internal error details in production
  const errorResponse = {
    error: message,
    ...(process.env.NODE_ENV !== 'production' && {
      details: err.message,
      stack: err.stack,
    }),
  };

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 handler
 */
const notFoundHandler = (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;

  logger.warn('404 Not Found:', {
    path: req.path,
    method: req.method,
    ip,
  });

  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  });
};

/**
 * Async error wrapper
 * @param {function} fn - Async route handler
 * @returns {function} - Wrapped handler
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
