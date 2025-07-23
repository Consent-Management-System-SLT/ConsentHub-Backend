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
  origin: [
    'https://consent-management-system-api.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:4173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'x-correlation-id',
    'x-api-key',
    'x-client-id'
  ],
  credentials: true,
  optionsSuccessStatus: 200
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

// Demo users for authentication
const users = [
    { 
        id: "1", 
        email: "admin@sltmobitel.lk", 
        password: "admin123", 
        role: "admin", 
        name: "Admin User",
        phone: "+94771234567",
        organization: "SLT-Mobitel",
        createdAt: new Date().toISOString()
    },
    { 
        id: "2", 
        email: "csr@sltmobitel.lk", 
        password: "csr123", 
        role: "csr", 
        name: "CSR User",
        phone: "+94771234568",
        organization: "SLT-Mobitel",
        createdAt: new Date().toISOString()
    },
    { 
        id: "3", 
        email: "customer@sltmobitel.lk", 
        password: "customer123", 
        role: "customer", 
        name: "John Doe",
        phone: "+94771234569",
        organization: "SLT-Mobitel",
        address: "123 Main St, Colombo 03",
        createdAt: new Date().toISOString()
    }
];

// JWT token generation (simple demo version)
function generateToken(user) {
    // Simple base64 encoding for demo purposes
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// Token verification middleware
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
        if (decoded.exp < Date.now()) {
            return res.status(401).json({ error: 'Token expired' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
    }
}

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
  
  // Simple token validation (for demo purposes)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // In production, you'd validate this JWT token properly
    req.user = {
      id: '6',
      email: 'ojitharajapaksha@example.com',
      name: 'Ojitha Rajapaksha',
      phone: '+94775878565'
    };
  }
  
  next();
});

// Consent endpoints
app.get('/api/v1/consent', (req, res) => {
  // Handle query parameters for filtering/pagination
  const { page = 1, limit = 10, status, category } = req.query;
  
  // Mock consent data
  const consents = [
    {
      id: 'consent_1',
      customerId: '6', 
      category: 'marketing',
      purpose: 'Email marketing and promotional offers',
      status: 'granted',
      grantedAt: '2025-01-15T10:30:00Z',
      expiresAt: '2026-01-15T10:30:00Z',
      legalBasis: 'consent',
      source: 'web_form',
      metadata: {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        channel: 'website'
      }
    },
    {
      id: 'consent_2',
      customerId: '6',
      category: 'analytics',
      purpose: 'Website usage analytics and performance monitoring', 
      status: 'granted',
      grantedAt: '2025-01-10T14:20:00Z',
      expiresAt: '2026-01-10T14:20:00Z',
      legalBasis: 'consent',
      source: 'web_form',
      metadata: {
        ipAddress: '192.168.1.1', 
        userAgent: 'Mozilla/5.0...',
        channel: 'website'
      }
    },
    {
      id: 'consent_3',
      customerId: '6',
      category: 'functional',
      purpose: 'Essential website functionality',
      status: 'granted',
      grantedAt: '2025-01-01T00:00:00Z',
      expiresAt: null,
      legalBasis: 'legitimate_interest',
      source: 'system',
      metadata: {
        channel: 'automatic'
      }
    }
  ];

  // Apply filters if provided
  let filteredConsents = consents;
  if (status) {
    filteredConsents = filteredConsents.filter(c => c.status === status);
  }
  if (category) {
    filteredConsents = filteredConsents.filter(c => c.category === category);
  }

  // Calculate pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedConsents = filteredConsents.slice(startIndex, endIndex);

  res.status(200).json({
    success: true,
    data: {
      consents: paginatedConsents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredConsents.length,
        pages: Math.ceil(filteredConsents.length / limit)
      }
    },
    service: 'consent-service',
    timestamp: new Date().toISOString()
  });
});

// POST endpoint for creating consents
app.post('/api/v1/consent', (req, res) => {
  const { customerId, category, purpose, status = 'granted' } = req.body;
  
  const newConsent = {
    id: `consent_${Date.now()}`,
    customerId,
    category,
    purpose,
    status,
    grantedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
    legalBasis: 'consent',
    source: 'api',
    metadata: {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      channel: 'api'
    }
  };

  res.status(201).json({
    success: true,
    data: newConsent,
    message: 'Consent created successfully'
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

// Authentication login endpoint
app.post('/api/v1/auth/login', (req, res) => {
    const { email, password } = req.body;
    console.log("Login attempt:", email);
    
    if (!email || !password) {
        return res.status(400).json({ 
            error: true, 
            message: "Email and password required" 
        });
    }
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        return res.status(401).json({ 
            error: true, 
            message: "Invalid credentials" 
        });
    }
    
    const token = generateToken(user);
    console.log("Login successful:", user.email, "Role:", user.role);
    
    res.json({
        success: true,
        token: token,
        user: { 
            id: user.id, 
            email: user.email, 
            role: user.role, 
            name: user.name,
            phone: user.phone,
            organization: user.organization
        }
    });
});

// Get user profile
app.get('/api/v1/auth/profile', verifyToken, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
        return res.status(404).json({ 
            error: true, 
            message: "User not found" 
        });
    }
    
    res.json({
        success: true,
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            phone: user.phone,
            organization: user.organization,
            address: user.address,
            createdAt: user.createdAt
        }
    });
});

// Logout endpoint
app.post('/api/v1/auth/logout', verifyToken, (req, res) => {
    res.json({
        success: true,
        message: "Logged out successfully"
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

// Customer Dashboard endpoints
app.get('/api/v1/customer/dashboard/overview', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      totalConsents: 15,
      activeConsents: 12,
      pendingConsents: 2,
      expiredConsents: 1,
      recentActivity: [
        {
          id: '1',
          type: 'consent_updated',
          description: 'Marketing consent updated',
          timestamp: new Date().toISOString(),
          status: 'completed'
        },
        {
          id: '2', 
          type: 'consent_granted',
          description: 'Analytics consent granted',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'completed'
        }
      ],
      consentsByCategory: {
        marketing: { granted: 8, denied: 2 },
        analytics: { granted: 6, denied: 4 },
        functional: { granted: 10, denied: 0 },
        necessary: { granted: 10, denied: 0 }
      }
    }
  });
});

app.get('/api/v1/customer/dashboard/profile', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      id: '6',
      email: 'ojitharajapaksha@example.com',
      name: 'Ojitha Rajapaksha',
      phone: '+94775878565',
      preferences: {
        language: 'en',
        timezone: 'Asia/Colombo',
        notifications: {
          email: true,
          sms: false,
          push: true
        }
      },
      consentHistory: [
        {
          id: 'consent_1',
          category: 'marketing',
          status: 'granted',
          grantedAt: new Date(Date.now() - 86400000).toISOString(),
          purpose: 'Email marketing and promotional offers'
        },
        {
          id: 'consent_2',
          category: 'analytics',
          status: 'granted', 
          grantedAt: new Date(Date.now() - 172800000).toISOString(),
          purpose: 'Website analytics and performance tracking'
        }
      ]
    }
  });
});

app.get('/api/v1/customer/dashboard/consents', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      consents: [
        {
          id: 'consent_marketing_1',
          category: 'marketing',
          purpose: 'Email marketing and promotional communications',
          status: 'granted',
          grantedAt: '2025-01-15T10:30:00Z',
          expiresAt: '2026-01-15T10:30:00Z',
          canWithdraw: true
        },
        {
          id: 'consent_analytics_1',
          category: 'analytics', 
          purpose: 'Website usage analytics and performance monitoring',
          status: 'granted',
          grantedAt: '2025-01-10T14:20:00Z',
          expiresAt: '2026-01-10T14:20:00Z',
          canWithdraw: true
        },
        {
          id: 'consent_functional_1',
          category: 'functional',
          purpose: 'Essential website functionality and user preferences',
          status: 'granted',
          grantedAt: '2025-01-01T00:00:00Z',
          expiresAt: null,
          canWithdraw: false
        }
      ],
      totalCount: 3,
      grantedCount: 3,
      deniedCount: 0
    }
  });
});

// Individual consent management endpoints
app.get('/api/v1/consent/:id', (req, res) => {
  const { id } = req.params;
  
  const consent = {
    id,
    customerId: '6',
    category: 'marketing',
    purpose: 'Email marketing and promotional offers',
    status: 'granted',
    grantedAt: '2025-01-15T10:30:00Z',
    expiresAt: '2026-01-15T10:30:00Z',
    legalBasis: 'consent',
    source: 'web_form',
    withdrawHistory: [],
    metadata: {
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...',
      channel: 'website'
    }
  };

  res.status(200).json({
    success: true,
    data: consent
  });
});

app.put('/api/v1/consent/:id', (req, res) => {
  const { id } = req.params;
  const { status, purpose } = req.body;
  
  const updatedConsent = {
    id,
    customerId: '6',
    category: 'marketing',
    purpose: purpose || 'Email marketing and promotional offers',
    status: status || 'granted',
    grantedAt: '2025-01-15T10:30:00Z',
    updatedAt: new Date().toISOString(),
    expiresAt: '2026-01-15T10:30:00Z',
    legalBasis: 'consent',
    source: 'api_update'
  };

  res.status(200).json({
    success: true,
    data: updatedConsent,
    message: 'Consent updated successfully'
  });
});

app.delete('/api/v1/consent/:id', (req, res) => {
  const { id } = req.params;
  
  res.status(200).json({
    success: true,
    message: `Consent ${id} withdrawn successfully`,
    data: {
      id,
      status: 'withdrawn',
      withdrawnAt: new Date().toISOString()
    }
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
