const mongoose = require('mongoose');

const consentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  partyId: {
    type: String,
    required: true
  },
  customerId: {
    type: String,
    required: false
  },
  purpose: {
    type: String,
    required: false
  },
  purposeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purpose',
    required: false
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipient',
    required: false
  },
  scopeIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scope'
  }],
  templateVersionId: {
    type: String,
    required: false
  },
  status: {
    type: String,
    required: true,
    enum: ['granted', 'revoked', 'pending', 'expired', 'declined']
  },
  channel: {
    type: String,
    required: true,
    enum: ['email', 'sms', 'push', 'voice', 'all', 'web', 'guardian_portal']
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validTo: {
    type: Date,
    required: false
  },
  expiresAt: {
    type: Date,
    required: false
  },
  geoLocation: {
    type: String,
    default: 'Sri Lanka'
  },
  privacyNoticeId: {
    type: String,
    required: false
  },
  versionAccepted: {
    type: String,
    default: '1.0'
  },
  timestampGranted: {
    type: Date,
    required: false
  },
  timestampRevoked: {
    type: Date,
    required: false
  },
  grantedAt: {
    type: Date,
    required: false
  },
  revokedAt: {
    type: Date,
    required: false
  },
  deniedAt: {
    type: Date,
    required: false
  },
  recordSource: {
    type: String,
    default: 'admin-dashboard'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  type: {
    type: String,
    default: 'marketing'
  },
  consentType: {
    type: String,
    default: 'marketing'
  }
}, {
  timestamps: true, // This adds createdAt and updatedAt automatically
  collection: 'consents'
});

// Create indexes for better performance
consentSchema.index({ partyId: 1 });
consentSchema.index({ customerId: 1 });
consentSchema.index({ status: 1 });
consentSchema.index({ purpose: 1 });
consentSchema.index({ createdAt: -1 });
consentSchema.index({ recipientId: 1 });
consentSchema.index({ purposeId: 1 });

module.exports = mongoose.model('Consent', consentSchema);