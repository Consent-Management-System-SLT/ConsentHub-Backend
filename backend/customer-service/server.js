require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Set JWT_SECRET if not provided in environment
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'your-super-secret-jwt-key-for-customer-service-2024';
}

// Import shared utilities
const { logger, errorHandler } = require('../shared/utils');

// Import routes
const dashboardRoutes = require('./routes/dashboard');
const consentRoutes = require('./routes/consent');
const preferenceRoutes = require('./routes/preference');
const dsarRoutes = require('./routes/dsar');

const app = express();
const PORT = process.env.CUSTOMER_SERVICE_PORT || 3011;

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ConsentHub Customer Service API',
      version: '1.0.0',
      description: 'Customer Portal API for ConsentHub - Self-service consent and preference management',
      contact: {
        name: 'ConsentHub Support',
        email: 'support@consenhub.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for customer authentication'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Connect to MongoDB (disabled for demo)
// const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://consentuser:12345@consentcluster.ylmrqgl.mongodb.net/consentDB?retryWrites=true&w=majority';

// mongoose.connect(MONGODB_URI).then(() => {
//   logger.info('Customer Service connected to MongoDB');
// }).catch(err => {
//   logger.error('Failed to connect to MongoDB:', err);
//   process.exit(1);
// });

logger.info('MongoDB connection disabled for demo mode');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://127.0.0.1:5175', 'http://127.0.0.1:5176'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID']
}));

// Request logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'customer-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'ConsentHub Customer API'
}));

// API routes
app.use('/api/v1/customer/dashboard', dashboardRoutes);
app.use('/api/v1/customer/consents', consentRoutes);
app.use('/api/v1/customer/preferences', preferenceRoutes);
app.use('/api/v1/customer/dsar', dsarRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'ConsentHub Customer Service API',
    version: '1.0.0',
    documentation: `/api-docs`,
    endpoints: {
      dashboard: '/api/v1/customer/dashboard',
      consents: '/api/v1/customer/consents',
      preferences: '/api/v1/customer/preferences',
      dsar: '/api/v1/customer/dsar'
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The endpoint ${req.originalUrl} does not exist on this server`,
    availableEndpoints: [
      '/api/v1/customer/dashboard',
      '/api/v1/customer/consents',
      '/api/v1/customer/preferences',
      '/api/v1/customer/dsar'
    ]
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    logger.info('MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  mongoose.connection.close(() => {
    logger.info('MongoDB connection closed');
    process.exit(0);
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Customer Service running on port ${PORT}`, {
    environment: process.env.NODE_ENV || 'development',
    service: 'customer-service'
  });
  logger.info(`API Documentation: http://localhost:${PORT}/api-docs`);
});

module.exports = app;
