const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const privacyNoticeSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  version: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  content: {
    type: String,
    required: true,
  },
  contentType: {
    type: String,
    enum: ['text/plain', 'text/html', 'text/markdown'],
    default: 'text/plain',
  },
  category: {
    type: String,
    enum: ['general', 'marketing', 'analytics', 'cookies', 'third-party', 'location', 'children'],
    required: true,
  },
  purposes: [{
    type: String,
    required: true,
  }],
  legalBasis: {
    type: String,
    enum: ['consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests'],
    required: true,
  },
  dataCategories: [{
    type: String,
    enum: ['personal_data', 'sensitive_data', 'behavioral_data', 'location_data', 'communication_data', 'device_data'],
  }],
  recipients: [{
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['internal', 'third_party', 'government', 'processor'],
      required: true,
    },
    purpose: {
      type: String,
      required: true,
    },
    country: {
      type: String,
    },
  }],
  retentionPeriod: {
    duration: {
      type: String,
      required: true,
    },
    criteria: {
      type: String,
    },
  },
  rights: [{
    type: String,
    enum: ['access', 'rectification', 'erasure', 'portability', 'objection', 'restriction', 'withdraw_consent'],
  }],
  contactInfo: {
    dpo: {
      name: {
        type: String,
      },
      email: {
        type: String,
      },
      phone: {
        type: String,
      },
    },
    organization: {
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
      },
      address: {
        type: String,
      },
    },
  },
  effectiveDate: {
    type: Date,
    required: true,
    index: true,
  },
  expirationDate: {
    type: Date,
    index: true,
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'archived'],
    default: 'draft',
    index: true,
  },
  language: {
    type: String,
    enum: ['en', 'si', 'ta'],
    default: 'en',
  },
  geoScope: [{
    type: String,
  }],
  productScope: [{
    type: String,
  }],
  parentNoticeId: {
    type: String,
    index: true,
  },
  changeLog: [{
    version: {
      type: String,
      required: true,
    },
    changes: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  }],
  approvalStatus: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvedBy: {
      type: String,
    },
    approvedAt: {
      type: Date,
    },
    comments: {
      type: String,
    },
  },
  metadata: {
    createdBy: {
      type: String,
      required: true,
    },
    lastModifiedBy: {
      type: String,
    },
    tags: [{
      type: String,
    }],
  },
}, {
  timestamps: true,
});

// Indexes for performance
privacyNoticeSchema.index({ version: 1, status: 1 });
privacyNoticeSchema.index({ category: 1 });
privacyNoticeSchema.index({ effectiveDate: -1 });
privacyNoticeSchema.index({ status: 1, effectiveDate: -1 });
privacyNoticeSchema.index({ 'metadata.tags': 1 });

// Virtual for formatted content
privacyNoticeSchema.virtual('formattedContent').get(function() {
  if (this.contentType === 'text/markdown') {
    const marked = require('marked');
    return marked.parse(this.content);
  }
  return this.content;
});

// Pre-save middleware for version management
privacyNoticeSchema.pre('save', function(next) {
  if (this.isNew) {
    this.changeLog.push({
      version: this.version,
      changes: 'Initial version',
      author: this.metadata.createdBy,
      date: new Date(),
    });
  }
  next();
});

module.exports = mongoose.model('PrivacyNotice', privacyNoticeSchema);
