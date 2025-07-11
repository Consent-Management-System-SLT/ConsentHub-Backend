const mongoose = require('mongoose');
const logger = require('./logger');

// Audit Log Schema
const auditLogSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString(),
    unique: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  service: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: String,
  userAgent: String,
  correlationId: String
}, {
  timestamps: true,
  collection: 'auditLogs'
});

// Indexes for performance
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ service: 1, timestamp: -1 });

// TTL index to automatically delete old logs after 2 years
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 }); // 2 years

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

/**
 * Create an audit log entry
 * @param {Object} logData - The audit log data
 * @param {string} logData.action - The action performed
 * @param {string} logData.userId - The user who performed the action
 * @param {string} logData.service - The service that logged the action
 * @param {Object} logData.details - Additional details about the action
 * @param {string} logData.ipAddress - IP address of the user
 * @param {string} logData.userAgent - User agent string
 * @param {string} logData.correlationId - Correlation ID for request tracing
 */
async function createAuditLog(logData) {
  try {
    const auditLog = new AuditLog({
      action: logData.action,
      userId: logData.userId,
      service: logData.service,
      details: logData.details || {},
      ipAddress: logData.ipAddress,
      userAgent: logData.userAgent,
      correlationId: logData.correlationId,
      timestamp: new Date()
    });

    await auditLog.save();
    
    logger.info('Audit log created', {
      action: logData.action,
      userId: logData.userId,
      service: logData.service,
      auditLogId: auditLog.id
    });

    return auditLog;
  } catch (error) {
    logger.error('Failed to create audit log', {
      error: error.message,
      logData
    });
    // Don't throw error to avoid breaking the main flow
    return null;
  }
}

/**
 * Get audit logs with filtering and pagination
 * @param {Object} filters - Filter criteria
 * @param {Object} pagination - Pagination options
 */
async function getAuditLogs(filters = {}, pagination = {}) {
  try {
    const {
      offset = 0,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = pagination;

    const query = {};
    
    if (filters.action) query.action = filters.action;
    if (filters.userId) query.userId = filters.userId;
    if (filters.service) query.service = filters.service;
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [logs, totalCount] = await Promise.all([
      AuditLog.find(query)
        .sort(sort)
        .skip(parseInt(offset))
        .limit(parseInt(limit))
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    return {
      logs,
      totalCount,
      hasMore: offset + limit < totalCount
    };
  } catch (error) {
    logger.error('Failed to retrieve audit logs', {
      error: error.message,
      filters,
      pagination
    });
    throw error;
  }
}

/**
 * Get audit logs for a specific user
 * @param {string} userId - User ID
 * @param {Object} pagination - Pagination options
 */
async function getUserAuditLogs(userId, pagination = {}) {
  return getAuditLogs({ userId }, pagination);
}

/**
 * Get audit logs for a specific service
 * @param {string} service - Service name
 * @param {Object} pagination - Pagination options
 */
async function getServiceAuditLogs(service, pagination = {}) {
  return getAuditLogs({ service }, pagination);
}

/**
 * Delete old audit logs (manual cleanup)
 * @param {Date} beforeDate - Delete logs before this date
 */
async function deleteOldAuditLogs(beforeDate) {
  try {
    const result = await AuditLog.deleteMany({
      timestamp: { $lt: beforeDate }
    });
    
    logger.info('Old audit logs deleted', {
      deletedCount: result.deletedCount,
      beforeDate
    });
    
    return result.deletedCount;
  } catch (error) {
    logger.error('Failed to delete old audit logs', {
      error: error.message,
      beforeDate
    });
    throw error;
  }
}

module.exports = {
  createAuditLog,
  getAuditLogs,
  getUserAuditLogs,
  getServiceAuditLogs,
  deleteOldAuditLogs,
  AuditLog
};
