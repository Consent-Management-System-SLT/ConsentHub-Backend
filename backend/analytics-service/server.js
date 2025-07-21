const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const analyticsRoutes = require('./routes/analyticsRoutes');
const { logger } = require('../shared/utils');
const { errorHandler } = require('../shared/middleware/errorHandler');

/**
 * TMF669 Compliant Analytics Service
 * Provides comprehensive analytics, compliance reporting, and performance monitoring
 * for the ConsentHub Privacy Management Platform
 */

class AnalyticsService {
  constructor() {
    this.app = express();
    this.port = process.env.ANALYTICS_PORT || 3006;
    this.mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/consenthub';
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  initializeMiddleware() {
    // Security middleware
    this.app.use(helmet({
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
    this.app.use(cors({
      origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        process.env.FRONTEND_URL,
      ].filter(Boolean),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Compression and parsing
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`, {
          service: 'analytics-service',
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
        });
      });
      
      next();
    });
  }

  initializeRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        service: 'analytics-service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      });
    });

    // API documentation endpoint
    this.app.get('/api-docs', (req, res) => {
      res.json({
        service: 'ConsentHub Analytics Service',
        version: '1.0.0',
        description: 'TMF669 compliant analytics and reporting service',
        endpoints: {
          '/analytics/consent': 'GET - Consent analytics dashboard',
          '/analytics/compliance': 'GET - Compliance and audit metrics',
          '/analytics/performance': 'GET - System performance metrics',
          '/analytics/trends': 'GET - Trend analysis over time',
          '/analytics/realtime': 'GET - Real-time system metrics',
          '/analytics/dashboard': 'GET - Consolidated dashboard data',
          '/analytics/report': 'POST - Generate custom reports',
          '/analytics/export/:format': 'GET - Export data in various formats',
        },
        compliance: {
          standards: ['TMF669', 'GDPR', 'CCPA', 'PDP'],
          features: [
            'Real-time consent analytics',
            'Compliance monitoring and reporting',
            'Performance tracking and alerting',
            'Predictive trend analysis',
            'Automated audit trail generation',
            'Multi-jurisdiction support',
          ],
        },
        authentication: 'Bearer token required',
        rateLimit: '100 requests per 15 minutes per IP',
      });
    });

    // Analytics routes
    this.app.use('/analytics', analyticsRoutes);

    // TMF669 API base path
    this.app.use('/tmf-api/privacyManagement/v1/analytics', analyticsRoutes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        service: 'analytics-service',
        timestamp: new Date().toISOString(),
      });
    });
  }

  initializeErrorHandling() {
    this.app.use(errorHandler);

    // Global error handler
    this.app.use((err, req, res, next) => {
      logger.error('Unhandled error in analytics service:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        service: 'analytics-service',
      });

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        service: 'analytics-service',
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      });
    });
  }

  async connectDatabase() {
    try {
      await mongoose.connect(this.mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      logger.info('Analytics Service connected to MongoDB', {
        service: 'analytics-service',
        database: 'consenthub',
      });

      // Set up database event listeners
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', {
          service: 'analytics-service',
          error: error.message,
        });
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected', {
          service: 'analytics-service',
        });
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected', {
          service: 'analytics-service',
        });
      });

    } catch (error) {
      logger.error('Failed to connect to MongoDB:', {
        service: 'analytics-service',
        error: error.message,
      });
      process.exit(1);
    }
  }

  async start() {
    try {
      await this.connectDatabase();

      this.server = this.app.listen(this.port, () => {
        logger.info(`Analytics Service started on port ${this.port}`, {
          service: 'analytics-service',
          port: this.port,
          environment: process.env.NODE_ENV || 'development',
        });
      });

      // Graceful shutdown handling
      const gracefulShutdown = async (signal) => {
        logger.info(`Received ${signal}. Starting graceful shutdown...`, {
          service: 'analytics-service',
        });

        // Close server
        if (this.server) {
          this.server.close(() => {
            logger.info('HTTP server closed', {
              service: 'analytics-service',
            });
          });
        }

        // Close database connection
        try {
          await mongoose.connection.close();
          logger.info('MongoDB connection closed', {
            service: 'analytics-service',
          });
        } catch (error) {
          logger.error('Error closing MongoDB connection:', {
            service: 'analytics-service',
            error: error.message,
          });
        }

        process.exit(0);
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
      logger.error('Failed to start Analytics Service:', {
        service: 'analytics-service',
        error: error.message,
      });
      process.exit(1);
    }
  }
}

// Start the service if this file is run directly
if (require.main === module) {
  const analyticsService = new AnalyticsService();
  analyticsService.start();
}

module.exports = AnalyticsService;
