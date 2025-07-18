require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// MongoDB Connection
const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || 'consentDB',
    });
    console.log('✅ MongoDB connected successfully!');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Connect to Database
connectDB();

// Initialize sample data
const initializeSampleData = async () => {
  try {
    const {
      samplePrivacyNotices,
      sampleAuditLogs,
      sampleBulkImports,
      sampleEventListeners,
      sampleComplianceRules
    } = require('./sample-data');

    // Initialize Privacy Notices
    const existingNotices = await PrivacyNotice.countDocuments();
    if (existingNotices === 0) {
      await PrivacyNotice.insertMany(samplePrivacyNotices);
      console.log('✅ Sample privacy notices initialized');
    }

    // Initialize Audit Logs
    const existingAuditLogs = await AuditLog.countDocuments();
    if (existingAuditLogs === 0) {
      await AuditLog.insertMany(sampleAuditLogs);
      console.log('✅ Sample audit logs initialized');
    }

    // Initialize Bulk Imports
    const existingBulkImports = await BulkImport.countDocuments();
    if (existingBulkImports === 0) {
      await BulkImport.insertMany(sampleBulkImports);
      console.log('✅ Sample bulk imports initialized');
    }

    // Initialize Event Listeners
    const existingEventListeners = await EventListener.countDocuments();
    if (existingEventListeners === 0) {
      await EventListener.insertMany(sampleEventListeners);
      console.log('✅ Sample event listeners initialized');
    }

    // Initialize Compliance Rules
    const existingComplianceRules = await ComplianceRule.countDocuments();
    if (existingComplianceRules === 0) {
      await ComplianceRule.insertMany(sampleComplianceRules);
      console.log('✅ Sample compliance rules initialized');
    }

    console.log('🎉 All sample data initialization complete!');
  } catch (error) {
    console.error('❌ Error initializing sample data:', error);
  }
};

// Initialize sample data after database connection
mongoose.connection.once('open', () => {
  console.log('🔄 Initializing sample data...');
  initializeSampleData();
});

// Simple Data Models
const ConsentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  partyId: { type: String, required: true },
  consentType: { type: String, required: true },
  status: { type: String, enum: ['granted', 'denied', 'revoked'], default: 'granted' },
  purpose: { type: String, required: true },
  description: String,
  validFor: {
    startDateTime: { type: Date, default: Date.now },
    endDateTime: Date
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const PreferenceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  partyId: { type: String, required: true },
  channelType: { type: String, required: true },
  contactMedium: { type: String, required: true },
  preferenceType: { type: String, required: true },
  isAllowed: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const PartySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: String,
  phone: String,
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  partyType: { type: String, default: 'individual' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const DSARSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  partyId: { type: String, required: true },
  requestType: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending' },
  description: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Privacy Notice Schema
const PrivacyNoticeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  version: { type: String, required: true },
  jurisdiction: { type: String, required: true },
  language: { type: String, default: 'en' },
  documentUrl: String,
  content: String,
  effectiveDate: { type: Date, default: Date.now },
  expiryDate: Date,
  active: { type: Boolean, default: true },
  publishedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Audit Log Schema
const AuditLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  entityType: { type: String, required: true }, // consent, preference, notice, party, dsar
  entityId: { type: String, required: true },
  operation: { type: String, required: true }, // create, update, delete, view
  actorId: { type: String, required: true },
  actorType: { type: String, default: 'user' },
  source: { type: String, required: true },
  ipAddress: String,
  userAgent: String,
  changes: mongoose.Schema.Types.Mixed,
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Bulk Import Schema
const BulkImportSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  filename: { type: String, required: true },
  status: { type: String, enum: ['processing', 'success', 'error'], default: 'processing' },
  recordsTotal: { type: Number, default: 0 },
  recordsProcessed: { type: Number, default: 0 },
  recordsSuccess: { type: Number, default: 0 },
  recordsError: { type: Number, default: 0 },
  errors: [String],
  errorDetails: [String],
  importType: { type: String, required: true }, // consent, preference, party
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Event Listener Schema
const EventListenerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  events: [String],
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  secret: String,
  headers: mongoose.Schema.Types.Mixed,
  retryCount: { type: Number, default: 3 },
  lastTriggered: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compliance Rule Schema
const ComplianceRuleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  ruleType: { type: String, required: true }, // GDPR, CCPA, Marketing, etc.
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  conditions: mongoose.Schema.Types.Mixed,
  actions: mongoose.Schema.Types.Mixed,
  jurisdiction: String,
  priority: { type: Number, default: 1 },
  lastExecuted: Date,
  executionCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create Models
const Consent = mongoose.model('Consent', ConsentSchema);
const Preference = mongoose.model('Preference', PreferenceSchema);
const Party = mongoose.model('Party', PartySchema);
const DSAR = mongoose.model('DSAR', DSARSchema);
const PrivacyNotice = mongoose.model('PrivacyNotice', PrivacyNoticeSchema);
const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
const BulkImport = mongoose.model('BulkImport', BulkImportSchema);
const EventListener = mongoose.model('EventListener', EventListenerSchema);
const ComplianceRule = mongoose.model('ComplianceRule', ComplianceRuleSchema);

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.CORS_ORIGIN
  ].filter(Boolean),
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Utility function to generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Audit logging helper
const createAuditLog = async (entityType, entityId, operation, actorId, source, req, changes = {}) => {
  try {
    const auditData = {
      id: generateId(),
      entityType,
      entityId,
      operation,
      actorId: actorId || 'system',
      actorType: 'system',
      source,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      changes,
      metadata: {
        timestamp: new Date().toISOString(),
        correlationId: req.headers['x-correlation-id'] || generateId()
      }
    };
    
    const auditLog = new AuditLog(auditData);
    await auditLog.save();
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ConsentHub API Gateway',
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API Documentation
app.get('/api-docs', (req, res) => {
  res.json({
    title: 'ConsentHub API',
    version: '1.0.0',
    description: 'TM Forum-compliant Consent Management System with MongoDB',
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

// =========================
// CONSENT MANAGEMENT ROUTES
// =========================

// Get all consents
app.get('/api/v1/consent', async (req, res) => {
  try {
    const consents = await Consent.find();
    res.json(consents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get consent by ID
app.get('/api/v1/consent/:id', async (req, res) => {
  try {
    const consent = await Consent.findOne({ id: req.params.id });
    if (!consent) {
      return res.status(404).json({ error: 'Consent not found' });
    }
    res.json(consent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new consent
app.post('/api/v1/consent', async (req, res) => {
  try {
    const consentData = {
      ...req.body,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const consent = new Consent(consentData);
    await consent.save();
    res.status(201).json(consent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update consent
app.put('/api/v1/consent/:id', async (req, res) => {
  try {
    const consent = await Consent.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!consent) {
      return res.status(404).json({ error: 'Consent not found' });
    }
    res.json(consent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete consent
app.delete('/api/v1/consent/:id', async (req, res) => {
  try {
    const consent = await Consent.findOneAndDelete({ id: req.params.id });
    if (!consent) {
      return res.status(404).json({ error: 'Consent not found' });
    }
    res.json({ message: 'Consent deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================
// PREFERENCE MANAGEMENT ROUTES
// =========================

// Get all preferences
app.get('/api/v1/preference', async (req, res) => {
  try {
    const preferences = await Preference.find();
    res.json(preferences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new preference
app.post('/api/v1/preference', async (req, res) => {
  try {
    const preferenceData = {
      ...req.body,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const preference = new Preference(preferenceData);
    await preference.save();
    res.status(201).json(preference);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update preference
app.put('/api/v1/preference/:id', async (req, res) => {
  try {
    const preference = await Preference.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!preference) {
      return res.status(404).json({ error: 'Preference not found' });
    }
    res.json(preference);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// =========================
// PARTY MANAGEMENT ROUTES
// =========================

// Get all parties
app.get('/api/v1/party', async (req, res) => {
  try {
    const parties = await Party.find();
    res.json(parties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new party
app.post('/api/v1/party', async (req, res) => {
  try {
    const partyData = {
      ...req.body,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const party = new Party(partyData);
    await party.save();
    res.status(201).json(party);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// =========================
// DSAR MANAGEMENT ROUTES
// =========================

// Get all DSAR requests
app.get('/api/v1/dsar', async (req, res) => {
  try {
    const dsars = await DSAR.find();
    res.json(dsars);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new DSAR request
app.post('/api/v1/dsar', async (req, res) => {
  try {
    const dsarData = {
      ...req.body,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const dsar = new DSAR(dsarData);
    await dsar.save();
    res.status(201).json(dsar);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// =========================
// PRIVACY NOTICE ROUTES
// =========================

// Get all privacy notices
app.get('/api/v1/privacy-notice', async (req, res) => {
  try {
    const { jurisdiction, language, version, active, limit = 50, offset = 0 } = req.query;
    
    let query = {};
    if (jurisdiction) query.jurisdiction = jurisdiction;
    if (language) query.language = language;
    if (version) query.version = version;
    if (active !== undefined) query.active = active === 'true';
    
    const notices = await PrivacyNotice.find(query)
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const totalCount = await PrivacyNotice.countDocuments(query);
    
    await createAuditLog('privacy-notice', 'all', 'view', 'system', 'api', req);
    
    res.json({
      notices,
      totalCount,
      hasMore: totalCount > parseInt(offset) + parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get privacy notice by ID
app.get('/api/v1/privacy-notice/:id', async (req, res) => {
  try {
    const notice = await PrivacyNotice.findOne({ id: req.params.id });
    if (!notice) {
      return res.status(404).json({ error: 'Privacy notice not found' });
    }
    
    await createAuditLog('privacy-notice', req.params.id, 'view', 'system', 'api', req);
    
    res.json(notice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new privacy notice
app.post('/api/v1/privacy-notice', async (req, res) => {
  try {
    const noticeData = {
      id: generateId(),
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const notice = new PrivacyNotice(noticeData);
    await notice.save();
    
    await createAuditLog('privacy-notice', notice.id, 'create', 'system', 'api', req, noticeData);
    
    res.status(201).json(notice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update privacy notice
app.patch('/api/v1/privacy-notice/:id', async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    const notice = await PrivacyNotice.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true }
    );
    
    if (!notice) {
      return res.status(404).json({ error: 'Privacy notice not found' });
    }
    
    await createAuditLog('privacy-notice', req.params.id, 'update', 'system', 'api', req, updateData);
    
    res.json(notice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete privacy notice
app.delete('/api/v1/privacy-notice/:id', async (req, res) => {
  try {
    const notice = await PrivacyNotice.findOneAndDelete({ id: req.params.id });
    if (!notice) {
      return res.status(404).json({ error: 'Privacy notice not found' });
    }
    
    await createAuditLog('privacy-notice', req.params.id, 'delete', 'system', 'api', req);
    
    res.json({ message: 'Privacy notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================
// AUDIT LOG ROUTES
// =========================

// Get all audit logs
app.get('/api/v1/audit', async (req, res) => {
  try {
    const { entityType, operation, actorId, entityId, source, startDate, endDate, limit = 50, offset = 0 } = req.query;
    
    let query = {};
    if (entityType) query.entityType = entityType;
    if (operation) query.operation = operation;
    if (actorId) query.actorId = actorId;
    if (entityId) query.entityId = entityId;
    if (source) query.source = source;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const logs = await AuditLog.find(query)
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .sort({ timestamp: -1 });
    
    const totalCount = await AuditLog.countDocuments(query);
    
    res.json({
      logs,
      totalCount,
      hasMore: totalCount > parseInt(offset) + parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get audit log by ID
app.get('/api/v1/audit/:id', async (req, res) => {
  try {
    const log = await AuditLog.findOne({ id: req.params.id });
    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' });
    }
    
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get audit logs by entity
app.get('/api/v1/audit/entity/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const logs = await AuditLog.find({ entityType, entityId })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .sort({ timestamp: -1 });
    
    const totalCount = await AuditLog.countDocuments({ entityType, entityId });
    
    res.json({
      logs,
      totalCount,
      hasMore: totalCount > parseInt(offset) + parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get audit logs by user
app.get('/api/v1/audit/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const logs = await AuditLog.find({ actorId: userId })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .sort({ timestamp: -1 });
    
    const totalCount = await AuditLog.countDocuments({ actorId: userId });
    
    res.json({
      logs,
      totalCount,
      hasMore: totalCount > parseInt(offset) + parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get audit statistics
app.get('/api/v1/audit/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
      if (endDate) dateFilter.timestamp.$lte = new Date(endDate);
    }
    
    const totalLogs = await AuditLog.countDocuments(dateFilter);
    
    const byEntityType = await AuditLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$entityType', count: { $sum: 1 } } }
    ]);
    
    const byOperation = await AuditLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$operation', count: { $sum: 1 } } }
    ]);
    
    const bySource = await AuditLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);
    
    const recentActivity = await AuditLog.countDocuments({
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    res.json({
      totalLogs,
      byEntityType: byEntityType.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      byOperation: byOperation.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      bySource: bySource.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================
// BULK IMPORT ROUTES
// =========================

// Get all bulk imports
app.get('/api/v1/bulk-import', async (req, res) => {
  try {
    const { status, importType, limit = 50, offset = 0 } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (importType) query.importType = importType;
    
    const imports = await BulkImport.find(query)
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const totalCount = await BulkImport.countDocuments(query);
    
    res.json({
      imports,
      totalCount,
      hasMore: totalCount > parseInt(offset) + parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bulk import by ID
app.get('/api/v1/bulk-import/:id', async (req, res) => {
  try {
    const bulkImport = await BulkImport.findOne({ id: req.params.id });
    if (!bulkImport) {
      return res.status(404).json({ error: 'Bulk import not found' });
    }
    
    res.json(bulkImport);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new bulk import
app.post('/api/v1/bulk-import', async (req, res) => {
  try {
    const importData = {
      id: generateId(),
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const bulkImport = new BulkImport(importData);
    await bulkImport.save();
    
    await createAuditLog('bulk-import', bulkImport.id, 'create', 'system', 'api', req, importData);
    
    res.status(201).json(bulkImport);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update bulk import
app.patch('/api/v1/bulk-import/:id', async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    const bulkImport = await BulkImport.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true }
    );
    
    if (!bulkImport) {
      return res.status(404).json({ error: 'Bulk import not found' });
    }
    
    await createAuditLog('bulk-import', req.params.id, 'update', 'system', 'api', req, updateData);
    
    res.json(bulkImport);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// =========================
// EVENT LISTENER ROUTES
// =========================

// Get all event listeners
app.get('/api/v1/event-listener', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    let query = {};
    if (status) query.status = status;
    
    const listeners = await EventListener.find(query)
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const totalCount = await EventListener.countDocuments(query);
    
    res.json({
      listeners,
      totalCount,
      hasMore: totalCount > parseInt(offset) + parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get event listener by ID
app.get('/api/v1/event-listener/:id', async (req, res) => {
  try {
    const listener = await EventListener.findOne({ id: req.params.id });
    if (!listener) {
      return res.status(404).json({ error: 'Event listener not found' });
    }
    
    res.json(listener);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new event listener
app.post('/api/v1/event-listener', async (req, res) => {
  try {
    const listenerData = {
      id: generateId(),
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const listener = new EventListener(listenerData);
    await listener.save();
    
    await createAuditLog('event-listener', listener.id, 'create', 'system', 'api', req, listenerData);
    
    res.status(201).json(listener);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update event listener
app.patch('/api/v1/event-listener/:id', async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    const listener = await EventListener.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true }
    );
    
    if (!listener) {
      return res.status(404).json({ error: 'Event listener not found' });
    }
    
    await createAuditLog('event-listener', req.params.id, 'update', 'system', 'api', req, updateData);
    
    res.json(listener);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete event listener
app.delete('/api/v1/event-listener/:id', async (req, res) => {
  try {
    const listener = await EventListener.findOneAndDelete({ id: req.params.id });
    if (!listener) {
      return res.status(404).json({ error: 'Event listener not found' });
    }
    
    await createAuditLog('event-listener', req.params.id, 'delete', 'system', 'api', req);
    
    res.json({ message: 'Event listener deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================
// COMPLIANCE RULE ROUTES
// =========================

// Get all compliance rules
app.get('/api/v1/compliance-rule', async (req, res) => {
  try {
    const { status, ruleType, jurisdiction, limit = 50, offset = 0 } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (ruleType) query.ruleType = ruleType;
    if (jurisdiction) query.jurisdiction = jurisdiction;
    
    const rules = await ComplianceRule.find(query)
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .sort({ priority: -1, createdAt: -1 });
    
    const totalCount = await ComplianceRule.countDocuments(query);
    
    res.json({
      rules,
      totalCount,
      hasMore: totalCount > parseInt(offset) + parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get compliance rule by ID
app.get('/api/v1/compliance-rule/:id', async (req, res) => {
  try {
    const rule = await ComplianceRule.findOne({ id: req.params.id });
    if (!rule) {
      return res.status(404).json({ error: 'Compliance rule not found' });
    }
    
    res.json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new compliance rule
app.post('/api/v1/compliance-rule', async (req, res) => {
  try {
    const ruleData = {
      id: generateId(),
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const rule = new ComplianceRule(ruleData);
    await rule.save();
    
    await createAuditLog('compliance-rule', rule.id, 'create', 'system', 'api', req, ruleData);
    
    res.status(201).json(rule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update compliance rule
app.patch('/api/v1/compliance-rule/:id', async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    const rule = await ComplianceRule.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true }
    );
    
    if (!rule) {
      return res.status(404).json({ error: 'Compliance rule not found' });
    }
    
    await createAuditLog('compliance-rule', req.params.id, 'update', 'system', 'api', req, updateData);
    
    res.json(rule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete compliance rule
app.delete('/api/v1/compliance-rule/:id', async (req, res) => {
  try {
    const rule = await ComplianceRule.findOneAndDelete({ id: req.params.id });
    if (!rule) {
      return res.status(404).json({ error: 'Compliance rule not found' });
    }
    
    await createAuditLog('compliance-rule', req.params.id, 'delete', 'system', 'api', req);
    
    res.json({ message: 'Compliance rule deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute compliance rule
app.post('/api/v1/compliance-rule/:id/execute', async (req, res) => {
  try {
    const rule = await ComplianceRule.findOne({ id: req.params.id });
    if (!rule) {
      return res.status(404).json({ error: 'Compliance rule not found' });
    }
    
    // Update execution count and timestamp
    rule.executionCount += 1;
    rule.lastExecuted = new Date();
    await rule.save();
    
    await createAuditLog('compliance-rule', req.params.id, 'execute', 'system', 'api', req);
    
    res.json({ 
      message: 'Compliance rule executed successfully',
      executionCount: rule.executionCount,
      lastExecuted: rule.lastExecuted
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================
// HEALTH CHECK ROUTES
// =========================

app.get('/api/v1/consent/health', (req, res) => {
  res.json({ service: 'consent-service', status: 'running', database: 'connected' });
});

app.get('/api/v1/preference/health', (req, res) => {
  res.json({ service: 'preference-service', status: 'running', database: 'connected' });
});

app.get('/api/v1/party/health', (req, res) => {
  res.json({ service: 'party-service', status: 'running', database: 'connected' });
});

app.get('/api/v1/dsar/health', (req, res) => {
  res.json({ service: 'dsar-service', status: 'running', database: 'connected' });
});

app.get('/api/v1/privacy-notice/health', (req, res) => {
  res.json({ service: 'privacy-notice-service', status: 'running', database: 'connected' });
});

app.get('/api/v1/audit/health', (req, res) => {
  res.json({ service: 'audit-service', status: 'running', database: 'connected' });
});

app.get('/api/v1/bulk-import/health', (req, res) => {
  res.json({ service: 'bulk-import-service', status: 'running', database: 'connected' });
});

app.get('/api/v1/event-listener/health', (req, res) => {
  res.json({ service: 'event-listener-service', status: 'running', database: 'connected' });
});

app.get('/api/v1/compliance-rule/health', (req, res) => {
  res.json({ service: 'compliance-rule-service', status: 'running', database: 'connected' });
});

// Catch-all route
app.get('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'API endpoint not found',
    availableEndpoints: [
      '/health',
      '/api-docs',
      '/api/v1/consent',
      '/api/v1/preference',
      '/api/v1/party',
      '/api/v1/dsar',
      '/api/v1/privacy-notice',
      '/api/v1/audit',
      '/api/v1/bulk-import',
      '/api/v1/event-listener',
      '/api/v1/compliance-rule'
    ]
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
  console.log(`🚀 ConsentHub API Gateway with MongoDB running on ${HOST}:${PORT}`);
  console.log(`📚 API Documentation available at http://${HOST}:${PORT}/api-docs`);
  console.log(`❤️  Health check available at http://${HOST}:${PORT}/health`);
  console.log(`🗄️  Database: ${process.env.MONGODB_DB_NAME || 'consentDB'}`);
});

module.exports = app;
