require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ConsentHub API Gateway',
    version: '1.0.0'
  });
});

// API Documentation
app.get('/api-docs', (req, res) => {
  res.json({
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

// Basic API routes
app.get('/api/v1/consent/health', (req, res) => {
  res.json({ service: 'consent-service', status: 'running' });
});

app.get('/api/v1/preference/health', (req, res) => {
  res.json({ service: 'preference-service', status: 'running' });
});

app.get('/api/v1/privacy-notice/health', (req, res) => {
  res.json({ service: 'privacy-notice-service', status: 'running' });
});

app.get('/api/v1/agreement/health', (req, res) => {
  res.json({ service: 'agreement-service', status: 'running' });
});

app.get('/api/v1/event/health', (req, res) => {
  res.json({ service: 'event-service', status: 'running' });
});

app.get('/api/v1/party/health', (req, res) => {
  res.json({ service: 'party-service', status: 'running' });
});

app.get('/api/v1/auth/health', (req, res) => {
  res.json({ service: 'auth-service', status: 'running' });
});

app.get('/api/v1/dsar/health', (req, res) => {
  res.json({ service: 'dsar-service', status: 'running' });
});

// Catch-all route
app.get('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'API endpoint not found',
    availableEndpoints: ['/health', '/api-docs', '/api/v1/*/health']
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Gateway error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`🚀 ConsentHub API Gateway running on ${HOST}:${PORT}`);
  console.log(`📚 API Documentation available at http://${HOST}:${PORT}/api-docs`);
  console.log(`❤️  Health check available at http://${HOST}:${PORT}/health`);
});

module.exports = app;
