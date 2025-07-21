const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * ConsentAnalytics Model - TMF669 compliant analytics aggregation
 * Stores pre-calculated analytics data for performance optimization
 */
const ConsentAnalyticsSchema = new Schema({
  // TMF669 Analytics Resource attributes
  id: {
    type: String,
    required: true,
    unique: true,
  },

  href: {
    type: String,
    required: true,
  },

  '@type': {
    type: String,
    default: 'ConsentAnalytics',
    immutable: true,
  },

  '@baseType': {
    type: String,
    default: 'Analytics',
  },

  // Analytics period
  analyticsPeriod: {
    startDateTime: {
      type: Date,
      required: true,
    },
    endDateTime: {
      type: Date,
      required: true,
    },
    periodType: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
      required: true,
    },
  },

  // Dimensional filters
  dimensions: {
    jurisdiction: String,
    businessUnit: String,
    channel: String,
    customerSegment: String,
    purpose: [String],
  },

  // Consent metrics
  consentMetrics: {
    totalConsents: {
      type: Number,
      default: 0,
    },
    grantedConsents: {
      type: Number,
      default: 0,
    },
    revokedConsents: {
      type: Number,
      default: 0,
    },
    pendingConsents: {
      type: Number,
      default: 0,
    },
    expiredConsents: {
      type: Number,
      default: 0,
    },
    
    // Conversion metrics
    conversionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    revocationRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    
    // By purpose breakdown
    byPurpose: [{
      purpose: {
        type: String,
        required: true,
      },
      granted: {
        type: Number,
        default: 0,
      },
      revoked: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number,
        default: 0,
      },
      conversionRate: {
        type: Number,
        min: 0,
        max: 100,
      },
    }],

    // By channel breakdown
    byChannel: [{
      channel: {
        type: String,
        required: true,
      },
      count: {
        type: Number,
        default: 0,
      },
      grantedRate: {
        type: Number,
        min: 0,
        max: 100,
      },
    }],
  },

  // Preference metrics
  preferenceMetrics: {
    totalPreferences: {
      type: Number,
      default: 0,
    },
    activePreferences: {
      type: Number,
      default: 0,
    },
    
    // Communication preferences
    communicationChannels: [{
      channel: String,
      optedIn: Number,
      optedOut: Number,
    }],
    
    // Frequency preferences
    frequencyDistribution: [{
      frequency: String,
      count: Number,
      percentage: Number,
    }],
  },

  // Compliance metrics
  complianceMetrics: {
    dsarRequests: {
      total: {
        type: Number,
        default: 0,
      },
      completed: {
        type: Number,
        default: 0,
      },
      pending: {
        type: Number,
        default: 0,
      },
      overdue: {
        type: Number,
        default: 0,
      },
      avgProcessingTime: {
        type: Number, // in hours
        default: 0,
      },
    },
    
    auditTrail: {
      totalEvents: {
        type: Number,
        default: 0,
      },
      completenessScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
    },
    
    complianceScore: {
      overall: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      byJurisdiction: [{
        jurisdiction: String,
        score: Number,
        lastAudit: Date,
        nextAudit: Date,
      }],
    },
  },

  // Performance metrics
  performanceMetrics: {
    apiMetrics: {
      totalRequests: {
        type: Number,
        default: 0,
      },
      avgResponseTime: {
        type: Number, // in milliseconds
        default: 0,
      },
      errorRate: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
    },
    
    systemHealth: {
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 100,
      },
      uptime: {
        type: Number,
        min: 0,
        max: 100,
        default: 100,
      },
    },
  },

  // Calculated insights
  insights: {
    trends: [{
      metric: String,
      direction: {
        type: String,
        enum: ['increasing', 'decreasing', 'stable'],
      },
      magnitude: Number,
      confidence: {
        type: String,
        enum: ['high', 'medium', 'low'],
      },
    }],
    
    recommendations: [String],
    
    alerts: [{
      type: {
        type: String,
        enum: ['warning', 'critical', 'info'],
      },
      message: String,
      threshold: Number,
      currentValue: Number,
    }],
    
    predictions: {
      nextPeriod: {
        expectedVolume: Number,
        confidence: String,
        factors: [String],
      },
    },
  },

  // Data quality metrics
  dataQuality: {
    completeness: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },
    accuracy: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },
    freshness: {
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
      staleness: {
        type: Number, // hours since last update
        default: 0,
      },
    },
  },

  // Metadata
  metadata: {
    calculatedAt: {
      type: Date,
      default: Date.now,
    },
    calculationDuration: {
      type: Number, // milliseconds
    },
    version: {
      type: String,
      default: '1.0',
    },
    source: {
      type: String,
      default: 'analytics-service',
    },
  },

}, {
  timestamps: true,
  versionKey: false,
});

// Indexes for performance
ConsentAnalyticsSchema.index({ 'analyticsPeriod.startDateTime': 1, 'analyticsPeriod.endDateTime': 1 });
ConsentAnalyticsSchema.index({ 'analyticsPeriod.periodType': 1 });
ConsentAnalyticsSchema.index({ 'dimensions.jurisdiction': 1 });
ConsentAnalyticsSchema.index({ 'dimensions.purpose': 1 });
ConsentAnalyticsSchema.index({ 'metadata.calculatedAt': 1 });

// Virtual for TMF669 compliance
ConsentAnalyticsSchema.virtual('analyticsCharacteristic').get(function() {
  return {
    name: 'ConsentAnalytics',
    value: this.consentMetrics,
    valueType: 'ConsentMetrics',
  };
});

// Methods
ConsentAnalyticsSchema.methods.isStale = function(maxAge = 24) {
  const ageInHours = (Date.now() - this.metadata.calculatedAt) / (1000 * 60 * 60);
  return ageInHours > maxAge;
};

ConsentAnalyticsSchema.methods.getConversionTrend = function() {
  const insights = this.insights.trends.find(t => t.metric === 'conversionRate');
  return insights ? insights.direction : 'stable';
};

ConsentAnalyticsSchema.methods.getCriticalAlerts = function() {
  return this.insights.alerts.filter(a => a.type === 'critical');
};

// Static methods
ConsentAnalyticsSchema.statics.findByPeriod = function(startDate, endDate, periodType) {
  return this.find({
    'analyticsPeriod.startDateTime': { $gte: startDate },
    'analyticsPeriod.endDateTime': { $lte: endDate },
    'analyticsPeriod.periodType': periodType,
  });
};

ConsentAnalyticsSchema.statics.findLatestForJurisdiction = function(jurisdiction) {
  return this.findOne({
    'dimensions.jurisdiction': jurisdiction,
  }).sort({ 'metadata.calculatedAt': -1 });
};

ConsentAnalyticsSchema.statics.calculateGrowthRate = function(current, previous) {
  if (!previous || previous.consentMetrics.totalConsents === 0) {
    return null;
  }
  
  const currentTotal = current.consentMetrics.totalConsents;
  const previousTotal = previous.consentMetrics.totalConsents;
  
  return ((currentTotal - previousTotal) / previousTotal) * 100;
};

// Pre-save middleware
ConsentAnalyticsSchema.pre('save', function(next) {
  // Generate ID if not provided
  if (!this.id) {
    this.id = `analytics-${this.analyticsPeriod.periodType}-${Date.now()}`;
  }
  
  // Generate href
  if (!this.href) {
    this.href = `/tmf-api/privacyManagement/v1/analytics/${this.id}`;
  }
  
  // Calculate conversion rates
  if (this.consentMetrics.totalConsents > 0) {
    this.consentMetrics.conversionRate = Math.round(
      (this.consentMetrics.grantedConsents / this.consentMetrics.totalConsents) * 100
    );
    
    this.consentMetrics.revocationRate = Math.round(
      (this.consentMetrics.revokedConsents / this.consentMetrics.totalConsents) * 100
    );
  }
  
  // Update freshness
  this.dataQuality.freshness.lastUpdated = new Date();
  this.dataQuality.freshness.staleness = 0;
  
  next();
});

// Post-save middleware
ConsentAnalyticsSchema.post('save', function(doc) {
  console.log(`Analytics calculated for period: ${doc.analyticsPeriod.startDateTime} to ${doc.analyticsPeriod.endDateTime}`);
});

const ConsentAnalytics = mongoose.model('ConsentAnalytics', ConsentAnalyticsSchema);

module.exports = ConsentAnalytics;
