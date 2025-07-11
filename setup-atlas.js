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

    // Function to create collection if it doesn't exist
    async function createCollectionIfNotExists(collectionName, options) {
      try {
        const collections = await db.listCollections({ name: collectionName }).toArray();
        if (collections.length === 0) {
          await db.createCollection(collectionName, options);
          console.log(`✅ Created collection: ${collectionName}`);
        } else {
          console.log(`ℹ️  Collection already exists: ${collectionName}`);
        }
      } catch (error) {
        if (error.code === 48) { // NamespaceExists
          console.log(`ℹ️  Collection already exists: ${collectionName}`);
        } else {
          throw error;
        }
      }
    }

    // Privacy Consents Collection
    await createCollectionIfNotExists('privacyConsents', {
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
    await createCollectionIfNotExists('privacyPreferences', {
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
    await createCollectionIfNotExists('privacyNotices', {
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
    await createCollectionIfNotExists('privacyAgreements', {
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
    await createCollectionIfNotExists('parties', {
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
    await createCollectionIfNotExists('events', {
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
    await createCollectionIfNotExists('dsarRequests', {
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
    await createCollectionIfNotExists('auditLogs', {
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

    // Function to create index if it doesn't exist
    async function createIndexIfNotExists(collection, indexSpec, indexName) {
      try {
        const existingIndexes = await collection.listIndexes().toArray();
        const indexExists = existingIndexes.some(index => 
          JSON.stringify(index.key) === JSON.stringify(indexSpec)
        );
        
        if (!indexExists) {
          await collection.createIndex(indexSpec);
          console.log(`✅ Created index on ${collection.collectionName}: ${JSON.stringify(indexSpec)}`);
        } else {
          console.log(`ℹ️  Index already exists on ${collection.collectionName}: ${JSON.stringify(indexSpec)}`);
        }
      } catch (error) {
        console.log(`⚠️  Could not create index on ${collection.collectionName}: ${error.message}`);
      }
    }

    // Privacy Consents indexes
    await createIndexIfNotExists(db.collection('privacyConsents'), { partyId: 1 });
    await createIndexIfNotExists(db.collection('privacyConsents'), { privacyNoticeId: 1 });
    await createIndexIfNotExists(db.collection('privacyConsents'), { status: 1 });
    await createIndexIfNotExists(db.collection('privacyConsents'), { createdAt: -1 });
    await createIndexIfNotExists(db.collection('privacyConsents'), { purpose: 1 });

    // Privacy Preferences indexes
    await createIndexIfNotExists(db.collection('privacyPreferences'), { partyId: 1 });

    // Privacy Notices indexes
    await createIndexIfNotExists(db.collection('privacyNotices'), { version: 1 });
    await createIndexIfNotExists(db.collection('privacyNotices'), { status: 1 });
    await createIndexIfNotExists(db.collection('privacyNotices'), { effectiveDate: -1 });
    await createIndexIfNotExists(db.collection('privacyNotices'), { category: 1 });

    // Privacy Agreements indexes
    await createIndexIfNotExists(db.collection('privacyAgreements'), { partyId: 1 });
    await createIndexIfNotExists(db.collection('privacyAgreements'), { status: 1 });
    await createIndexIfNotExists(db.collection('privacyAgreements'), { agreementType: 1 });

    // Parties indexes
    await createIndexIfNotExists(db.collection('parties'), { partyType: 1 });
    await createIndexIfNotExists(db.collection('parties'), { 'contactInformation.contactValue': 1 });

    // Events indexes
    await createIndexIfNotExists(db.collection('events'), { eventType: 1 });
    await createIndexIfNotExists(db.collection('events'), { eventTime: -1 });
    await createIndexIfNotExists(db.collection('events'), { source: 1 });
    await createIndexIfNotExists(db.collection('events'), { correlationId: 1 });

    // DSAR Requests indexes
    await createIndexIfNotExists(db.collection('dsarRequests'), { partyId: 1 });
    await createIndexIfNotExists(db.collection('dsarRequests'), { requestType: 1 });
    await createIndexIfNotExists(db.collection('dsarRequests'), { status: 1 });
    await createIndexIfNotExists(db.collection('dsarRequests'), { createdAt: -1 });

    // Audit Logs indexes
    await createIndexIfNotExists(db.collection('auditLogs'), { userId: 1 });
    await createIndexIfNotExists(db.collection('auditLogs'), { timestamp: -1 });
    await createIndexIfNotExists(db.collection('auditLogs'), { service: 1 });
    await createIndexIfNotExists(db.collection('auditLogs'), { action: 1 });

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

    // Check if sample notice already exists
    const existingNotice = await db.collection('privacyNotices').findOne({ id: sampleNotice.id });
    if (!existingNotice) {
      await db.collection('privacyNotices').insertOne(sampleNotice);
      console.log('✅ Sample privacy notice inserted');
    } else {
      console.log('ℹ️  Sample privacy notice already exists');
    }

    console.log('✅ Sample data processed');

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
