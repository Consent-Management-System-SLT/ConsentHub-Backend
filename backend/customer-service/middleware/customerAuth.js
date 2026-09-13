const jwt = require('jsonwebtoken');

const customerAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No token provided' }
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'CUSTOMER') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Customer access only' }
      });
    }

    req.customer = {
      partyId: decoded.partyId,
      sourceSystem: decoded.sourceSystem,
      sessionId: decoded.sub
    };

    next();
  } catch (error) {
    console.error('Customer Auth Error:', error);
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' }
    });
  }
};

module.exports = customerAuth;
