const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.SWAGGER_PORT || 8080;

// Enable CORS for all routes
app.use(cors());

// Load OpenAPI specification
const swaggerDocument = YAML.load('./docs/openapi.yaml');

// Swagger UI options
const options = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showRequestHeaders: true,
    tryItOutEnabled: true,
    validatorUrl: null,
  },
  customSiteTitle: 'ConsentHub API Documentation',
};

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, options));

// Serve raw OpenAPI spec
app.get('/openapi.yaml', (req, res) => {
  res.setHeader('Content-Type', 'application/yaml');
  res.sendFile(path.join(__dirname, 'docs', 'openapi.yaml'));
});

app.get('/openapi.json', (req, res) => {
  res.json(swaggerDocument);
});

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'swagger-docs',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 ConsentHub API Documentation is running!`);
  console.log(`📖 Swagger UI: http://localhost:${PORT}/api-docs`);
  console.log(`📄 OpenAPI YAML: http://localhost:${PORT}/openapi.yaml`);
  console.log(`📄 OpenAPI JSON: http://localhost:${PORT}/openapi.json`);
  console.log(`🔗 Share with your team: http://localhost:${PORT}`);
  console.log(`\nPress Ctrl+C to stop the server\n`);
});

module.exports = app;
