const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dsarRequestSchema = new Schema({
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
  requestType: {
    type: String,
    enum: ['access', 'rectification', 'erasure', 'portability', 'objection', 'restriction', 'withdraw_consent'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'rejected', 'cancelled'],
    default: 'pending',
    index: true,
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  requestDetails: {
    description: {
      type: String,
      required: true,
    },
    dataCategories: [{
      type: String,
      enum: ['personal_data', 'sensitive_data', 'behavioral_data', 'location_data', 'communication_data', 'device_data', 'consent_data', 'preference_data'],
    }],
    specificFields: [String],
    dateRange: {
      startDate: Date,
      endDate: Date,
    },
    format: {
      type: String,
      enum: ['json', 'csv', 'pdf', 'xml'],
      default: 'json',
    },
  },
  submissionDetails: {
    submittedBy: {
      type: String,
      required: true, // User ID who submitted
    },
    submissionMethod: {
      type: String,
      enum: ['web_portal', 'email', 'phone', 'csr_assisted'],
      required: true,
    },
    submissionDate: {
      type: Date,
      default: Date.now,
    },
    contactPreference: {
      type: String,
      enum: ['email', 'phone', 'postal', 'in_app'],
      default: 'email',
    },
    urgentRequest: {
      type: Boolean,
      default: false,
    },
  },
  processingDetails: {
    assignedTo: {
      type: String, // CSR or admin ID
    },
    assignedDate: Date,
    estimatedCompletion: Date,
    actualCompletion: Date,
    processingNotes: [String],
    approvalRequired: {
      type: Boolean,
      default: false,
    },
    approvedBy: String,
    approvalDate: Date,
  },
  verification: {
    identityVerified: {
      type: Boolean,
      default: false,
    },
    verificationMethod: {
      type: String,
      enum: ['document_upload', 'otp_verification', 'biometric', 'knowledge_based'],
    },
    verificationDate: Date,
    verifiedBy: String,
  },
  fulfillment: {
    dataExtracted: {
      type: Boolean,
      default: false,
    },
    extractionDate: Date,
    dataSize: Number, // in bytes
    recordCount: Number,
    deliveryMethod: {
      type: String,
      enum: ['download_link', 'email', 'secure_portal', 'physical_delivery'],
    },
    deliveryDate: Date,
    expiryDate: Date, // for download links
    downloadCount: {
      type: Number,
      default: 0,
    },
  },
  compliance: {
    legalBasis: {
      type: String,
      enum: ['gdpr_article_15', 'gdpr_article_16', 'gdpr_article_17', 'gdpr_article_18', 'gdpr_article_20', 'gdpr_article_21', 'pdp_act_section_28'],
    },
    responseTimeLimit: {
      type: Number, // in days
      default: 30,
    },
    extensionGranted: {
      type: Boolean,
      default: false,
    },
    extensionReason: String,
    complianceNotes: String,
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    category: {
      type: String,
      enum: ['identity_document', 'authorization_form', 'supporting_document', 'response_document'],
    },
  }],
  communications: [{
    type: {
      type: String,
      enum: ['email', 'phone', 'sms', 'in_app', 'postal'],
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
    },
    content: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    sentBy: String,
    acknowledged: {
      type: Boolean,
      default: false,
    },
  }],
  metadata: {
    ipAddress: String,
    userAgent: String,
    geoLocation: String,
    language: {
      type: String,
      enum: ['en', 'si', 'ta'],
      default: 'en',
    },
    jurisdiction: {
      type: String,
      enum: ['EU', 'LK', 'US', 'GLOBAL'],
      default: 'LK',
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
dsarRequestSchema.index({ partyId: 1, status: 1 });
dsarRequestSchema.index({ requestType: 1, status: 1 });
dsarRequestSchema.index({ 'submissionDetails.submissionDate': -1 });
dsarRequestSchema.index({ 'processingDetails.estimatedCompletion': 1 });
dsarRequestSchema.index({ 'compliance.legalBasis': 1 });

// Pre-save middleware for version management
dsarRequestSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  next();
});

// Virtual for calculating response time remaining
dsarRequestSchema.virtual('daysRemaining').get(function() {
  if (this.status === 'completed' || this.status === 'cancelled') {
    return 0;
  }
  
  const submissionDate = this.submissionDetails.submissionDate;
  const responseLimit = this.compliance.responseTimeLimit;
  const deadline = new Date(submissionDate.getTime() + (responseLimit * 24 * 60 * 60 * 1000));
  const now = new Date();
  const timeDiff = deadline.getTime() - now.getTime();
  
  return Math.ceil(timeDiff / (24 * 60 * 60 * 1000));
});

module.exports = mongoose.model('DSARRequest', dsarRequestSchema);
