const jwt = require('jsonwebtoken');
const { logAuth, logAuthorization, logSecurityEvent } = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Store for refresh tokens (in production, use Redis or database)
const refreshTokens = new Set();

/**
 * Generate access token
 * @param {object} payload - Token payload
 * @returns {string} - JWT token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'student-accommodation-manager',
    audience: 'api',
  });
};

/**
 * Generate refresh token
 * @param {object} payload - Token payload
 * @returns {string} - JWT refresh token
 */
const generateRefreshToken = (payload) => {
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'student-accommodation-manager',
    audience: 'refresh',
  });
  refreshTokens.add(token);
  return token;
};

/**
 * Revoke refresh token
 * @param {string} token - Refresh token to revoke
 */
const revokeRefreshToken = (token) => {
  refreshTokens.delete(token);
};

/**
 * Middleware to verify JWT token
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  const ip = req.ip || req.connection.remoteAddress;

  if (!token) {
    logAuth({
      userId: null,
      action: 'ACCESS_DENIED_NO_TOKEN',
      ip,
      success: false,
    });

    return res.status(401).json({
      error: 'Access denied',
      message: 'No authentication token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'student-accommodation-manager',
      audience: 'api',
    });

    req.user = decoded;

    logAuth({
      userId: decoded.id,
      action: 'TOKEN_VERIFIED',
      ip,
      success: true,
      metadata: { username: decoded.username },
    });

    next();
  } catch (error) {
    let errorMessage = 'Invalid token';
    let logAction = 'INVALID_TOKEN';

    if (error.name === 'TokenExpiredError') {
      errorMessage = 'Token expired';
      logAction = 'TOKEN_EXPIRED';
    } else if (error.name === 'JsonWebTokenError') {
      errorMessage = 'Malformed token';
      logAction = 'MALFORMED_TOKEN';
    }

    logAuth({
      userId: null,
      action: logAction,
      ip,
      success: false,
      metadata: { error: error.message },
    });

    logSecurityEvent({
      eventType: 'INVALID_TOKEN_ATTEMPT',
      severity: 'MEDIUM',
      description: `Failed token verification: ${error.message}`,
      ip,
    });

    return res.status(403).json({
      error: 'Authentication failed',
      message: errorMessage,
    });
  }
};

/**
 * Middleware to check user role
 * @param {...string} allowedRoles - Roles allowed to access the route
 * @returns {function} - Express middleware function
 */
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;

    if (!req.user) {
      logAuthorization({
        userId: null,
        resource: req.path,
        action: 'ACCESS_DENIED_NO_USER',
        ip,
        success: false,
      });

      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logAuthorization({
        userId: req.user.id,
        resource: req.path,
        action: 'ROLE_DENIED',
        ip,
        success: false,
        metadata: {
          userRole: req.user.role,
          requiredRoles: allowedRoles,
        },
      });

      logSecurityEvent({
        eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        severity: 'HIGH',
        description: `User ${req.user.username} attempted to access ${req.path} without proper role`,
        ip,
        metadata: {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRoles: allowedRoles,
        },
      });

      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
      });
    }

    logAuthorization({
      userId: req.user.id,
      resource: req.path,
      action: 'ACCESS_GRANTED',
      ip,
      success: true,
      metadata: { role: req.user.role },
    });

    next();
  };
};

/**
 * Middleware to check resource ownership
 * @param {string} resourceIdParam - Request parameter containing resource ID
 * @param {string} userIdField - Field in user object to compare
 * @returns {function} - Express middleware function
 */
const authorizeOwnership = (resourceIdParam = 'id', userIdField = 'id') => {
  return (req, res, next) => {
    const resourceId = parseInt(req.params[resourceIdParam], 10);
    const userId = req.user[userIdField];
    const ip = req.ip || req.connection.remoteAddress;

    // Admins can access all resources
    if (req.user.role === 'admin') {
      return next();
    }

    if (resourceId !== userId) {
      logAuthorization({
        userId: req.user.id,
        resource: req.path,
        action: 'OWNERSHIP_DENIED',
        ip,
        success: false,
        metadata: {
          requestedResourceId: resourceId,
          userId,
        },
      });

      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own resources',
      });
    }

    next();
  };
};

/**
 * Middleware to log all authenticated requests
 */
const logAuthenticatedRequest = (req, res, next) => {
  if (req.user) {
    const ip = req.ip || req.connection.remoteAddress;

    logAuth({
      userId: req.user.id,
      action: 'API_REQUEST',
      ip,
      success: true,
      metadata: {
        method: req.method,
        path: req.path,
        query: req.query,
      },
    });
  }
  next();
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  revokeRefreshToken,
  authenticateToken,
  authorizeRole,
  authorizeOwnership,
  logAuthenticatedRequest,
  JWT_SECRET,
};
