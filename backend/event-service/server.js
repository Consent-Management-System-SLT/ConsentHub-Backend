require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const WebSocket = require('ws');
const http = require('http');

const { connectDB, logger, errorHandler } = require('../shared/utils');
const { initializeFirebase } = require('../shared/auth');
const eventRoutes = require('./routes/event');
const eventController = require('./controllers/eventController');

const app = express();
const PORT = process.env.PORT || 3005;

// Initialize Firebase
initializeFirebase();

// Connect to MongoDB
connectDB(process.env.MONGODB_URI || 'mongodb://localhost:27017/consenhub');

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ConsentHub Event Service API',
      version: '1.0.0',
      description: 'TMF669 Event Schema - Event Management Service',
      contact: {
        name: 'SLT Mobitel',
        email: 'api@slt.lk',
      },
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
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    service: 'event-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API routes
app.use('/api/v1', eventRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    url: req.originalUrl,
  });
});

// Create HTTP server
const server = http.createServer(app);

// Setup WebSocket server
const wss = new WebSocket.Server({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  eventController.handleWebSocketConnection(ws, req);
});

// Start server
server.listen(PORT, () => {
  logger.info(`Event Service running on port ${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
  logger.info(`WebSocket server available at ws://localhost:${PORT}/ws`);
});

module.exports = app;
