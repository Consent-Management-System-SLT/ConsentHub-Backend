const mongoose = require('mongoose');
const { getSecureEnvVar, maskForLogging } = require('../utils/envEncryption');
require('dotenv').config();

const connectDB = async () => {
  const mongoUri = getSecureEnvVar('MONGODB_URI');
  if (!mongoUri) {
    throw new Error('MONGODB_URI is required; refusing to use an embedded database credential or implicit database');
  }

  try {
    console.log(`Connecting to MongoDB (${maskForLogging(mongoUri, 8)})`);
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    mongoose.connection.on('error', (error) => console.error('MongoDB connection error:', error));
    mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
    process.once('SIGINT', async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
    return conn;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
};

module.exports = connectDB;
