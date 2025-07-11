require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const swaggerUi = require('swagger-ui-express');

const { logger } = require('../shared/utils');
const { initializeFirebase, verifyFirebaseToken } = require('../shared/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase
initializeFirebase();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Service URLs
const services = {
  consent: process.env.CONSENT_SERVICE_URL || 'http://localhost:3001',
  preference: process.env.PREFERENCE_SERVICE_URL || 'http://localhost:3002',
  'privacy-notice': process.env.PRIVACY_NOTICE_SERVICE_URL || 'http://localhost:3003',
  agreement: process.env.AGREEMENT_SERVICE_URL || 'http://localhost:3004',
  event: process.env.EVENT_SERVICE_URL || 'http://localhost:3005',
  party: process.env.PARTY_SERVICE_URL || 'http://localhost:3006',
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3007',
};

// API Gateway routes with proxy middleware
Object.entries(services).forEach(([serviceName, serviceUrl]) => {
  app.use(`/api/v1/${serviceName}`, createProxyMiddleware({
    target: serviceUrl,
    changeOrigin: true,
    pathRewrite: {
      [`^/api/v1/${serviceName}`]: '/api/v1',
    },
    onError: (err, req, res) => {
      logger.error(`Proxy error for ${serviceName}:`, err);
      res.status(500).json({ 
        error: 'Service temporarily unavailable',
        service: serviceName 
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      logger.info(`Proxying ${req.method} ${req.url} to ${serviceName}`);
    },
  }));
});

// Swagger configuration for API Gateway
const openApiSpec = require('./openapi');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

// Health check endpoint
app.get('/health', async (req, res) => {
  const serviceHealths = {};
  
  // Check health of all services
  for (const [serviceName, serviceUrl] of Object.entries(services)) {
    try {
      const response = await fetch(`${serviceUrl}/health`);
      serviceHealths[serviceName] = response.ok ? 'healthy' : 'unhealthy';
    } catch (error) {
      serviceHealths[serviceName] = 'unreachable';
    }
  }

  const overallHealth = Object.values(serviceHealths).every(status => status === 'healthy') 
    ? 'healthy' : 'degraded';

  res.json({
    service: 'api-gateway',
    status: overallHealth,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: serviceHealths,
  });
});

// Service discovery endpoint
app.get('/services', (req, res) => {
  res.json({
    services: Object.keys(services),
    endpoints: services,
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'ConsentHub API Gateway',
    version: '1.0.0',
    documentation: `http://localhost:${PORT}/api-docs`,
    services: Object.keys(services),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    url: req.originalUrl,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Gateway error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
  logger.info(`Services: ${Object.keys(services).join(', ')}`);
});

module.exports = app;
