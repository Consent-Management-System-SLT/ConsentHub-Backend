#!/usr/bin/env node

/**
 * ConsentHub Backend - Render Deployment Server
 * Single-server deployment version for Render hosting with MongoDB Atlas
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'production';

// MongoDB Atlas connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://consentuser:12345@consentcluster.ylmrqgl.mongodb.net/consentDB?retryWrites=true&w=majority&appName=ConsentCluster';
    console.log('🔗 Connecting to MongoDB Atlas...');
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB Atlas Connected:', mongoose.connection.host);
    console.log('📊 Database:', mongoose.connection.name);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// User Schema for MongoDB
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  phone: String,
  company: String,
  department: String,
  jobTitle: String,
  role: {
    type: String,
    enum: ['customer', 'admin', 'csr'],
    default: 'customer'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending_verification'],
    default: 'active'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  acceptTerms: Boolean,
  acceptPrivacy: Boolean,
  language: {
    type: String,
    default: 'en'
  },
  lastLoginAt: Date,
  address: String
}, {
  timestamps: true // This adds createdAt and updatedAt automatically
});

// Add virtual for full name
UserSchema.virtual('name').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

const User = mongoose.model('User', UserSchema);

// Consent Schema for MongoDB
const ConsentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['marketing', 'analytics', 'functional', 'necessary', 'advertising', 'personalization']
  },
  purpose: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['granted', 'denied', 'withdrawn', 'pending'],
    default: 'pending'
  },
  grantedAt: Date,
  withdrawnAt: Date,
  expiresAt: Date,
  legalBasis: {
    type: String,
    enum: ['consent', 'legitimate_interest', 'contract', 'legal_obligation'],
    default: 'consent'
  },
  source: {
    type: String,
    default: 'web_form'
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    channel: String
  }
}, {
  timestamps: true
});

const Consent = mongoose.model('Consent', ConsentSchema);

// Preference Schema for MongoDB
const PreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['communication', 'privacy', 'notifications', 'marketing', 'data_processing']
  },
  key: {
    type: String,
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: String
}, {
  timestamps: true
});

const Preference = mongoose.model('Preference', PreferenceSchema);

// Privacy Notice Schema for MongoDB
const PrivacyNoticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  version: {
    type: String,
    required: true
  },
  effectiveDate: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    enum: ['privacy_policy', 'terms_of_service', 'cookie_policy', 'data_processing'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft'
  },
  language: {
    type: String,
    default: 'en'
  }
}, {
  timestamps: true
});

const PrivacyNotice = mongoose.model('PrivacyNotice', PrivacyNoticeSchema);

// DSAR Request Schema for MongoDB
const DSARRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestType: {
    type: String,
    required: true,
    enum: ['access', 'rectification', 'erasure', 'portability', 'restriction', 'objection']
  },
  description: String,
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'rejected', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  responseData: String,
  notes: String
}, {
  timestamps: true
});

const DSARRequest = mongoose.model('DSARRequest', DSARRequestSchema);

// Function to create default admin users
const createDefaultUsers = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@sltmobitel.lk' });
    if (!adminExists) {
      const adminUser = new User({
        email: 'admin@sltmobitel.lk',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        phone: '+94771234567',
        company: 'SLT-Mobitel',
        role: 'admin',
        status: 'active',
        isActive: true,
        emailVerified: true
      });
      await adminUser.save();
      console.log('✅ Default admin user created');
    }

    const csrExists = await User.findOne({ email: 'csr@sltmobitel.lk' });
    if (!csrExists) {
      const csrUser = new User({
        email: 'csr@sltmobitel.lk',
        password: 'csr123',
        firstName: 'CSR',
        lastName: 'User',
        phone: '+94771234568',
        company: 'SLT-Mobitel',
        role: 'csr',
        status: 'active',
        isActive: true,
        emailVerified: true
      });
      await csrUser.save();
      console.log('✅ Default CSR user created');
    }

    const customerExists = await User.findOne({ email: 'customer@sltmobitel.lk' });
    if (!customerExists) {
      const customerUser = new User({
        email: 'customer@sltmobitel.lk',
        password: 'customer123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+94771234569',
        company: 'SLT-Mobitel',
        address: '123 Main St, Colombo 03',
        role: 'customer',
        status: 'active',
        isActive: true,
        emailVerified: true
      });
      await customerUser.save();
      console.log('✅ Default customer user created');
    }
  } catch (error) {
    console.error('❌ Error creating default users:', error);
  }
};

// Function to create default sample data
const createSampleData = async () => {
  try {
    // Create default privacy notices
    const privacyNoticeExists = await PrivacyNotice.findOne({ title: 'Privacy Policy' });
    if (!privacyNoticeExists) {
      const privacyNotice = new PrivacyNotice({
        title: 'Privacy Policy',
        content: 'This is our comprehensive privacy policy that explains how we collect, use, and protect your personal data.',
        version: '1.0',
        effectiveDate: new Date(),
        category: 'privacy_policy',
        status: 'active',
        language: 'en'
      });
      await privacyNotice.save();
      console.log('✅ Default privacy notice created');
    }

    const cookiePolicyExists = await PrivacyNotice.findOne({ title: 'Cookie Policy' });
    if (!cookiePolicyExists) {
      const cookiePolicy = new PrivacyNotice({
        title: 'Cookie Policy',
        content: 'This policy explains how we use cookies and similar technologies on our website.',
        version: '1.0',
        effectiveDate: new Date(),
        category: 'cookie_policy',
        status: 'active',
        language: 'en'
      });
      await cookiePolicy.save();
      console.log('✅ Default cookie policy created');
    }
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  }
};

// Connect to MongoDB and setup default users
connectDB().then(() => {
  createDefaultUsers();
  createSampleData();
});

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

// JWT token generation (simple demo version)
function generateToken(user) {
    // Simple base64 encoding for demo purposes
    const payload = {
        id: user._id || user.id,
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

// Consent endpoints with MongoDB CRUD operations
app.get('/api/v1/consent', verifyToken, async (req, res) => {
  try {
    // Handle query parameters for filtering/pagination
    const { page = 1, limit = 10, status, category } = req.query;
    
    // Build filter query
    const filter = { userId: req.user.id };
    if (status) filter.status = status;
    if (category) filter.category = category;
    
    // Get consents from MongoDB
    const skip = (page - 1) * limit;
    const consents = await Consent.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Consent.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: {
        consents: consents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        }
      },
      service: 'consent-service',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Consent fetch error:', error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch consents",
      details: error.message
    });
  }
});

// POST endpoint for creating consents
app.post('/api/v1/consent', verifyToken, async (req, res) => {
  try {
    const { category, purpose, status = 'granted', legalBasis = 'consent' } = req.body;
    
    const newConsent = new Consent({
      userId: req.user.id,
      category,
      purpose,
      status,
      legalBasis,
      grantedAt: status === 'granted' ? new Date() : null,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      source: 'web_form',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        channel: 'api'
      }
    });
    
    const savedConsent = await newConsent.save();
    
    res.status(201).json({
      success: true,
      data: savedConsent,
      message: 'Consent created successfully'
    });
  } catch (error) {
    console.error('Consent creation error:', error);
    res.status(500).json({
      error: true,
      message: "Failed to create consent",
      details: error.message
    });
  }
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

// Preference endpoints with MongoDB CRUD operations
app.get('/api/v1/preference', verifyToken, async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { userId: req.user.id };
    if (category) filter.category = category;
    
    const preferences = await Preference.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ category: 1, key: 1 });
    
    res.status(200).json({
      success: true,
      data: preferences,
      service: 'preference-service',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Preference fetch error:', error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch preferences",
      details: error.message
    });
  }
});

app.post('/api/v1/preference', verifyToken, async (req, res) => {
  try {
    const { category, key, value, description } = req.body;
    
    // Check if preference already exists, update if it does
    const existingPreference = await Preference.findOne({
      userId: req.user.id,
      category,
      key
    });
    
    if (existingPreference) {
      existingPreference.value = value;
      existingPreference.description = description;
      const updated = await existingPreference.save();
      
      return res.status(200).json({
        success: true,
        data: updated,
        message: 'Preference updated successfully'
      });
    }
    
    const newPreference = new Preference({
      userId: req.user.id,
      category,
      key,
      value,
      description
    });
    
    const saved = await newPreference.save();
    
    res.status(201).json({
      success: true,
      data: saved,
      message: 'Preference created successfully'
    });
  } catch (error) {
    console.error('Preference creation error:', error);
    res.status(500).json({
      error: true,
      message: "Failed to create preference",
      details: error.message
    });
  }
});

app.get('/api/v1/preference/:id', verifyToken, async (req, res) => {
  try {
    const preference = await Preference.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('userId', 'firstName lastName email');
    
    if (!preference) {
      return res.status(404).json({
        error: true,
        message: 'Preference not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: preference
    });
  } catch (error) {
    console.error('Preference fetch error:', error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch preference",
      details: error.message
    });
  }
});

app.put('/api/v1/preference/:id', verifyToken, async (req, res) => {
  try {
    const { value, description } = req.body;
    
    const preference = await Preference.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!preference) {
      return res.status(404).json({
        error: true,
        message: 'Preference not found'
      });
    }
    
    preference.value = value;
    if (description !== undefined) preference.description = description;
    
    const updated = await preference.save();
    
    res.status(200).json({
      success: true,
      data: updated,
      message: 'Preference updated successfully'
    });
  } catch (error) {
    console.error('Preference update error:', error);
    res.status(500).json({
      error: true,
      message: "Failed to update preference",
      details: error.message
    });
  }
});

app.delete('/api/v1/preference/:id', verifyToken, async (req, res) => {
  try {
    const preference = await Preference.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!preference) {
      return res.status(404).json({
        error: true,
        message: 'Preference not found'
      });
    }
    
    await preference.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Preference deleted successfully'
    });
  } catch (error) {
    console.error('Preference deletion error:', error);
    res.status(500).json({
      error: true,
      message: "Failed to delete preference",
      details: error.message
    });
  }
});

// Privacy Notice endpoints with MongoDB CRUD operations
app.get('/api/v1/privacy-notice', async (req, res) => {
  try {
    const { category, status = 'active', language = 'en' } = req.query;
    
    const filter = { status, language };
    if (category) filter.category = category;
    
    const notices = await PrivacyNotice.find(filter)
      .sort({ effectiveDate: -1, createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: notices,
      service: 'privacy-notice-service',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Privacy notice fetch error:', error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch privacy notices",
      details: error.message
    });
  }
});

app.post('/api/v1/privacy-notice', verifyToken, async (req, res) => {
  try {
    // Only admin users can create privacy notices
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({
        error: true,
        message: 'Only administrators can create privacy notices'
      });
    }
    
    const { title, content, version, effectiveDate, category, language = 'en' } = req.body;
    
    const newNotice = new PrivacyNotice({
      title,
      content,
      version,
      effectiveDate: new Date(effectiveDate),
      category,
      language,
      status: 'active'
    });
    
    const saved = await newNotice.save();
    
    res.status(201).json({
      success: true,
      data: saved,
      message: 'Privacy notice created successfully'
    });
  } catch (error) {
    console.error('Privacy notice creation error:', error);
    res.status(500).json({
      error: true,
      message: "Failed to create privacy notice",
      details: error.message
    });
  }
});

app.get('/api/v1/privacy-notice/:id', async (req, res) => {
  try {
    const notice = await PrivacyNotice.findById(req.params.id);
    
    if (!notice) {
      return res.status(404).json({
        error: true,
        message: 'Privacy notice not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: notice
    });
  } catch (error) {
    console.error('Privacy notice fetch error:', error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch privacy notice",
      details: error.message
    });
  }
});

app.put('/api/v1/privacy-notice/:id', verifyToken, async (req, res) => {
  try {
    // Only admin users can update privacy notices
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({
        error: true,
        message: 'Only administrators can update privacy notices'
      });
    }
    
    const { title, content, version, effectiveDate, category, status } = req.body;
    
    const notice = await PrivacyNotice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({
        error: true,
        message: 'Privacy notice not found'
      });
    }
    
    if (title) notice.title = title;
    if (content) notice.content = content;
    if (version) notice.version = version;
    if (effectiveDate) notice.effectiveDate = new Date(effectiveDate);
    if (category) notice.category = category;
    if (status) notice.status = status;
    
    const updated = await notice.save();
    
    res.status(200).json({
      success: true,
      data: updated,
      message: 'Privacy notice updated successfully'
    });
  } catch (error) {
    console.error('Privacy notice update error:', error);
    res.status(500).json({
      error: true,
      message: "Failed to update privacy notice",
      details: error.message
    });
  }
});

app.delete('/api/v1/privacy-notice/:id', verifyToken, async (req, res) => {
  try {
    // Only admin users can delete privacy notices
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({
        error: true,
        message: 'Only administrators can delete privacy notices'
      });
    }
    
    const notice = await PrivacyNotice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({
        error: true,
        message: 'Privacy notice not found'
      });
    }
    
    await notice.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Privacy notice deleted successfully'
    });
  } catch (error) {
    console.error('Privacy notice deletion error:', error);
    res.status(500).json({
      error: true,
      message: "Failed to delete privacy notice",
      details: error.message
    });
  }
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

// Authentication registration endpoint
app.post('/api/v1/auth/register', async (req, res) => {
    try {
        const { 
            email, 
            password, 
            firstName, 
            lastName, 
            phone, 
            company, 
            department, 
            jobTitle,
            acceptTerms,
            acceptPrivacy,
            language 
        } = req.body;
        
        console.log("Registration attempt:", email);
        
        // Validation
        if (!email || !password) {
            return res.status(400).json({
                error: true,
                message: "Email and password are required"
            });
        }
        
        if (!firstName || !lastName) {
            return res.status(400).json({
                error: true,
                message: "First name and last name are required"
            });
        }

        if (!phone) {
            return res.status(400).json({
                error: true,
                message: "Phone number is required"
            });
        }

        // Check if user already exists in MongoDB
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                error: true,
                message: "User with this email already exists"
            });
        }
        
        // Create new user in MongoDB
        const newUser = new User({
            email: email.toLowerCase(),
            password,
            firstName,
            lastName,
            phone,
            company: company || "SLT-Mobitel",
            department: department || "",
            jobTitle: jobTitle || "",
            role: "customer",
            acceptTerms: acceptTerms || false,
            acceptPrivacy: acceptPrivacy || false,
            language: language || "en",
            status: "active",
            isActive: true,
            emailVerified: false
        });

        // Save to MongoDB
        const savedUser = await newUser.save();
        
        // Generate token
        const token = generateToken(savedUser);
        
        console.log("Registration successful - MongoDB:", savedUser.email, "ID:", savedUser._id);
        
        res.status(201).json({
            success: true,
            message: "Account created successfully",
            token: token,
            user: { 
                id: savedUser._id, 
                email: savedUser.email, 
                role: savedUser.role, 
                name: savedUser.name,
                firstName: savedUser.firstName,
                lastName: savedUser.lastName,
                phone: savedUser.phone,
                company: savedUser.company,
                organization: savedUser.company
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: true,
            message: "Registration failed. Please try again.",
            details: error.message
        });
    }
});

// Authentication login endpoint
app.post('/api/v1/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Login attempt:", email);
        
        if (!email || !password) {
            return res.status(400).json({ 
                error: true, 
                message: "Email and password required" 
            });
        }
        
        // Find user in MongoDB
        const user = await User.findOne({ 
            email: email.toLowerCase(), 
            password: password 
        });
        
        if (!user) {
            return res.status(401).json({ 
                error: true, 
                message: "Invalid credentials" 
            });
        }
        
        // Update last login
        user.lastLoginAt = new Date();
        await user.save();
        
        const token = generateToken(user);
        console.log("Login successful - MongoDB:", user.email, "Role:", user.role);
        
        res.json({
            success: true,
            token: token,
            user: { 
                id: user._id, 
                email: user.email, 
                role: user.role, 
                name: user.name,
                phone: user.phone,
                organization: user.company
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: true,
            message: "Login failed. Please try again.",
            details: error.message
        });
    }
});

// Get user profile
app.get('/api/v1/auth/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ 
                error: true, 
                message: "User not found" 
            });
        }
        
        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                name: user.name,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                company: user.company,
                organization: user.company,
                address: user.address,
                createdAt: user.createdAt,
                lastLoginAt: user.lastLoginAt
            }
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            error: true,
            message: "Failed to fetch profile",
            details: error.message
        });
    }
});

// Logout endpoint
app.post('/api/v1/auth/logout', verifyToken, (req, res) => {
    res.json({
        success: true,
        message: "Logged out successfully"
    });
});

// DSAR endpoints with MongoDB CRUD operations
app.get('/api/v1/dsar', verifyToken, async (req, res) => {
  try {
    const { status, requestType } = req.query;
    
    const filter = { userId: req.user.id };
    if (status) filter.status = status;
    if (requestType) filter.requestType = requestType;
    
    const requests = await DSARRequest.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: requests,
      service: 'dsar-service',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('DSAR request fetch error:', error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch DSAR requests",
      details: error.message
    });
  }
});

app.post('/api/v1/dsar', verifyToken, async (req, res) => {
  try {
    const { requestType, description, priority = 'medium' } = req.body;
    
    if (!requestType) {
      return res.status(400).json({
        error: true,
        message: 'Request type is required'
      });
    }
    
    const newRequest = new DSARRequest({
      userId: req.user.id,
      requestType,
      description,
      priority,
      status: 'pending',
      submittedAt: new Date()
    });
    
    const saved = await newRequest.save();
    
    res.status(201).json({
      success: true,
      data: saved,
      message: 'DSAR request created successfully'
    });
  } catch (error) {
    console.error('DSAR request creation error:', error);
    res.status(500).json({
      error: true,
      message: "Failed to create DSAR request",
      details: error.message
    });
  }
});

app.get('/api/v1/dsar/:id', verifyToken, async (req, res) => {
  try {
    const request = await DSARRequest.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('userId', 'firstName lastName email');
    
    if (!request) {
      return res.status(404).json({
        error: true,
        message: 'DSAR request not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('DSAR request fetch error:', error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch DSAR request",
      details: error.message
    });
  }
});

app.put('/api/v1/dsar/:id', verifyToken, async (req, res) => {
  try {
    const { description, priority, status } = req.body;
    
    const request = await DSARRequest.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!request) {
      return res.status(404).json({
        error: true,
        message: 'DSAR request not found'
      });
    }
    
    // Users can only update certain fields, admins can update status
    const user = await User.findById(req.user.id);
    
    if (description && request.status === 'pending') {
      request.description = description;
    }
    
    if (priority && request.status === 'pending') {
      request.priority = priority;
    }
    
    // Only admins can update status
    if (status && user.role === 'admin') {
      request.status = status;
      if (status === 'completed') {
        request.completedAt = new Date();
      }
    }
    
    const updated = await request.save();
    
    res.status(200).json({
      success: true,
      data: updated,
      message: 'DSAR request updated successfully'
    });
  } catch (error) {
    console.error('DSAR request update error:', error);
    res.status(500).json({
      error: true,
      message: "Failed to update DSAR request",
      details: error.message
    });
  }
});

app.delete('/api/v1/dsar/:id', verifyToken, async (req, res) => {
  try {
    const request = await DSARRequest.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!request) {
      return res.status(404).json({
        error: true,
        message: 'DSAR request not found'
      });
    }
    
    // Only allow deletion of pending requests
    if (request.status !== 'pending') {
      return res.status(400).json({
        error: true,
        message: 'Only pending requests can be deleted'
      });
    }
    
    await request.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'DSAR request deleted successfully'
    });
  } catch (error) {
    console.error('DSAR request deletion error:', error);
    res.status(500).json({
      error: true,
      message: "Failed to delete DSAR request",
      details: error.message
    });
  }
});

// Customer Dashboard endpoints
app.get('/api/v1/customer/dashboard/overview', verifyToken, async (req, res) => {
  try {
    // Get the authenticated user from MongoDB
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        error: true, 
        message: "User not found" 
      });
    }

    res.status(200).json({
      success: true,
      data: {
        userInfo: {
          name: user.name,
          email: user.email,
          memberSince: user.createdAt,
          lastLogin: user.lastLoginAt
        },
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
  } catch (error) {
    console.error('Dashboard overview fetch error:', error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch dashboard data",
      details: error.message
    });
  }
});

app.get('/api/v1/customer/dashboard/profile', verifyToken, async (req, res) => {
  try {
    // Get the authenticated user from MongoDB
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        error: true, 
        message: "User not found" 
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        company: user.company || "Not provided",
        department: user.department || "Not provided",
        jobTitle: user.jobTitle || "Not provided",
        address: user.address || "Not provided",
        memberSince: user.createdAt,
        accountStatus: user.status,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
        preferences: {
          language: user.language || 'en',
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
  } catch (error) {
    console.error('Dashboard profile fetch error:', error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch profile data",
      details: error.message
    });
  }
});

app.get('/api/v1/customer/dashboard/consents', verifyToken, async (req, res) => {
  try {
    // Get user's consents from MongoDB
    const consents = await Consent.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    
    // Calculate counts
    const totalCount = consents.length;
    const grantedCount = consents.filter(c => c.status === 'granted').length;
    const deniedCount = consents.filter(c => c.status === 'denied').length;
    const withdrawnCount = consents.filter(c => c.status === 'withdrawn').length;
    
    res.status(200).json({
      success: true,
      data: {
        consents: consents.map(consent => ({
          id: consent._id,
          category: consent.category,
          purpose: consent.purpose,
          status: consent.status,
          grantedAt: consent.grantedAt,
          withdrawnAt: consent.withdrawnAt,
          expiresAt: consent.expiresAt,
          canWithdraw: consent.status === 'granted'
        })),
        totalCount,
        grantedCount,
        deniedCount,
        withdrawnCount
      }
    });
  } catch (error) {
    console.error('Dashboard consents fetch error:', error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch dashboard consents",
      details: error.message
    });
  }
});

// Individual consent management endpoints with MongoDB
app.get('/api/v1/consent/:id', verifyToken, async (req, res) => {
  try {
    const consent = await Consent.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('userId', 'firstName lastName email');
    
    if (!consent) {
      return res.status(404).json({
        error: true,
        message: 'Consent not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: consent
    });
  } catch (error) {
    console.error('Consent fetch error:', error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch consent",
      details: error.message
    });
  }
});

app.put('/api/v1/consent/:id', verifyToken, async (req, res) => {
  try {
    const { status, purpose } = req.body;
    
    const consent = await Consent.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!consent) {
      return res.status(404).json({
        error: true,
        message: 'Consent not found'
      });
    }
    
    if (status) {
      consent.status = status;
      if (status === 'granted') {
        consent.grantedAt = new Date();
        consent.withdrawnAt = null;
      } else if (status === 'withdrawn') {
        consent.withdrawnAt = new Date();
      }
    }
    
    if (purpose) {
      consent.purpose = purpose;
    }
    
    const updated = await consent.save();
    
    res.status(200).json({
      success: true,
      data: updated,
      message: 'Consent updated successfully'
    });
  } catch (error) {
    console.error('Consent update error:', error);
    res.status(500).json({
      error: true,
      message: "Failed to update consent",
      details: error.message
    });
  }
});

app.delete('/api/v1/consent/:id', verifyToken, async (req, res) => {
  try {
    const consent = await Consent.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!consent) {
      return res.status(404).json({
        error: true,
        message: 'Consent not found'
      });
    }
    
    // Instead of deleting, withdraw the consent
    consent.status = 'withdrawn';
    consent.withdrawnAt = new Date();
    
    const updated = await consent.save();
    
    res.status(200).json({
      success: true,
      message: 'Consent withdrawn successfully',
      data: {
        id: updated._id,
        status: updated.status,
        withdrawnAt: updated.withdrawnAt
      }
    });
  } catch (error) {
    console.error('Consent withdrawal error:', error);
    res.status(500).json({
      error: true,
      message: "Failed to withdraw consent",
      details: error.message
    });
  }
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
