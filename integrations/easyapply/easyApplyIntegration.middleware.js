const authenticateIntegration = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn(`[EasyApplyIntegration] 401 missing-token ${req.method} ${req.path}`);
    return res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_AUTHENTICATION',
        message: 'Missing or invalid Authorization header format'
      }
    });
  }

  const token = authHeader.split(' ')[1];
  const expectedSecret = process.env.EASYAPPLY_INTEGRATION_SECRET;

  if (!expectedSecret) {
    console.error('[EasyApplyIntegration] CRITICAL: EASYAPPLY_INTEGRATION_SECRET is not configured in the environment variables.');
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Integration configuration error'
      }
    });
  }

  if (token !== expectedSecret) {
    console.warn(`[EasyApplyIntegration] 403 invalid-token ${req.method} ${req.path}`);
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Invalid integration credentials'
      }
    });
  }

  console.log(`[EasyApplyIntegration] auth-ok ${req.method} ${req.path}`);
  next();
};

module.exports = { authenticateIntegration };
