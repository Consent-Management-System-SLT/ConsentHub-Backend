require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Import shared utilities
const { connectDB, logger, errorHandler } = require('../shared/utils');

// Import routes
const partyRoutes = require('./routes/party');
const consentRoutes = require('./routes/consent');
const preferenceRoutes = require('./routes/preference');
const dsarRoutes = require('./routes/dsar');
const auditRoutes = require('./routes/audit');

const app = express();
const PORT = process.env.CSR_SERVICE_PORT || 3010;

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ConsentHub CSR Service API',
      version: '1.0.0',
      description: 'Customer Service Representative API for ConsentHub',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://consentuser:12345@consentcluster.ylmrqgl.mongodb.net/consentDB?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI).then(() => {
  logger.info('CSR Service connected to MongoDB');
}).catch(err => {
  logger.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'csr-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Test endpoint to check database connection
app.get('/test-db', async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    res.json({
      status: 'success',
      collections: collections.map(c => c.name),
      readyState: mongoose.connection.readyState
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use('/api/v1/party', partyRoutes);
app.use('/api/v1/parties', partyRoutes); // plural alias
app.use('/api/v1/consent', consentRoutes);
app.use('/api/v1/consents', consentRoutes); // plural alias
app.use('/api/v1/preference', preferenceRoutes);
app.use('/api/v1/preferences', preferenceRoutes); // plural alias
app.use('/api/v1/dsar', dsarRoutes);
app.use('/api/v1/dsars', dsarRoutes); // plural alias
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/audits', auditRoutes); // plural alias

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`CSR Service running on port ${PORT}`);
  logger.info(`API Documentation: http://localhost:${PORT}/api-docs`);
});

module.exports = app;
