const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const privacyConsentSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  partyId: {
    type: String,
    required: true,
    index: true,
  },
  privacyNoticeId: {
    type: String,
    index: true,
  },
  productId: {
    type: String,
    index: true,
  },
  status: {
    type: String,
    enum: ['granted', 'revoked', 'pending'],
    required: true,
    default: 'pending',
  },
  purpose: {
    type: String,
    required: true,
  },
  geoLocation: {
    type: String,
  },
  validityPeriod: {
    startDateTime: {
      type: Date,
      default: Date.now,
    },
    endDateTime: {
      type: Date,
    },
  },
  consentData: {
    type: Object,
    default: {},
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  version: {
    type: Number,
    default: 1,
  },
}, {
  timestamps: true,
});

// Indexes for performance
privacyConsentSchema.index({ partyId: 1, status: 1 });
privacyConsentSchema.index({ privacyNoticeId: 1 });
privacyConsentSchema.index({ createdAt: -1 });
privacyConsentSchema.index({ 'validityPeriod.endDateTime': 1 });

// Pre-save middleware for version management
privacyConsentSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  next();
});

module.exports = mongoose.model('PrivacyConsent', privacyConsentSchema);
