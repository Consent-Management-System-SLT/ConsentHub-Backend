const jwt = require('jsonwebtoken');
const { logger } = require('../../shared/utils');

// Customer authentication middleware - Simple version for demo
const authenticateCustomer = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7);
    
    // For demo purposes, we'll accept any token and set a default customer
    // In production, this would verify JWT tokens properly
    if (token && token.length > 0) {
      req.customer = {
        customerId: 'eea08c27-9f0f-4f8e-bba0-5a49f3fe8be5', // Default customer ID
        role: 'customer',
        email: 'customer@sltmobitel.lk',
        name: 'Robert Johnson'
      };
      next();
    } else {
      return res.status(401).json({
        error: 'Invalid token.'
      });
    }
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error during authentication.'
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.customer = decoded;
    } catch (error) {
      // Continue without authentication
      logger.debug('Optional auth failed, continuing without auth', { 
        error: error.message 
      });
    }
  }
  
  next();
};

// Rate limiting for customer endpoints
const customerRateLimit = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  authenticateCustomer,
  optionalAuth,
  customerRateLimit
};
