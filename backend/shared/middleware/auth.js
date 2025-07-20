const admin = require('firebase-admin');
const logger = require('../utils/logger');

/**
 * Middleware to authenticate Firebase JWT tokens
 */
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization token is required'
        }
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Verify the Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Add user info to request object
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        role: decodedToken.role || 'customer',
        partyId: decodedToken.partyId,
        status: decodedToken.status || 'active'
      };

      // Add correlation ID if not present
      if (!req.headers['x-correlation-id']) {
        req.headers['x-correlation-id'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      next();
    } catch (tokenError) {
      logger.warn('Token verification failed', {
        error: tokenError.message,
        token: token.substring(0, 20) + '...', // Log only first 20 chars for security
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      if (tokenError.code === 'auth/id-token-expired') {
        return res.status(401).json({
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Token has expired'
          }
        });
      }

      if (tokenError.code === 'auth/id-token-revoked') {
        return res.status(401).json({
          error: {
            code: 'TOKEN_REVOKED',
            message: 'Token has been revoked'
          }
        });
      }

      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token'
        }
      });
    }
  } catch (error) {
    logger.error('Authentication middleware error', {
      error: error.message,
      ip: req.ip,
      path: req.path
    });

    return res.status(500).json({
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication service error'
      }
    });
  }
}

/**
 * Middleware to check user roles
 * @param {string|Array} allowedRoles - Allowed roles (string or array)
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'User not authenticated'
        }
      });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(req.user.role)) {
      logger.warn('Insufficient permissions', {
        userId: req.user.uid,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path,
        method: req.method
      });

      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Access denied. Required roles: ${roles.join(', ')}`
        }
      });
    }

    next();
  };
}

/**
 * Middleware to check if user account is active
 */
function requireActiveStatus(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'User not authenticated'
      }
    });
  }

  if (req.user.status !== 'active') {
    logger.warn('Inactive user attempted access', {
      userId: req.user.uid,
      status: req.user.status,
      path: req.path
    });

    return res.status(403).json({
      error: {
        code: 'ACCOUNT_INACTIVE',
        message: `Account status: ${req.user.status}. Please contact support.`
      }
    });
  }

  next();
}

/**
 * Optional authentication - doesn't fail if no token provided
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided, continue without authentication
    req.user = null;
    return next();
  }

  // Token provided, try to authenticate
  return authenticateToken(req, res, next);
}

module.exports = {
  authenticateToken,
  requireRole,
  requireActiveStatus,
  optionalAuth
};
