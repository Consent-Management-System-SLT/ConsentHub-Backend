const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const privacyPreferenceSchema = new Schema({
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
  notificationPreferences: {
    sms: {
      enabled: {
        type: Boolean,
        default: true,
      },
      categories: {
        marketing: {
          type: Boolean,
          default: false,
        },
        billing: {
          type: Boolean,
          default: true,
        },
        service: {
          type: Boolean,
          default: true,
        },
        security: {
          type: Boolean,
          default: true,
        },
        promotional: {
          type: Boolean,
          default: false,
        },
      },
      frequency: {
        type: String,
        enum: ['immediate', 'daily', 'weekly', 'monthly'],
        default: 'immediate',
      },
      timeRestrictions: {
        startTime: {
          type: String,
          default: '09:00',
        },
        endTime: {
          type: String,
          default: '21:00',
        },
        timezone: {
          type: String,
          default: 'Asia/Colombo',
        },
      },
    },
    email: {
      enabled: {
        type: Boolean,
        default: true,
      },
      categories: {
        marketing: {
          type: Boolean,
          default: false,
        },
        billing: {
          type: Boolean,
          default: true,
        },
        service: {
          type: Boolean,
          default: true,
        },
        security: {
          type: Boolean,
          default: true,
        },
        promotional: {
          type: Boolean,
          default: false,
        },
        newsletter: {
          type: Boolean,
          default: false,
        },
      },
      frequency: {
        type: String,
        enum: ['immediate', 'daily', 'weekly', 'monthly'],
        default: 'immediate',
      },
      format: {
        type: String,
        enum: ['html', 'text'],
        default: 'html',
      },
    },
    push: {
      enabled: {
        type: Boolean,
        default: true,
      },
      categories: {
        marketing: {
          type: Boolean,
          default: false,
        },
        billing: {
          type: Boolean,
          default: true,
        },
        service: {
          type: Boolean,
          default: true,
        },
        security: {
          type: Boolean,
          default: true,
        },
        promotional: {
          type: Boolean,
          default: false,
        },
        alerts: {
          type: Boolean,
          default: true,
        },
      },
      deviceTokens: [{
        token: String,
        platform: {
          type: String,
          enum: ['ios', 'android', 'web'],
        },
        registeredAt: {
          type: Date,
          default: Date.now,
        },
      }],
    },
    inApp: {
      enabled: {
        type: Boolean,
        default: true,
      },
      categories: {
        marketing: {
          type: Boolean,
          default: true,
        },
        billing: {
          type: Boolean,
          default: true,
        },
        service: {
          type: Boolean,
          default: true,
        },
        security: {
          type: Boolean,
          default: true,
        },
        promotional: {
          type: Boolean,
          default: true,
        },
        system: {
          type: Boolean,
          default: true,
        },
      },
    },
  },
  communicationPreferences: {
    language: {
      type: String,
      enum: ['en', 'si', 'ta'],
      default: 'en',
    },
    contactMethod: {
      type: String,
      enum: ['sms', 'email', 'push', 'inApp'],
      default: 'sms',
    },
    doNotDisturb: {
      enabled: {
        type: Boolean,
        default: false,
      },
      schedule: {
        startTime: {
          type: String,
          default: '22:00',
        },
        endTime: {
          type: String,
          default: '08:00',
        },
        timezone: {
          type: String,
          default: 'Asia/Colombo',
        },
      },
    },
  },
  dataProcessingPreferences: {
    analytics: {
      type: Boolean,
      default: true,
    },
    personalization: {
      type: Boolean,
      default: true,
    },
    thirdPartySharing: {
      type: Boolean,
      default: false,
    },
    dataRetention: {
      type: String,
      enum: ['1year', '2years', '5years', 'indefinite'],
      default: '2years',
    },
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
  version: {
    type: Number,
    default: 1,
  },
}, {
  timestamps: true,
});

// Indexes for performance
privacyPreferenceSchema.index({ partyId: 1 });
privacyPreferenceSchema.index({ createdAt: -1 });
privacyPreferenceSchema.index({ 'validityPeriod.endDateTime': 1 });

// Pre-save middleware for version management
privacyPreferenceSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  next();
});

module.exports = mongoose.model('PrivacyPreference', privacyPreferenceSchema);
