const mongoose = require('mongoose');

const consentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  partyId: {
    type: String,
    required: true,
    ref: 'Party'
  },
  consentType: {
    type: String,
    required: true,
    enum: [
      'data_processing',
      'marketing',
      'analytics',
      'third_party_sharing',
      'service_improvement',
      'research',
      'profiling',
      'automated_decision_making'
    ]
  },
  purpose: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'granted', 'revoked', 'expired'],
    default: 'pending'
  },
  grantedAt: {
    type: Date,
    required: false
  },
  revokedAt: {
    type: Date,
    required: false
  },
  expiresAt: {
    type: Date,
    required: false
  },
  source: {
    type: String,
    enum: ['web', 'mobile', 'api', 'csr', 'import'],
    default: 'web'
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },
  legalBasis: {
    type: String,
    enum: ['consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests'],
    default: 'consent'
  },
  category: {
    type: String,
    enum: ['necessary', 'functional', 'analytics', 'marketing', 'social'],
    default: 'functional'
  },
  guardianId: {
    type: String,
    required: false,
    ref: 'Party'
  },
  guardianConsent: {
    type: Boolean,
    default: false
  },
  verificationMethod: {
    type: String,
    enum: ['email', 'sms', 'identity_document', 'biometric', 'digital_signature'],
    required: false
  },
  metadata: {
    campaignId: String,
    channel: String,
    version: String,
    customFields: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for better performance
consentSchema.index({ partyId: 1 });
consentSchema.index({ consentType: 1 });
consentSchema.index({ status: 1 });
consentSchema.index({ createdAt: -1 });
consentSchema.index({ expiresAt: 1 });
consentSchema.index({ guardianId: 1 });

// Pre-save middleware to set timestamps
consentSchema.pre('save', function(next) {
  if (this.status === 'granted' && !this.grantedAt) {
    this.grantedAt = new Date();
  }
  if (this.status === 'revoked' && !this.revokedAt) {
    this.revokedAt = new Date();
  }
  next();
});

// Virtual for consent validity
consentSchema.virtual('isValid').get(function() {
  if (this.status !== 'granted') return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  return true;
});

// Ensure virtual fields are serialized
consentSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Consent', consentSchema);
