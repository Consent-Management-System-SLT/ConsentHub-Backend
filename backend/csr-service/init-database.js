const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Import models
const Party = require('./models/Party');
const Consent = require('./models/Consent');
const Preference = require('./models/Preference');
const DSAR = require('./models/DSAR');
const AuditLog = require('./models/AuditLog');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://consentuser:12345@consentcluster.ylmrqgl.mongodb.net/consentDB?retryWrites=true&w=majority';

async function initializeDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data (optional - remove in production)
    console.log('Clearing existing data...');
    await Party.deleteMany({});
    await Consent.deleteMany({});
    await Preference.deleteMany({});
    await DSAR.deleteMany({});
    await AuditLog.deleteMany({});

    // Create sample parties
    console.log('Creating sample parties...');
    const parties = [
      {
        id: uuidv4(),
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        dateOfBirth: new Date('1990-01-15'),
        type: 'individual',
        status: 'active',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        preferences: {
          language: 'en',
          timezone: 'America/New_York',
          communicationPreference: 'email'
        },
        identifiers: {
          nationalId: 'SSN123456789',
          customerId: 'CUST001',
          loyaltyId: 'LOY001'
        },
        metadata: {
          source: 'web_registration',
          campaign: 'spring_2024',
          registrationDate: new Date('2024-01-15')
        }
      },
      {
        id: uuidv4(),
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1234567891',
        dateOfBirth: new Date('1985-03-22'),
        type: 'individual',
        status: 'active',
        address: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        preferences: {
          language: 'en',
          timezone: 'America/Los_Angeles',
          communicationPreference: 'sms'
        },
        identifiers: {
          nationalId: 'SSN987654321',
          customerId: 'CUST002',
          loyaltyId: 'LOY002'
        },
        metadata: {
          source: 'mobile_app',
          campaign: 'summer_2024',
          registrationDate: new Date('2024-02-10')
        }
      },
      {
        id: uuidv4(),
        name: 'Robert Johnson',
        email: 'robert.johnson@example.com',
        phone: '+1234567892',
        dateOfBirth: new Date('1978-07-08'),
        type: 'individual',
        status: 'active',
        address: {
          street: '789 Pine Rd',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'USA'
        },
        preferences: {
          language: 'en',
          timezone: 'America/Chicago',
          communicationPreference: 'phone'
        },
        identifiers: {
          nationalId: 'SSN456789123',
          customerId: 'CUST003',
          loyaltyId: 'LOY003'
        },
        metadata: {
          source: 'store_visit',
          campaign: 'winter_2024',
          registrationDate: new Date('2024-01-20')
        }
      }
    ];

    const savedParties = await Party.insertMany(parties);
    console.log(`Created ${savedParties.length} parties`);

    // Create sample consents
    console.log('Creating sample consents...');
    const consents = [
      {
        id: uuidv4(),
        partyId: savedParties[0].id,
        purpose: 'marketing',
        consentType: 'marketing',
        status: 'granted',
        grantedAt: new Date('2024-01-15'),
        expiresAt: new Date('2025-01-15'),
        source: 'web',
        ipAddress: '192.168.1.100',
        legalBasis: 'consent',
        category: 'marketing',
        metadata: {
          formVersion: '1.2',
          campaign: 'spring_2024',
          processingPurpose: 'Send marketing emails and promotional offers',
          dataRetentionPeriod: '2 years',
          consentMethod: 'opt_in',
          consentSource: 'web_form',
          dataCategories: ['email', 'name', 'phone']
        }
      },
      {
        id: uuidv4(),
        partyId: savedParties[0].id,
        purpose: 'analytics',
        consentType: 'analytics',
        status: 'granted',
        grantedAt: new Date('2024-01-15'),
        expiresAt: new Date('2025-01-15'),
        source: 'web',
        ipAddress: '192.168.1.100',
        legalBasis: 'consent',
        category: 'analytics',
        metadata: {
          formVersion: '1.2',
          campaign: 'spring_2024',
          processingPurpose: 'Analyze user behavior and improve services',
          dataRetentionPeriod: '1 year',
          consentMethod: 'opt_in',
          consentSource: 'web_form',
          dataCategories: ['usage_data', 'device_info']
        }
      },
      {
        id: uuidv4(),
        partyId: savedParties[1].id,
        purpose: 'marketing',
        consentType: 'marketing',
        status: 'granted',
        grantedAt: new Date('2024-02-10'),
        expiresAt: new Date('2025-02-10'),
        source: 'mobile',
        legalBasis: 'consent',
        category: 'marketing',
        metadata: {
          appVersion: '2.1.0',
          campaign: 'summer_2024',
          deviceId: 'mobile_123',
          processingPurpose: 'Send marketing SMS and promotional offers',
          dataRetentionPeriod: '2 years',
          consentMethod: 'opt_in',
          consentSource: 'mobile_app',
          dataCategories: ['email', 'name', 'phone']
        }
      },
      {
        id: uuidv4(),
        partyId: savedParties[2].id,
        purpose: 'functional',
        consentType: 'service_improvement',
        status: 'granted',
        grantedAt: new Date('2024-01-20'),
        expiresAt: new Date('2025-01-20'),
        source: 'csr',
        legalBasis: 'consent',
        category: 'functional',
        metadata: {
          storeLocation: 'Chicago_Main',
          campaign: 'winter_2024',
          staffId: 'STAFF001',
          processingPurpose: 'Provide personalized service and account management',
          dataRetentionPeriod: '5 years',
          consentMethod: 'opt_in',
          consentSource: 'in_store',
          dataCategories: ['name', 'email', 'preferences']
        }
      }
    ];

    const savedConsents = await Consent.insertMany(consents);
    console.log(`Created ${savedConsents.length} consents`);

    // Create sample preferences
    console.log('Creating sample preferences...');
    const preferences = [
      {
        id: uuidv4(),
        partyId: savedParties[0].id,
        preferredChannels: {
          email: true,
          sms: false,
          phone: true,
          push: true,
          mail: false
        },
        topicSubscriptions: {
          marketing: true,
          promotions: true,
          serviceUpdates: true,
          billing: true,
          security: true,
          newsletter: true,
          surveys: false
        },
        frequency: 'weekly',
        timezone: 'America/New_York',
        language: 'en'
      },
      {
        id: uuidv4(),
        partyId: savedParties[1].id,
        preferredChannels: {
          email: true,
          sms: true,
          phone: false,
          push: true,
          mail: false
        },
        topicSubscriptions: {
          marketing: true,
          promotions: true,
          serviceUpdates: true,
          billing: true,
          security: true,
          newsletter: false,
          surveys: true
        },
        frequency: 'daily',
        timezone: 'America/Los_Angeles',
        language: 'en'
      },
      {
        id: uuidv4(),
        partyId: savedParties[2].id,
        preferredChannels: {
          email: true,
          sms: false,
          phone: true,
          push: false,
          mail: true
        },
        topicSubscriptions: {
          marketing: false,
          promotions: false,
          serviceUpdates: true,
          billing: true,
          security: true,
          newsletter: true,
          surveys: false
        },
        frequency: 'monthly',
        timezone: 'America/Chicago',
        language: 'en'
      }
    ];

    const savedPreferences = await Preference.insertMany(preferences);
    console.log(`Created ${savedPreferences.length} preferences`);

    // Create sample DSAR requests
    console.log('Creating sample DSAR requests...');
    const dsarRequests = [
      {
        id: uuidv4(),
        partyId: savedParties[0].id,
        requestType: 'access',
        description: 'Request to access all personal data held by the company',
        status: 'completed',
        priority: 'medium',
        submittedAt: new Date('2024-01-20'),
        dueDate: new Date('2024-02-19'),
        completedAt: new Date('2024-02-15'),
        assignedTo: 'privacy_officer_1',
        verificationStatus: 'verified',
        verificationMethod: 'email',
        response: {
          message: 'Data export provided via secure download link',
          deliveredAt: new Date('2024-02-15')
        },
        notes: [{
          author: 'CSR Agent',
          message: 'Customer requested full data export',
          timestamp: new Date('2024-01-20'),
          isInternal: false
        }],
        metadata: {
          source: 'customer_portal',
          channel: 'web',
          ipAddress: '192.168.1.100'
        }
      },
      {
        id: uuidv4(),
        partyId: savedParties[1].id,
        requestType: 'rectification',
        description: 'Request to correct incorrect phone number in account',
        status: 'in_progress',
        priority: 'high',
        submittedAt: new Date('2024-02-01'),
        dueDate: new Date('2024-03-02'),
        assignedTo: 'privacy_officer_2',
        verificationStatus: 'verified',
        verificationMethod: 'phone',
        notes: [{
          author: 'CSR Agent',
          message: 'Customer provided documentation for phone number correction',
          timestamp: new Date('2024-02-01'),
          isInternal: false
        }],
        metadata: {
          source: 'customer_service',
          channel: 'phone',
          ipAddress: '192.168.1.101'
        }
      },
      {
        id: uuidv4(),
        partyId: savedParties[2].id,
        requestType: 'erasure',
        description: 'Request to delete all personal data following account closure',
        status: 'pending',
        priority: 'medium',
        submittedAt: new Date('2024-02-05'),
        dueDate: new Date('2024-03-06'),
        assignedTo: 'privacy_officer_1',
        verificationStatus: 'pending',
        verificationMethod: 'identity_document',
        notes: [{
          author: 'CSR Agent',
          message: 'Customer closed account and requested full data deletion',
          timestamp: new Date('2024-02-05'),
          isInternal: false
        }],
        metadata: {
          source: 'customer_portal',
          channel: 'web',
          ipAddress: '192.168.1.102'
        }
      }
    ];

    const savedDSARs = await DSAR.insertMany(dsarRequests);
    console.log(`Created ${savedDSARs.length} DSAR requests`);

    // Create sample audit logs
    console.log('Creating sample audit logs...');
    const auditLogs = [
      {
        id: uuidv4(),
        eventType: 'consent_granted',
        partyId: savedParties[0].id,
        actorType: 'user',
        resourceId: savedConsents[0].id,
        resourceType: 'consent',
        action: 'grant',
        description: 'Customer granted marketing consent',
        timestamp: new Date('2024-01-15T10:30:00Z'),
        details: {
          consentId: savedConsents[0].id,
          purpose: 'marketing',
          method: 'opt_in'
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        source: 'web'
      },
      {
        id: uuidv4(),
        eventType: 'party_created',
        partyId: savedParties[1].id,
        actorType: 'system',
        resourceId: savedParties[1].id,
        resourceType: 'party',
        action: 'create',
        description: 'New customer account created',
        timestamp: new Date('2024-02-10T14:15:00Z'),
        details: {
          partyId: savedParties[1].id,
          name: 'Jane Smith',
          source: 'mobile_app'
        },
        ipAddress: '192.168.1.101',
        userAgent: 'ConsentApp/2.1.0 (iOS 17.0)',
        source: 'mobile'
      },
      {
        id: uuidv4(),
        eventType: 'dsar_submitted',
        partyId: savedParties[0].id,
        actorType: 'user',
        resourceId: savedDSARs[0].id,
        resourceType: 'dsar',
        action: 'create',
        description: 'Data access request submitted',
        timestamp: new Date('2024-01-20T09:00:00Z'),
        details: {
          requestId: savedDSARs[0].id,
          requestType: 'access',
          priority: 'medium'
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        source: 'web'
      }
    ];

    const savedAuditLogs = await AuditLog.insertMany(auditLogs);
    console.log(`Created ${savedAuditLogs.length} audit logs`);

    console.log('\nDatabase initialization completed successfully!');
    console.log('Summary:');
    console.log(`- Parties: ${savedParties.length}`);
    console.log(`- Consents: ${savedConsents.length}`);
    console.log(`- Preferences: ${savedPreferences.length}`);
    console.log(`- DSAR Requests: ${savedDSARs.length}`);
    console.log(`- Audit Logs: ${savedAuditLogs.length}`);

    // Create indexes
    console.log('\nCreating database indexes...');
    await Party.createIndexes();
    await Consent.createIndexes();
    await Preference.createIndexes();
    await DSAR.createIndexes();
    await AuditLog.createIndexes();
    console.log('Database indexes created successfully!');

  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

// Run the initialization
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
