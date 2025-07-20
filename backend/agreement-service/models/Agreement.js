const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const agreementSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  agreementType: {
    type: String,
    enum: ['product', 'service', 'legal', 'consent', 'privacy', 'marketing', 'subsidy'],
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'terminated', 'suspended', 'pending', 'cancelled'],
    default: 'pending',
  },
  version: {
    type: String,
    default: '1.0.0',
  },
  // Party information
  partyId: {
    type: String,
    required: true,
    index: true,
  },
  partyRole: {
    type: String,
    enum: ['customer', 'subscriber', 'beneficiary', 'guardian'],
    default: 'customer',
  },
  // Agreement terms
  agreementSpecification: {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    validFor: {
      startDateTime: {
        type: Date,
        default: Date.now,
      },
      endDateTime: {
        type: Date,
      },
    },
    terms: [{
      name: {
        type: String,
        required: true,
      },
      description: {
        type: String,
      },
      type: {
        type: String,
        enum: ['condition', 'obligation', 'benefit', 'penalty', 'termination'],
        required: true,
      },
      value: {
        type: String,
      },
      unit: {
        type: String,
      },
    }],
  },
  // Agreement items (products/services)
  agreementItems: [{
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['product', 'service', 'offer', 'bundle'],
      required: true,
    },
    productId: {
      type: String,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    price: {
      amount: {
        type: Number,
      },
      currency: {
        type: String,
        default: 'LKR',
      },
    },
    validFor: {
      startDateTime: {
        type: Date,
        default: Date.now,
      },
      endDateTime: {
        type: Date,
      },
    },
    termAndConditions: [{
      name: {
        type: String,
        required: true,
      },
      description: {
        type: String,
      },
    }],
  }],
  // Validity period
  validityPeriod: {
    startDateTime: {
      type: Date,
      default: Date.now,
    },
    endDateTime: {
      type: Date,
    },
  },
  // Billing and payment
  billingAccountId: {
    type: String,
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'bank_account', 'digital_wallet', 'cash', 'invoice'],
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'quarterly', 'annually', 'one_time'],
    default: 'monthly',
  },
  // Cancellation and termination
  cancellationPolicy: {
    cancellationFee: {
      type: Number,
      default: 0,
    },
    noticePeriod: {
      type: Number, // in days
      default: 30,
    },
    terminationReasons: [{
      type: String,
    }],
  },
  // Renewal information
  renewalType: {
    type: String,
    enum: ['automatic', 'manual', 'none'],
    default: 'none',
  },
  renewalPeriod: {
    duration: {
      type: Number,
    },
    unit: {
      type: String,
      enum: ['days', 'months', 'years'],
    },
  },
  // Characteristics and attributes
  characteristics: [{
    name: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    valueType: {
      type: String,
      enum: ['string', 'number', 'boolean', 'date'],
      default: 'string',
    },
  }],
  // Attachments and documents
  attachments: [{
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    mimeType: {
      type: String,
    },
    url: {
      type: String,
    },
    size: {
      type: Number,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  // Signature information
  signature: {
    signedBy: {
      type: String,
    },
    signedAt: {
      type: Date,
    },
    signatureMethod: {
      type: String,
      enum: ['digital', 'electronic', 'physical'],
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  // Approval workflow
  approvalStatus: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'requires_review'],
      default: 'pending',
    },
    approvedBy: {
      type: String,
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    comments: {
      type: String,
    },
  },
  // Related entities
  relatedAgreements: [{
    id: {
      type: String,
      required: true,
    },
    relationshipType: {
      type: String,
      enum: ['parent', 'child', 'dependency', 'amendment', 'renewal'],
      required: true,
    },
  }],
  // Metadata
  metadata: {
    createdBy: {
      type: String,
      required: true,
    },
    lastModifiedBy: {
      type: String,
    },
    source: {
      type: String,
      enum: ['web', 'mobile', 'call_center', 'store', 'api'],
      default: 'web',
    },
    tags: [{
      type: String,
    }],
    externalReferences: [{
      type: {
        type: String,
        required: true,
      },
      id: {
        type: String,
        required: true,
      },
    }],
  },
}, {
  timestamps: true,
});

// Indexes for performance
agreementSchema.index({ partyId: 1, status: 1 });
agreementSchema.index({ agreementType: 1 });
agreementSchema.index({ status: 1 });
agreementSchema.index({ 'validityPeriod.startDateTime': 1 });
agreementSchema.index({ 'validityPeriod.endDateTime': 1 });
agreementSchema.index({ createdAt: -1 });

// Virtual for active status
agreementSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' &&
         this.validityPeriod.startDateTime <= now &&
         (!this.validityPeriod.endDateTime || this.validityPeriod.endDateTime > now);
});

// Method to check if agreement is expired
agreementSchema.methods.isExpired = function() {
  const now = new Date();
  return this.validityPeriod.endDateTime && this.validityPeriod.endDateTime < now;
};

// Method to calculate remaining days
agreementSchema.methods.remainingDays = function() {
  if (!this.validityPeriod.endDateTime) return null;
  const now = new Date();
  const diffTime = this.validityPeriod.endDateTime - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

module.exports = mongoose.model('Agreement', agreementSchema);
