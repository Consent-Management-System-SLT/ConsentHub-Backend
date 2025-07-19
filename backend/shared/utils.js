const mongoose = require('mongoose');
const logger = require('./utils/logger');

// MongoDB connection utility
const connectDB = async (uri) => {
  try {
    // Connect with proper options to prevent buffering timeouts
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 5, // Maintain a minimum number of connections
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    });
    
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// UUID generator
const { v4: uuidv4 } = require('uuid');

const generateUUID = () => {
  return uuidv4();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  logger.error(err.message, { error: err.stack });

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format'
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      error: 'Duplicate key error'
    });
  }

  res.status(500).json({
    error: 'Internal server error'
  });
};

// Audit log utility
const createAuditLog = async (action, userId, service, details = {}) => {
  const { createAuditLog: createLog } = require('./utils/auditLogger');
  
  try {
    await createLog({
      action,
      userId,
      service,
      details
    });
    logger.info(`Audit log created: ${action} by ${userId} in ${service}`);
  } catch (error) {
    logger.error('Failed to create audit log:', error);
  }
};

module.exports = {
  connectDB,
  logger,
  generateUUID,
  errorHandler,
  createAuditLog,
};
