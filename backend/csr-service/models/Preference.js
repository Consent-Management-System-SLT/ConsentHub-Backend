const mongoose = require('mongoose');

const preferenceSchema = new mongoose.Schema({
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
  preferredChannels: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    },
    phone: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: true
    },
    mail: {
      type: Boolean,
      default: false
    }
  },
  topicSubscriptions: {
    marketing: {
      type: Boolean,
      default: false
    },
    promotions: {
      type: Boolean,
      default: false
    },
    serviceUpdates: {
      type: Boolean,
      default: true
    },
    billing: {
      type: Boolean,
      default: true
    },
    security: {
      type: Boolean,
      default: true
    },
    newsletter: {
      type: Boolean,
      default: false
    },
    surveys: {
      type: Boolean,
      default: false
    }
  },
  frequency: {
    type: String,
    enum: ['immediate', 'daily', 'weekly', 'monthly', 'quarterly'],
    default: 'immediate'
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  language: {
    type: String,
    default: 'en'
  },
  format: {
    type: String,
    enum: ['html', 'text', 'both'],
    default: 'html'
  },
  quietHours: {
    enabled: {
      type: Boolean,
      default: false
    },
    start: {
      type: String,
      default: '22:00'
    },
    end: {
      type: String,
      default: '08:00'
    }
  },
  blackoutDates: [{
    start: Date,
    end: Date,
    reason: String
  }],
  customPreferences: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for better performance
preferenceSchema.index({ partyId: 1 });
preferenceSchema.index({ 'topicSubscriptions.marketing': 1 });
preferenceSchema.index({ 'topicSubscriptions.promotions': 1 });
preferenceSchema.index({ frequency: 1 });
preferenceSchema.index({ updatedAt: -1 });

// Ensure virtual fields are serialized
preferenceSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Preference', preferenceSchema);
