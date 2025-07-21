const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * PerformanceMetrics Model - TMF669 compliant system performance tracking
 * Tracks API response times, system health, and operational metrics
 */
const PerformanceMetricsSchema = new Schema({
  // TMF669 Performance Resource attributes
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
    default: 'PerformanceMetrics',
    immutable: true,
  },

  '@baseType': {
    type: String,
    default: 'Metrics',
  },

  // Measurement period
  measurementPeriod: {
    startDateTime: {
      type: Date,
      required: true,
    },
    endDateTime: {
      type: Date,
      required: true,
    },
    intervalType: {
      type: String,
      enum: ['minute', 'hour', 'day', 'week'],
      required: true,
    },
  },

  // Service-level metrics
  serviceMetrics: {
    consentService: {
      totalRequests: {
        type: Number,
        default: 0,
      },
      successfulRequests: {
        type: Number,
        default: 0,
      },
      failedRequests: {
        type: Number,
        default: 0,
      },
      avgResponseTime: {
        type: Number, // milliseconds
        default: 0,
      },
      maxResponseTime: {
        type: Number,
        default: 0,
      },
      minResponseTime: {
        type: Number,
        default: 0,
      },
      p95ResponseTime: {
        type: Number,
        default: 0,
      },
      errorRate: {
        type: Number, // percentage
        min: 0,
        max: 100,
        default: 0,
      },
      uptime: {
        type: Number, // percentage
        min: 0,
        max: 100,
        default: 100,
      },
    },

    preferenceService: {
      totalRequests: { type: Number, default: 0 },
      successfulRequests: { type: Number, default: 0 },
      failedRequests: { type: Number, default: 0 },
      avgResponseTime: { type: Number, default: 0 },
      maxResponseTime: { type: Number, default: 0 },
      minResponseTime: { type: Number, default: 0 },
      p95ResponseTime: { type: Number, default: 0 },
      errorRate: { type: Number, min: 0, max: 100, default: 0 },
      uptime: { type: Number, min: 0, max: 100, default: 100 },
    },

    partyService: {
      totalRequests: { type: Number, default: 0 },
      successfulRequests: { type: Number, default: 0 },
      failedRequests: { type: Number, default: 0 },
      avgResponseTime: { type: Number, default: 0 },
      maxResponseTime: { type: Number, default: 0 },
      minResponseTime: { type: Number, default: 0 },
      p95ResponseTime: { type: Number, default: 0 },
      errorRate: { type: Number, min: 0, max: 100, default: 0 },
      uptime: { type: Number, min: 0, max: 100, default: 100 },
    },

    dsarService: {
      totalRequests: { type: Number, default: 0 },
      successfulRequests: { type: Number, default: 0 },
      failedRequests: { type: Number, default: 0 },
      avgResponseTime: { type: Number, default: 0 },
      maxResponseTime: { type: Number, default: 0 },
      minResponseTime: { type: Number, default: 0 },
      p95ResponseTime: { type: Number, default: 0 },
      errorRate: { type: Number, min: 0, max: 100, default: 0 },
      uptime: { type: Number, min: 0, max: 100, default: 100 },
    },

    eventService: {
      totalRequests: { type: Number, default: 0 },
      successfulRequests: { type: Number, default: 0 },
      failedRequests: { type: Number, default: 0 },
      avgResponseTime: { type: Number, default: 0 },
      maxResponseTime: { type: Number, default: 0 },
      minResponseTime: { type: Number, default: 0 },
      p95ResponseTime: { type: Number, default: 0 },
      errorRate: { type: Number, min: 0, max: 100, default: 0 },
      uptime: { type: Number, min: 0, max: 100, default: 100 },
    },

    analyticsService: {
      totalRequests: { type: Number, default: 0 },
      successfulRequests: { type: Number, default: 0 },
      failedRequests: { type: Number, default: 0 },
      avgResponseTime: { type: Number, default: 0 },
      maxResponseTime: { type: Number, default: 0 },
      minResponseTime: { type: Number, default: 0 },
      p95ResponseTime: { type: Number, default: 0 },
      errorRate: { type: Number, min: 0, max: 100, default: 0 },
      uptime: { type: Number, min: 0, max: 100, default: 100 },
    },
  },

  // Database performance metrics
  databaseMetrics: {
    connectionPool: {
      totalConnections: {
        type: Number,
        default: 0,
      },
      activeConnections: {
        type: Number,
        default: 0,
      },
      idleConnections: {
        type: Number,
        default: 0,
      },
      waitingConnections: {
        type: Number,
        default: 0,
      },
    },
    
    queryPerformance: {
      totalQueries: {
        type: Number,
        default: 0,
      },
      avgQueryTime: {
        type: Number, // milliseconds
        default: 0,
      },
      slowQueries: {
        type: Number,
        default: 0,
      },
      slowQueryThreshold: {
        type: Number, // milliseconds
        default: 1000,
      },
    },

    indexEfficiency: [{
      collection: String,
      totalScans: Number,
      indexScans: Number,
      efficiency: Number, // percentage
    }],
  },

  // System resource metrics
  systemMetrics: {
    cpu: {
      usage: {
        type: Number, // percentage
        min: 0,
        max: 100,
        default: 0,
      },
      cores: {
        type: Number,
        default: 1,
      },
      loadAverage: {
        type: Number,
        default: 0,
      },
    },

    memory: {
      totalMemory: {
        type: Number, // MB
        default: 0,
      },
      usedMemory: {
        type: Number, // MB
        default: 0,
      },
      freeMemory: {
        type: Number, // MB
        default: 0,
      },
      usage: {
        type: Number, // percentage
        min: 0,
        max: 100,
        default: 0,
      },
    },

    disk: {
      totalSpace: {
        type: Number, // GB
        default: 0,
      },
      usedSpace: {
        type: Number, // GB
        default: 0,
      },
      freeSpace: {
        type: Number, // GB
        default: 0,
      },
      usage: {
        type: Number, // percentage
        min: 0,
        max: 100,
        default: 0,
      },
      iops: {
        read: {
          type: Number,
          default: 0,
        },
        write: {
          type: Number,
          default: 0,
        },
      },
    },

    network: {
      bytesIn: {
        type: Number,
        default: 0,
      },
      bytesOut: {
        type: Number,
        default: 0,
      },
      packetsIn: {
        type: Number,
        default: 0,
      },
      packetsOut: {
        type: Number,
        default: 0,
      },
      latency: {
        type: Number, // milliseconds
        default: 0,
      },
    },
  },

  // Application-specific metrics
  applicationMetrics: {
    consentProcessing: {
      consentGrantsPerSecond: {
        type: Number,
        default: 0,
      },
      consentRevocationsPerSecond: {
        type: Number,
        default: 0,
      },
      avgConsentProcessingTime: {
        type: Number, // milliseconds
        default: 0,
      },
    },

    dsarProcessing: {
      requestsPerHour: {
        type: Number,
        default: 0,
      },
      avgProcessingTime: {
        type: Number, // hours
        default: 0,
      },
      automationRate: {
        type: Number, // percentage
        min: 0,
        max: 100,
        default: 0,
      },
    },

    eventProcessing: {
      eventsPerSecond: {
        type: Number,
        default: 0,
      },
      eventQueueSize: {
        type: Number,
        default: 0,
      },
      avgEventProcessingTime: {
        type: Number, // milliseconds
        default: 0,
      },
    },
  },

  // Health and availability metrics
  healthMetrics: {
    overallHealthScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },

    serviceAvailability: {
      type: Number, // percentage
      min: 0,
      max: 100,
      default: 100,
    },

    dependencyHealth: [{
      service: String,
      status: {
        type: String,
        enum: ['healthy', 'warning', 'critical', 'unknown'],
        default: 'healthy',
      },
      responseTime: Number,
      lastCheck: {
        type: Date,
        default: Date.now,
      },
    }],

    alerts: [{
      type: {
        type: String,
        enum: ['performance', 'availability', 'error', 'capacity'],
      },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
      },
      message: String,
      threshold: Number,
      currentValue: Number,
      triggeredAt: {
        type: Date,
        default: Date.now,
      },
      acknowledged: {
        type: Boolean,
        default: false,
      },
    }],
  },

  // Capacity and scaling metrics
  capacityMetrics: {
    currentCapacity: {
      type: Number, // percentage
      min: 0,
      max: 100,
      default: 0,
    },

    peakCapacityUtilization: {
      type: Number, // percentage
      min: 0,
      max: 100,
      default: 0,
    },

    scalingEvents: [{
      timestamp: {
        type: Date,
        default: Date.now,
      },
      action: {
        type: String,
        enum: ['scale_up', 'scale_down', 'scale_out', 'scale_in'],
      },
      trigger: String,
      result: String,
    }],

    recommendations: [{
      type: String,
      message: String,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
      },
      estimatedImpact: String,
    }],
  },

  // Metadata
  metadata: {
    collectedAt: {
      type: Date,
      default: Date.now,
    },
    collectionMethod: {
      type: String,
      default: 'automated',
    },
    version: {
      type: String,
      default: '1.0',
    },
    source: {
      type: String,
      default: 'performance-monitor',
    },
  },

}, {
  timestamps: true,
  versionKey: false,
});

// Indexes for performance
PerformanceMetricsSchema.index({ 'measurementPeriod.startDateTime': 1, 'measurementPeriod.endDateTime': 1 });
PerformanceMetricsSchema.index({ 'measurementPeriod.intervalType': 1 });
PerformanceMetricsSchema.index({ 'metadata.collectedAt': -1 });
PerformanceMetricsSchema.index({ 'healthMetrics.overallHealthScore': 1 });

// Virtual for system status
PerformanceMetricsSchema.virtual('systemStatus').get(function() {
  const score = this.healthMetrics.overallHealthScore;
  if (score >= 95) return 'excellent';
  if (score >= 85) return 'good';
  if (score >= 70) return 'warning';
  return 'critical';
});

// Methods
PerformanceMetricsSchema.methods.addAlert = function(type, severity, message, threshold, currentValue) {
  this.healthMetrics.alerts.push({
    type,
    severity,
    message,
    threshold,
    currentValue,
  });
  return this.save();
};

PerformanceMetricsSchema.methods.acknowledgeAlert = function(alertIndex) {
  if (this.healthMetrics.alerts[alertIndex]) {
    this.healthMetrics.alerts[alertIndex].acknowledged = true;
    return this.save();
  }
  throw new Error('Alert not found');
};

PerformanceMetricsSchema.methods.getCriticalAlerts = function() {
  return this.healthMetrics.alerts.filter(alert => 
    alert.severity === 'critical' && !alert.acknowledged
  );
};

PerformanceMetricsSchema.methods.getServiceSLA = function(serviceName) {
  const service = this.serviceMetrics[serviceName];
  if (!service) return null;

  return {
    availability: service.uptime,
    errorRate: service.errorRate,
    avgResponseTime: service.avgResponseTime,
    slaCompliant: service.uptime >= 99.9 && service.errorRate <= 1 && service.avgResponseTime <= 500,
  };
};

// Static methods
PerformanceMetricsSchema.statics.findByInterval = function(intervalType, fromDate) {
  const query = { 'measurementPeriod.intervalType': intervalType };
  if (fromDate) {
    query['measurementPeriod.startDateTime'] = { $gte: fromDate };
  }
  return this.find(query).sort({ 'measurementPeriod.startDateTime': -1 });
};

PerformanceMetricsSchema.statics.getLatestMetrics = function() {
  return this.findOne().sort({ 'metadata.collectedAt': -1 });
};

PerformanceMetricsSchema.statics.calculateAverageResponseTime = function(serviceName, hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        'metadata.collectedAt': { $gte: since },
      },
    },
    {
      $group: {
        _id: null,
        avgResponseTime: { $avg: `$serviceMetrics.${serviceName}.avgResponseTime` },
        count: { $sum: 1 },
      },
    },
  ]);
};

PerformanceMetricsSchema.statics.getPerformanceTrend = function(serviceName, days = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        'metadata.collectedAt': { $gte: since },
        'measurementPeriod.intervalType': 'hour',
      },
    },
    {
      $project: {
        hour: { $dateToString: { format: '%Y-%m-%d %H:00', date: '$metadata.collectedAt' } },
        responseTime: `$serviceMetrics.${serviceName}.avgResponseTime`,
        errorRate: `$serviceMetrics.${serviceName}.errorRate`,
        uptime: `$serviceMetrics.${serviceName}.uptime`,
      },
    },
    {
      $group: {
        _id: '$hour',
        avgResponseTime: { $avg: '$responseTime' },
        avgErrorRate: { $avg: '$errorRate' },
        avgUptime: { $avg: '$uptime' },
      },
    },
    { $sort: { '_id': 1 } },
  ]);
};

// Pre-save middleware
PerformanceMetricsSchema.pre('save', function(next) {
  // Generate ID if not provided
  if (!this.id) {
    const timestamp = Date.now();
    const interval = this.measurementPeriod.intervalType;
    this.id = `metrics-${interval}-${timestamp}`;
  }
  
  // Generate href
  if (!this.href) {
    this.href = `/tmf-api/privacyManagement/v1/metrics/${this.id}`;
  }
  
  // Calculate overall health score
  this.healthMetrics.overallHealthScore = this.calculateHealthScore();
  
  next();
});

// Calculate health score method
PerformanceMetricsSchema.methods.calculateHealthScore = function() {
  let score = 100;
  
  // Service availability impact
  const services = ['consentService', 'preferenceService', 'partyService', 'dsarService', 'eventService'];
  const avgUptime = services.reduce((sum, service) => {
    return sum + (this.serviceMetrics[service]?.uptime || 0);
  }, 0) / services.length;
  
  score = score * (avgUptime / 100);
  
  // Error rate impact
  const avgErrorRate = services.reduce((sum, service) => {
    return sum + (this.serviceMetrics[service]?.errorRate || 0);
  }, 0) / services.length;
  
  score = score * (1 - (avgErrorRate / 100));
  
  // System resource impact
  if (this.systemMetrics.cpu.usage > 80) score -= 10;
  if (this.systemMetrics.memory.usage > 85) score -= 10;
  if (this.systemMetrics.disk.usage > 90) score -= 15;
  
  return Math.max(0, Math.round(score));
};

const PerformanceMetrics = mongoose.model('PerformanceMetrics', PerformanceMetricsSchema);

module.exports = PerformanceMetrics;
