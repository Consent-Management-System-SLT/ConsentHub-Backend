const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'consent_granted',
      'consent_revoked',
      'consent_updated',
      'preference_updated',
      'dsar_submitted',
      'dsar_completed',
      'party_created',
      'party_updated',
      'login',
      'logout',
      'data_export',
      'data_deletion',
      'system_access',
      'policy_update'
    ]
  },
  partyId: {
    type: String,
    required: false,
    ref: 'Party'
  },
  actorId: {
    type: String,
    required: false
  },
  actorType: {
    type: String,
    enum: ['user', 'system', 'csr', 'admin'],
    default: 'user'
  },
  resourceId: {
    type: String,
    required: false
  },
  resourceType: {
    type: String,
    enum: ['consent', 'preference', 'dsar', 'party', 'audit'],
    required: false
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'read', 'update', 'delete', 'grant', 'revoke', 'export', 'import']
  },
  description: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  oldValues: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  newValues: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },
  sessionId: {
    type: String,
    required: false
  },
  source: {
    type: String,
    enum: ['web', 'mobile', 'api', 'csr', 'admin', 'system'],
    default: 'web'
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info'
  },
  tags: [{
    type: String
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for better performance
auditLogSchema.index({ eventType: 1 });
auditLogSchema.index({ partyId: 1 });
auditLogSchema.index({ actorId: 1 });
auditLogSchema.index({ resourceId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ severity: 1 });
auditLogSchema.index({ source: 1 });

// TTL index for automatic cleanup (optional - keep logs for 2 years)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 }); // 2 years

// Static method to log events
auditLogSchema.statics.logEvent = async function(eventData) {
  try {
    const audit = new this(eventData);
    await audit.save();
    return audit;
  } catch (error) {
    console.error('Failed to log audit event:', error);
    throw error;
  }
};

// Ensure virtual fields are serialized
auditLogSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
