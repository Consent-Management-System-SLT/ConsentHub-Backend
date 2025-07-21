#!/usr/bin/env node

/**
 * ConsentHub Backend - Render Deployment Server
 * Single-server deployment version for Render hosting
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'production';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: true, // Allow all origins for now - configure in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Trust proxy for Render
app.set('trust proxy', true);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ConsentHub API Gateway',
    version: '1.0.0',
    environment: NODE_ENV,
    uptime: process.uptime()
  });
});

// API Documentation endpoint
app.get('/api-docs', (req, res) => {
  res.status(200).json({
    title: 'ConsentHub API',
    version: '1.0.0',
    description: 'TM Forum-compliant Consent Management System',
    endpoints: {
      health: '/health',
      consent: '/api/v1/consent',
      preference: '/api/v1/preference',
      'privacy-notice': '/api/v1/privacy-notice',
      agreement: '/api/v1/agreement',
      event: '/api/v1/event',
      party: '/api/v1/party',
      auth: '/api/v1/auth',
      dsar: '/api/v1/dsar'
    }
  });
});

// Microservice health endpoints
const services = ['consent', 'preference', 'privacy-notice', 'agreement', 'event', 'party', 'auth', 'dsar'];

services.forEach(service => {
  app.get(`/api/v1/${service}/health`, (req, res) => {
    res.status(200).json({
      service: `${service}-service`,
      status: 'running',
      timestamp: new Date().toISOString()
    });
  });
});

// Basic API endpoints structure
app.use('/api/v1', (req, res, next) => {
  // Add API versioning headers
  res.setHeader('API-Version', 'v1');
  res.setHeader('Service', 'ConsentHub');
  next();
});

// Consent endpoints
app.get('/api/v1/consent', (req, res) => {
  res.status(200).json({
    message: 'Consent service endpoint',
    service: 'consent-service',
    available_endpoints: [
      'GET /api/v1/consent',
      'POST /api/v1/consent',
      'GET /api/v1/consent/:id',
      'PUT /api/v1/consent/:id',
      'DELETE /api/v1/consent/:id'
    ]
  });
});

// Party endpoints
app.get('/api/v1/party', (req, res) => {
  res.status(200).json({
    message: 'Party service endpoint',
    service: 'party-service',
    available_endpoints: [
      'GET /api/v1/party',
      'POST /api/v1/party',
      'GET /api/v1/party/:id',
      'PUT /api/v1/party/:id',
      'DELETE /api/v1/party/:id'
    ]
  });
});

// Preference endpoints
app.get('/api/v1/preference', (req, res) => {
  res.status(200).json({
    message: 'Preference service endpoint',
    service: 'preference-service',
    available_endpoints: [
      'GET /api/v1/preference',
      'POST /api/v1/preference',
      'GET /api/v1/preference/:id',
      'PUT /api/v1/preference/:id',
      'DELETE /api/v1/preference/:id'
    ]
  });
});

// Privacy Notice endpoints
app.get('/api/v1/privacy-notice', (req, res) => {
  res.status(200).json({
    message: 'Privacy Notice service endpoint',
    service: 'privacy-notice-service',
    available_endpoints: [
      'GET /api/v1/privacy-notice',
      'POST /api/v1/privacy-notice',
      'GET /api/v1/privacy-notice/:id',
      'PUT /api/v1/privacy-notice/:id',
      'DELETE /api/v1/privacy-notice/:id'
    ]
  });
});

// Agreement endpoints
app.get('/api/v1/agreement', (req, res) => {
  res.status(200).json({
    message: 'Agreement service endpoint',
    service: 'agreement-service',
    available_endpoints: [
      'GET /api/v1/agreement',
      'POST /api/v1/agreement',
      'GET /api/v1/agreement/:id',
      'PUT /api/v1/agreement/:id',
      'DELETE /api/v1/agreement/:id'
    ]
  });
});

// Event endpoints
app.get('/api/v1/event', (req, res) => {
  res.status(200).json({
    message: 'Event service endpoint',
    service: 'event-service',
    available_endpoints: [
      'GET /api/v1/event',
      'POST /api/v1/event',
      'GET /api/v1/event/:id',
      'PUT /api/v1/event/:id',
      'DELETE /api/v1/event/:id'
    ]
  });
});

// Auth endpoints
app.get('/api/v1/auth', (req, res) => {
  res.status(200).json({
    message: 'Auth service endpoint',
    service: 'auth-service',
    available_endpoints: [
      'POST /api/v1/auth/login',
      'POST /api/v1/auth/logout',
      'POST /api/v1/auth/refresh',
      'GET /api/v1/auth/profile'
    ]
  });
});

// DSAR endpoints
app.get('/api/v1/dsar', (req, res) => {
  res.status(200).json({
    message: 'DSAR service endpoint',
    service: 'dsar-service',
    available_endpoints: [
      'GET /api/v1/dsar',
      'POST /api/v1/dsar',
      'GET /api/v1/dsar/:id',
      'PUT /api/v1/dsar/:id',
      'DELETE /api/v1/dsar/:id'
    ]
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'API endpoint not found',
    availableEndpoints: [
      '/health',
      '/api-docs',
      '/api/v1/*/health'
    ]
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.originalUrl} not found`,
    availableEndpoints: [
      '/health',
      '/api-docs',
      '/api/v1/consent',
      '/api/v1/party',
      '/api/v1/preference',
      '/api/v1/privacy-notice',
      '/api/v1/agreement',
      '/api/v1/event',
      '/api/v1/auth',
      '/api/v1/dsar'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 ConsentHub API Server Started');
  console.log('='.repeat(50));
  console.log(`📍 Environment: ${NODE_ENV}`);
  console.log(`🌐 Server running on port: ${PORT}`);
  console.log(`🔗 API Base URL: http://0.0.0.0:${PORT}`);
  console.log(`🏥 Health Check: http://0.0.0.0:${PORT}/health`);
  console.log(`📚 API Docs: http://0.0.0.0:${PORT}/api-docs`);
  console.log('='.repeat(50));
  console.log(`[${new Date().toISOString()}] Server ready to accept connections\n`);
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('\n🛑 Received shutdown signal, closing HTTP server...');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = app;
