// Initialize sample data for the new collections
const mongoose = require('mongoose');

// Sample Privacy Notices
const samplePrivacyNotices = [
  {
    id: 'privacy-notice-001',
    title: 'SLT Mobitel Privacy Notice',
    version: '1.0',
    jurisdiction: 'LK',
    language: 'en',
    documentUrl: 'https://sltmobitel.lk/privacy-policy',
    content: 'This privacy notice describes how SLT Mobitel collects, uses, and protects your personal information...',
    effectiveDate: new Date('2024-01-01'),
    active: true,
    publishedAt: new Date('2024-01-01'),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'privacy-notice-002',
    title: 'GDPR Privacy Notice',
    version: '2.0',
    jurisdiction: 'EU',
    language: 'en',
    documentUrl: 'https://sltmobitel.lk/privacy-policy-eu',
    content: 'This privacy notice complies with GDPR requirements and describes how we process your personal data...',
    effectiveDate: new Date('2024-06-01'),
    active: true,
    publishedAt: new Date('2024-06-01'),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'privacy-notice-003',
    title: 'Legacy Privacy Notice',
    version: '1.0',
    jurisdiction: 'LK',
    language: 'en',
    documentUrl: 'https://sltmobitel.lk/privacy-policy-legacy',
    content: 'This is an older version of our privacy notice...',
    effectiveDate: new Date('2023-01-01'),
    active: false,
    publishedAt: new Date('2023-01-01'),
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Sample Audit Logs
const sampleAuditLogs = [
  {
    id: 'audit-001',
    entityType: 'consent',
    entityId: 'consent-001',
    operation: 'create',
    actorId: 'system',
    actorType: 'system',
    source: 'api',
    ipAddress: '127.0.0.1',
    userAgent: 'ConsentHub/1.0',
    changes: { status: 'granted', purpose: 'marketing' },
    metadata: {
      timestamp: new Date('2024-01-15T10:30:00Z').toISOString(),
      correlationId: 'corr-001'
    },
    timestamp: new Date('2024-01-15T10:30:00Z'),
    createdAt: new Date('2024-01-15T10:30:00Z')
  },
  {
    id: 'audit-002',
    entityType: 'preference',
    entityId: 'pref-001',
    operation: 'update',
    actorId: 'user-001',
    actorType: 'user',
    source: 'web',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    changes: { email: true, sms: false },
    metadata: {
      timestamp: new Date('2024-01-15T14:20:00Z').toISOString(),
      correlationId: 'corr-002'
    },
    timestamp: new Date('2024-01-15T14:20:00Z'),
    createdAt: new Date('2024-01-15T14:20:00Z')
  },
  {
    id: 'audit-003',
    entityType: 'dsar',
    entityId: 'dsar-001',
    operation: 'create',
    actorId: 'user-002',
    actorType: 'user',
    source: 'mobile',
    ipAddress: '10.0.0.1',
    userAgent: 'ConsentHub Mobile/1.0',
    changes: { type: 'data_export', status: 'pending' },
    metadata: {
      timestamp: new Date('2024-01-16T09:15:00Z').toISOString(),
      correlationId: 'corr-003'
    },
    timestamp: new Date('2024-01-16T09:15:00Z'),
    createdAt: new Date('2024-01-16T09:15:00Z')
  }
];

// Sample Bulk Imports
const sampleBulkImports = [
  {
    id: 'bulk-001',
    filename: 'customer_consents.csv',
    status: 'success',
    recordsTotal: 1250,
    recordsProcessed: 1250,
    recordsSuccess: 1250,
    recordsError: 0,
    errors: [],
    errorDetails: [],
    importType: 'consent',
    createdAt: new Date('2024-01-10T08:00:00Z'),
    updatedAt: new Date('2024-01-10T08:30:00Z')
  },
  {
    id: 'bulk-002',
    filename: 'preference_updates.csv',
    status: 'error',
    recordsTotal: 500,
    recordsProcessed: 495,
    recordsSuccess: 490,
    recordsError: 5,
    errors: ['Invalid email format', 'Missing required field'],
    errorDetails: [
      'Row 45: Invalid email format for user@invalid',
      'Row 123: Missing required field "consent_type"',
      'Row 234: Invalid date format',
      'Row 345: Duplicate customer ID',
      'Row 456: Unknown consent type'
    ],
    importType: 'preference',
    createdAt: new Date('2024-01-12T10:00:00Z'),
    updatedAt: new Date('2024-01-12T10:45:00Z')
  },
  {
    id: 'bulk-003',
    filename: 'party_data.csv',
    status: 'processing',
    recordsTotal: 750,
    recordsProcessed: 350,
    recordsSuccess: 348,
    recordsError: 2,
    errors: ['Validation error'],
    errorDetails: [
      'Row 78: Invalid phone number format',
      'Row 156: Duplicate email address'
    ],
    importType: 'party',
    createdAt: new Date('2024-01-18T14:00:00Z'),
    updatedAt: new Date('2024-01-18T14:20:00Z')
  }
];

// Sample Event Listeners
const sampleEventListeners = [
  {
    id: 'listener-001',
    name: 'Consent Change Webhook',
    url: 'https://api.example.com/webhooks/consent',
    events: ['consent.granted', 'consent.revoked'],
    status: 'active',
    secret: 'webhook-secret-123',
    headers: {
      'X-API-Key': 'api-key-123',
      'Content-Type': 'application/json'
    },
    retryCount: 3,
    lastTriggered: new Date('2024-01-18T10:30:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-18T10:30:00Z')
  },
  {
    id: 'listener-002',
    name: 'DSAR Request Webhook',
    url: 'https://api.example.com/webhooks/dsar',
    events: ['dsar.created', 'dsar.completed'],
    status: 'active',
    secret: 'webhook-secret-456',
    headers: {
      'X-API-Key': 'api-key-456',
      'Content-Type': 'application/json'
    },
    retryCount: 3,
    lastTriggered: new Date('2024-01-17T16:45:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-17T16:45:00Z')
  },
  {
    id: 'listener-003',
    name: 'Privacy Notice Webhook',
    url: 'https://api.example.com/webhooks/privacy',
    events: ['privacy.updated'],
    status: 'inactive',
    secret: 'webhook-secret-789',
    headers: {
      'X-API-Key': 'api-key-789',
      'Content-Type': 'application/json'
    },
    retryCount: 3,
    lastTriggered: null,
    createdAt: new Date('2024-01-05T00:00:00Z'),
    updatedAt: new Date('2024-01-15T00:00:00Z')
  }
];

// Sample Compliance Rules
const sampleComplianceRules = [
  {
    id: 'rule-001',
    name: 'GDPR Consent Expiry',
    description: 'Automatically expire consents after 12 months of inactivity',
    ruleType: 'GDPR',
    status: 'active',
    conditions: {
      inactivityPeriod: '12 months',
      jurisdiction: 'EU',
      consentType: 'marketing'
    },
    actions: {
      expire: true,
      notify: true,
      archive: false
    },
    jurisdiction: 'EU',
    priority: 1,
    lastExecuted: new Date('2024-01-18T06:00:00Z'),
    executionCount: 15,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-18T06:00:00Z')
  },
  {
    id: 'rule-002',
    name: 'CCPA Data Retention',
    description: 'Delete customer data after 24 months of inactivity',
    ruleType: 'CCPA',
    status: 'active',
    conditions: {
      inactivityPeriod: '24 months',
      jurisdiction: 'US',
      dataType: 'personal'
    },
    actions: {
      delete: true,
      notify: true,
      archive: true
    },
    jurisdiction: 'US',
    priority: 2,
    lastExecuted: new Date('2024-01-17T06:00:00Z'),
    executionCount: 8,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-17T06:00:00Z')
  },
  {
    id: 'rule-003',
    name: 'Marketing Consent Validation',
    description: 'Require explicit consent for marketing communications',
    ruleType: 'Marketing',
    status: 'active',
    conditions: {
      consentType: 'marketing',
      explicit: true,
      channel: 'all'
    },
    actions: {
      validate: true,
      block: true,
      notify: false
    },
    jurisdiction: 'Global',
    priority: 3,
    lastExecuted: new Date('2024-01-18T12:00:00Z'),
    executionCount: 42,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-18T12:00:00Z')
  },
  {
    id: 'rule-004',
    name: 'Minor Data Protection',
    description: 'Require parental consent for users under 16',
    ruleType: 'GDPR',
    status: 'inactive',
    conditions: {
      age: '<16',
      jurisdiction: 'EU',
      parentalConsent: true
    },
    actions: {
      requireParental: true,
      validate: true,
      notify: true
    },
    jurisdiction: 'EU',
    priority: 1,
    lastExecuted: null,
    executionCount: 0,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T00:00:00Z')
  }
];

module.exports = {
  samplePrivacyNotices,
  sampleAuditLogs,
  sampleBulkImports,
  sampleEventListeners,
  sampleComplianceRules
};
