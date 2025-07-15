const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const app = express();
const PORT = process.env.SWAGGER_PORT || 8080;

// Load the OpenAPI specification
const swaggerDocument = YAML.load(path.join(__dirname, 'docs', 'openapi.yaml'));

// Swagger UI options
const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    urls: [
      {
        url: '/api-docs/openapi.json',
        name: 'ConsentHub API - Complete'
      },
      {
        url: 'http://localhost:3000/api-docs-json',
        name: 'API Gateway'
      },
      {
        url: 'http://localhost:3001/api-docs-json',
        name: 'Consent Service'
      },
      {
        url: 'http://localhost:3002/api-docs-json',
        name: 'Preference Service'
      },
      {
        url: 'http://localhost:3003/api-docs-json',
        name: 'Privacy Notice Service'
      },
      {
        url: 'http://localhost:3004/api-docs-json',
        name: 'Agreement Service'
      },
      {
        url: 'http://localhost:3005/api-docs-json',
        name: 'Event Service'
      },
      {
        url: 'http://localhost:3006/api-docs-json',
        name: 'Party Service'
      },
      {
        url: 'http://localhost:3007/api-docs-json',
        name: 'Auth Service'
      },
      {
        url: 'http://localhost:3008/api-docs-json',
        name: 'DSAR Service'
      }
    ]
  }
};

// Serve the main OpenAPI spec
app.get('/api-docs/openapi.json', (req, res) => {
  res.json(swaggerDocument);
});

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'swagger-documentation',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Serve static files from docs directory
app.use('/docs', express.static(path.join(__dirname, 'docs')));

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

app.listen(PORT, () => {
  console.log(`📚 ConsentHub API Documentation Server running on port ${PORT}`);
  console.log(`🌐 Access documentation at: http://localhost:${PORT}/api-docs`);
  console.log(`📖 Static docs available at: http://localhost:${PORT}/docs`);
});

module.exports = app;
