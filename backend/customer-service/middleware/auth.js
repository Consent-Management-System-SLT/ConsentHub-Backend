const jwt = require('jsonwebtoken');
const { logger } = require('../../shared/utils');

// Customer authentication middleware - Using the same token format as main backend
const authenticateCustomer = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    console.log('🔍 VAS Auth Debug: Authorization header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ VAS Auth: No Bearer token provided');
      return res.status(401).json({
        error: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7);
    console.log('🔍 VAS Auth Debug: Token length:', token.length);
    console.log('🔍 VAS Auth Debug: Token starts with:', token.substring(0, 20) + '...');
    
    // Try both JWT and base64 token formats (main backend uses base64)
    try {
      let decoded = null;
      
      // First, try JWT verification
      if (token.includes('.')) {
        // This looks like a JWT token
        const secrets = [
          process.env.JWT_SECRET,
          'your-super-secret-jwt-key-2023',
          'your-secret-key',
          'consenthub-secret-key',
          'default-secret-key'
        ];
        
        let verificationSuccess = false;
        
        for (const secret of secrets) {
          if (secret) {
            try {
              decoded = jwt.verify(token, secret);
              console.log(`✅ VAS Auth: JWT verified with secret: ${secret}`);
              verificationSuccess = true;
              break;
            } catch (err) {
              console.log(`❌ VAS Auth: JWT verification failed with secret "${secret}":`, err.message);
            }
          }
        }
        
        if (!verificationSuccess) {
          throw new Error('JWT token verification failed with all secrets');
        }
      } else {
        // This is likely a base64 token (main backend format)
        console.log('🔍 VAS Auth: Attempting base64 decode for main backend token');
        const payload = JSON.parse(Buffer.from(token, 'base64').toString());
        
        // Check token expiration
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
          console.log('❌ VAS Auth: Token has expired');
          return res.status(401).json({
            error: 'Token has expired'
          });
        }
        
        decoded = payload;
        console.log('✅ VAS Auth: Base64 token decoded successfully');
      }
      
      console.log('🔍 VAS Auth Debug: Decoded payload keys:', Object.keys(decoded));
      
      // Set customer information from the decoded token (handle both id and userId fields)
      req.customer = {
        customerId: decoded.id || decoded.userId,
        role: decoded.role || 'customer',
        email: decoded.email,
        name: decoded.name || `${decoded.firstName || ''} ${decoded.lastName || ''}`.trim()
      };
      
      console.log(`🔐 VAS Auth: Customer ${req.customer.customerId} (${req.customer.email}) authenticated`);
      next();
    } catch (decodeError) {
      console.error('❌ VAS Auth: Token decode failed:', decodeError.message);
      console.log('🔍 VAS Auth Debug: Decode Error type:', decodeError.name);
      console.log('🔍 VAS Auth Debug: Token details:', {
        tokenLength: token.length,
        tokenStart: token.substring(0, 20) + '...',
        decodedPayload: jwt.decode(token)
      });
      return res.status(401).json({
        error: 'Invalid token.',
        details: decodeError.message
      });
    }
  } catch (error) {
    console.error('❌ VAS Auth: General authentication error:', error);
    logger.error('Authentication error:', error);
    res.status(500).json({
      error: 'Authentication failed'
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-2023');
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
