const rateLimit = require('express-rate-limit');

const limited = (message) => ({ success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message } });
const base = { standardHeaders: true, legacyHeaders: false };

// Every API call, per IP. Generous, because one office IP serves many staff and the dashboards poll.
const apiLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_API_PER_MIN) || 600,
  skip: (req) => req.method === 'OPTIONS' || req.path === '/v1/health',
  message: limited('Too many requests. Please slow down and try again shortly.'),
});

// Login, registration and password reset are guessing targets. Successful logins are not counted.
const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AUTH_PER_15MIN) || 20,
  skipSuccessfulRequests: true,
  message: limited('Too many attempts. Please try again in 15 minutes.'),
});

module.exports = { apiLimiter, authLimiter };
