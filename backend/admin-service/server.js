const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const adminRoutes = require('./routes/adminRoutes');

require('dotenv').config();

const app = express();
const PORT = process.env.ADMIN_SERVICE_PORT || 3009;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3001'
  ],
  credentials: true,
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'x-requested-with',
    'x-correlation-id',
    'X-Correlation-Id',
    'Access-Control-Allow-Origin'
  ]
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later'
    }
  }
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    correlationId: req.headers['x-correlation-id']
  });
  next();
});

// Routes
app.use('/api/v1/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    service: 'admin-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    dependencies: {
      database: 'connected', // Add actual database check
    },
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'ConsentHub Admin Service',
    version: '1.0.0',
    description: 'Administrative dashboard and system management service',
    documentation: `/api-docs`,
    endpoints: {
      dashboardOverview: '/api/v1/admin/dashboard/overview',
      userManagement: '/api/v1/admin/users',
      consentAnalytics: '/api/v1/admin/analytics/consents',
      complianceDashboard: '/api/v1/admin/compliance/dashboard',
      bulkOperations: '/api/v1/admin/bulk-operations'
    },
    features: [
      'System-wide dashboard aggregation',
      'User management and role assignment',
      'Consent and preference analytics',
      'Compliance monitoring and reporting',
      'Bulk operations and data import/export',
      'Service health monitoring',
      'Audit trail management'
    ],
    alignment: {
      standards: ['TMF632', 'TMF641', 'TMF669', 'TMF673'],
      compliance: ['GDPR', 'CCPA', 'PDP', 'PIPEDA']
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Admin service error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    service: 'admin-service'
  });
});

// Start server
const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 Admin Service running on http://localhost:${PORT}`);
      console.log(`📊 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log('🎯 Admin Service Features:');
      console.log('  ✅ System-wide dashboard aggregation');
      console.log('  ✅ User management and administration');
      console.log('  ✅ Consent and preference analytics');
      console.log('  ✅ Compliance monitoring (GDPR, CCPA, PDP)');
      console.log('  ✅ Bulk operations and data management');
      console.log('  ✅ Service health monitoring');
      console.log('  ✅ TMF Open API compliance');
    });
  } catch (error) {
    console.error('❌ Failed to start admin service:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
