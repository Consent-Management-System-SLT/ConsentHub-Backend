// MongoDB initialization script for ConsentHub
// This script creates the database structure and initial data

db = db.getSiblingDB('consenhub');

// Create collections with validation schemas
db.createCollection('privacyConsents', {
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

db.createCollection('privacyPreferences', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'partyId', 'createdAt'],
      properties: {
        id: { bsonType: 'string' },
        partyId: { bsonType: 'string' },
        notificationPreferences: { bsonType: 'object' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('privacyNotices', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'version', 'title', 'content', 'effectiveDate'],
      properties: {
        id: { bsonType: 'string' },
        version: { bsonType: 'string' },
        title: { bsonType: 'string' },
        content: { bsonType: 'string' },
        effectiveDate: { bsonType: 'date' },
        expirationDate: { bsonType: 'date' },
        status: { enum: ['active', 'inactive', 'draft'] }
      }
    }
  }
});

db.createCollection('privacyAgreements', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'partyId', 'type', 'status', 'createdAt'],
      properties: {
        id: { bsonType: 'string' },
        partyId: { bsonType: 'string' },
        type: { bsonType: 'string' },
        status: { enum: ['active', 'terminated', 'suspended'] },
        validityPeriod: { bsonType: 'object' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('parties', {
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

db.createCollection('events', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'eventType', 'eventTime', 'source'],
      properties: {
        id: { bsonType: 'string' },
        eventType: { bsonType: 'string' },
        eventTime: { bsonType: 'date' },
        source: { bsonType: 'string' },
        data: { bsonType: 'object' }
      }
    }
  }
});

db.createCollection('auditLogs', {
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
        details: { bsonType: 'object' }
      }
    }
  }
});

// Create indexes for better performance
db.privacyConsents.createIndex({ partyId: 1 });
db.privacyConsents.createIndex({ privacyNoticeId: 1 });
db.privacyConsents.createIndex({ status: 1 });
db.privacyConsents.createIndex({ createdAt: -1 });

db.privacyPreferences.createIndex({ partyId: 1 });

db.privacyNotices.createIndex({ version: 1 });
db.privacyNotices.createIndex({ status: 1 });
db.privacyNotices.createIndex({ effectiveDate: -1 });

db.privacyAgreements.createIndex({ partyId: 1 });
db.privacyAgreements.createIndex({ status: 1 });

db.parties.createIndex({ partyType: 1 });

db.events.createIndex({ eventType: 1 });
db.events.createIndex({ eventTime: -1 });
db.events.createIndex({ source: 1 });

db.auditLogs.createIndex({ userId: 1 });
db.auditLogs.createIndex({ timestamp: -1 });
db.auditLogs.createIndex({ service: 1 });

print('ConsentHub database initialized successfully!');
