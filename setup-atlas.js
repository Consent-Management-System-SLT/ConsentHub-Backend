#!/usr/bin/env node

/**
 * MongoDB Atlas Setup Script for ConsentHub
 * This script initializes the database with collections, indexes, and sample data
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function setupDatabase() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'consenhub';

  if (!uri) {
    console.error('❌ MONGODB_URI environment variable is required');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const db = client.db(dbName);

    // Create collections with validation schemas
    console.log('🔄 Creating collections...');

    // Privacy Consents Collection
    await db.createCollection('privacyConsents', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['id', 'partyId', 'status', 'createdAt'],
          properties: {
            id: { bsonType: 'string' },
            partyId: { bsonType: 'string' },
            privacyNoticeId: { bsonType: 'string' },
            productId: { bsonType: 'string' },
            status: { enum: ['granted', 'revoked', 'pending'] },
            purpose: { bsonType: 'string' },
            geoLocation: { bsonType: 'string' },
            validityPeriod: { bsonType: 'object' },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' }
          }
        }
      }
    });

    // Privacy Preferences Collection
    await db.createCollection('privacyPreferences', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['id', 'partyId', 'createdAt'],
          properties: {
            id: { bsonType: 'string' },
            partyId: { bsonType: 'string' },
            notificationPreferences: { bsonType: 'object' },
            deviceTokens: { bsonType: 'array' },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' }
          }
        }
      }
    });

    // Privacy Notices Collection
    await db.createCollection('privacyNotices', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['id', 'version', 'title', 'content', 'effectiveDate'],
          properties: {
            id: { bsonType: 'string' },
            version: { bsonType: 'string' },
            title: { bsonType: 'string' },
            content: { bsonType: 'string' },
            category: { bsonType: 'string' },
            effectiveDate: { bsonType: 'date' },
            expirationDate: { bsonType: 'date' },
            status: { enum: ['active', 'inactive', 'draft'] }
          }
        }
      }
    });

    // Privacy Agreements Collection
    await db.createCollection('privacyAgreements', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['id', 'partyId', 'name', 'status', 'createdAt'],
          properties: {
            id: { bsonType: 'string' },
            partyId: { bsonType: 'string' },
            name: { bsonType: 'string' },
            agreementType: { bsonType: 'string' },
            status: { enum: ['active', 'terminated', 'suspended'] },
            validityPeriod: { bsonType: 'object' },
            agreementSpecification: { bsonType: 'object' },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' }
          }
        }
      }
    });

    // Parties Collection
    await db.createCollection('parties', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['id', 'partyType', 'createdAt'],
          properties: {
            id: { bsonType: 'string' },
            partyType: { enum: ['individual', 'organization'] },
            name: { bsonType: 'string' },
            contactInformation: { bsonType: 'array' },
            characteristics: { bsonType: 'array' },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' }
          }
        }
      }
    });

    // Events Collection
    await db.createCollection('events', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['id', 'eventType', 'eventTime', 'source'],
          properties: {
            id: { bsonType: 'string' },
            eventType: { bsonType: 'string' },
            eventTime: { bsonType: 'date' },
            source: { bsonType: 'string' },
            data: { bsonType: 'object' },
            correlationId: { bsonType: 'string' }
          }
        }
      }
    });

    // DSAR Requests Collection
    await db.createCollection('dsarRequests', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['id', 'partyId', 'requestType', 'status', 'createdAt'],
          properties: {
            id: { bsonType: 'string' },
            partyId: { bsonType: 'string' },
            requestType: { enum: ['access', 'erasure', 'portability', 'rectification'] },
            status: { enum: ['pending', 'in_progress', 'completed', 'cancelled'] },
            description: { bsonType: 'string' },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' },
            completedAt: { bsonType: 'date' }
          }
        }
      }
    });

    // Audit Logs Collection
    await db.createCollection('auditLogs', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['id', 'action', 'userId', 'timestamp', 'service'],
          properties: {
            id: { bsonType: 'string' },
            action: { bsonType: 'string' },
            userId: { bsonType: 'string' },
            timestamp: { bsonType: 'date' },
            service: { bsonType: 'string' },
            details: { bsonType: 'object' },
            ipAddress: { bsonType: 'string' },
            userAgent: { bsonType: 'string' }
          }
        }
      }
    });

    console.log('✅ Collections created successfully');

    // Create indexes for better performance
    console.log('🔄 Creating indexes...');

    // Privacy Consents indexes
    await db.collection('privacyConsents').createIndex({ partyId: 1 });
    await db.collection('privacyConsents').createIndex({ privacyNoticeId: 1 });
    await db.collection('privacyConsents').createIndex({ status: 1 });
    await db.collection('privacyConsents').createIndex({ createdAt: -1 });
    await db.collection('privacyConsents').createIndex({ purpose: 1 });

    // Privacy Preferences indexes
    await db.collection('privacyPreferences').createIndex({ partyId: 1 });

    // Privacy Notices indexes
    await db.collection('privacyNotices').createIndex({ version: 1 });
    await db.collection('privacyNotices').createIndex({ status: 1 });
    await db.collection('privacyNotices').createIndex({ effectiveDate: -1 });
    await db.collection('privacyNotices').createIndex({ category: 1 });

    // Privacy Agreements indexes
    await db.collection('privacyAgreements').createIndex({ partyId: 1 });
    await db.collection('privacyAgreements').createIndex({ status: 1 });
    await db.collection('privacyAgreements').createIndex({ agreementType: 1 });

    // Parties indexes
    await db.collection('parties').createIndex({ partyType: 1 });
    await db.collection('parties').createIndex({ 'contactInformation.contactValue': 1 });

    // Events indexes
    await db.collection('events').createIndex({ eventType: 1 });
    await db.collection('events').createIndex({ eventTime: -1 });
    await db.collection('events').createIndex({ source: 1 });
    await db.collection('events').createIndex({ correlationId: 1 });

    // DSAR Requests indexes
    await db.collection('dsarRequests').createIndex({ partyId: 1 });
    await db.collection('dsarRequests').createIndex({ requestType: 1 });
    await db.collection('dsarRequests').createIndex({ status: 1 });
    await db.collection('dsarRequests').createIndex({ createdAt: -1 });

    // Audit Logs indexes
    await db.collection('auditLogs').createIndex({ userId: 1 });
    await db.collection('auditLogs').createIndex({ timestamp: -1 });
    await db.collection('auditLogs').createIndex({ service: 1 });
    await db.collection('auditLogs').createIndex({ action: 1 });

    console.log('✅ Indexes created successfully');

    // Insert sample data
    console.log('🔄 Inserting sample data...');

    // Sample Privacy Notice
    const sampleNotice = {
      id: 'general-privacy-notice-v1',
      version: '1.0',
      title: 'SLT Mobitel General Privacy Notice',
      content: 'This privacy notice describes how SLT Mobitel collects, uses, and protects your personal information...',
      category: 'general',
      effectiveDate: new Date(),
      status: 'active'
    };

    await db.collection('privacyNotices').insertOne(sampleNotice);

    console.log('✅ Sample data inserted');

    console.log('\n🎉 ConsentHub database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update your .env file with the correct Atlas connection string');
    console.log('2. Configure your Firebase credentials');
    console.log('3. Start your ConsentHub services');
    console.log('\n💡 Your database is ready at:', uri);

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the setup
setupDatabase().catch(console.error);
