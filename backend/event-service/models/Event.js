const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  eventType: {
    type: String,
    required: true,
    index: true,
  },
  eventTime: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  severity: {
    type: String,
    enum: ['minor', 'major', 'critical'],
    default: 'minor',
  },
  source: {
    type: String,
    required: true,
    index: true,
  },
  domain: {
    type: String,
    default: 'privacy-consent',
  },
  // Event correlation
  correlationId: {
    type: String,
    index: true,
  },
  parentEventId: {
    type: String,
    index: true,
  },
  // Event data payload
  event: {
    // TMF specific event data structure
    fieldPath: {
      type: String,
    },
    newValue: {
      type: Schema.Types.Mixed,
    },
    oldValue: {
      type: Schema.Types.Mixed,
    },
  },
  // Related entities
  entities: [{
    entityType: {
      type: String,
      required: true,
      enum: ['PrivacyConsent', 'PrivacyPreference', 'PrivacyNotice', 'Agreement', 'Party'],
    },
    entityId: {
      type: String,
      required: true,
    },
    href: {
      type: String,
    },
  }],
  // Event characteristics
  eventCharacteristic: [{
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
      enum: ['string', 'number', 'boolean', 'date', 'object'],
      default: 'string',
    },
  }],
  // Additional event data
  data: {
    type: Object,
    default: {},
  },
  // Delivery information
  delivery: {
    status: {
      type: String,
      enum: ['pending', 'delivered', 'failed', 'acknowledged'],
      default: 'pending',
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastAttempt: {
      type: Date,
    },
    nextAttempt: {
      type: Date,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    deliveredTo: [{
      endpoint: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        enum: ['success', 'failed'],
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      responseCode: {
        type: Number,
      },
      errorMessage: {
        type: String,
      },
    }],
  },
  // Subscription information
  subscriptions: [{
    subscriptionId: {
      type: String,
      required: true,
    },
    callback: {
      type: String,
      required: true,
    },
    query: {
      type: String,
    },
  }],
  // Processing status
  processed: {
    type: Boolean,
    default: false,
  },
  processingError: {
    type: String,
  },
  // Metadata
  metadata: {
    createdBy: {
      type: String,
    },
    tags: [{
      type: String,
    }],
    environment: {
      type: String,
      default: process.env.NODE_ENV || 'development',
    },
    version: {
      type: String,
      default: '1.0.0',
    },
  },
  // TTL for automatic cleanup
  expiresAt: {
    type: Date,
    default: function() {
      // Default to 30 days from creation
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    },
    index: { expireAfterSeconds: 0 },
  },
}, {
  timestamps: true,
});

// Indexes for performance
eventSchema.index({ eventType: 1, eventTime: -1 });
eventSchema.index({ source: 1, eventTime: -1 });
eventSchema.index({ 'entities.entityType': 1, 'entities.entityId': 1 });
eventSchema.index({ correlationId: 1 });
eventSchema.index({ 'delivery.status': 1 });
eventSchema.index({ processed: 1 });
eventSchema.index({ priority: 1, eventTime: -1 });

// Virtual for age in minutes
eventSchema.virtual('ageInMinutes').get(function() {
  return Math.floor((new Date() - this.eventTime) / (1000 * 60));
});

// Method to mark as processed
eventSchema.methods.markAsProcessed = function() {
  this.processed = true;
  this.processingError = null;
  return this.save();
};

// Method to add delivery attempt
eventSchema.methods.addDeliveryAttempt = function(endpoint, status, responseCode, errorMessage) {
  this.delivery.attempts += 1;
  this.delivery.lastAttempt = new Date();
  
  if (status === 'success') {
    this.delivery.status = 'delivered';
  } else if (this.delivery.attempts >= this.delivery.maxAttempts) {
    this.delivery.status = 'failed';
  } else {
    // Schedule next attempt with exponential backoff
    const backoffMinutes = Math.pow(2, this.delivery.attempts) * 5; // 5, 10, 20 minutes
    this.delivery.nextAttempt = new Date(Date.now() + backoffMinutes * 60 * 1000);
  }

  this.delivery.deliveredTo.push({
    endpoint,
    status,
    responseCode,
    errorMessage,
    timestamp: new Date(),
  });

  return this.save();
};

module.exports = mongoose.model('Event', eventSchema);
