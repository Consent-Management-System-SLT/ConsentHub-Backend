const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('../shared/config/database');
const authRoutes = require('./routes/authRoutes');
const authController = require('./controllers/authController');
const logger = require('../shared/utils/logger');

require('dotenv').config();

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 3007;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
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
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    correlationId: req.headers['x-correlation-id']
  });
  next();
});

// Routes
app.use('/api/v1/auth', authRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'ConsentHub Auth Service',
    version: '1.0.0',
    description: 'Firebase-based authentication service for ConsentHub',
    endpoints: {
      health: '/api/v1/auth/health',
      verifyToken: '/api/v1/auth/verify-token',
      createUser: '/api/v1/auth/users',
      getUser: '/api/v1/auth/users/{uid}',
      updateUser: '/api/v1/auth/users/{uid}',
      deleteUser: '/api/v1/auth/users/{uid}',
      listUsers: '/api/v1/auth/users',
      revokeSessions: '/api/v1/auth/users/{uid}/revoke-sessions'
    },
    documentation: 'https://api.consenhub.slt.lk/docs'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Auth service error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: err.errors
      }
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: {
        code: 'INVALID_ID',
        message: 'Invalid ID format'
      }
    });
  }

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An internal server error occurred'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.originalUrl} not found`
    }
  });
});

// Initialize server
async function startServer() {
  try {
    // Connect to database
    await connectDB();
    logger.info('Connected to MongoDB');

    // Initialize Firebase
    const firebaseResult = await authController.initializeFirebase();
    if (firebaseResult.success) {
      logger.info('Firebase Admin SDK initialized successfully');
    } else {
      logger.error('Failed to initialize Firebase:', firebaseResult.error);
      process.exit(1);
    }

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`Auth service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start auth service:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
