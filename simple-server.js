require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ConsentHub API Gateway',
    version: '1.0.0'
  });
});

// API Documentation
app.get('/api-docs', (req, res) => {
  res.json({
    title: 'ConsentHub API',
    version: '1.0.0',
    description: 'TM Forum-compliant Consent Management System',
    endpoints: {
      health: '/health',
      consent: '/api/v1/consent',
      preference: '/api/v1/preference',
      'privacy-notice': '/api/v1/privacy-notice',
      agreement: '/api/v1/agreement',
      event: '/api/v1/event',
      party: '/api/v1/party',
      auth: '/api/v1/auth',
      dsar: '/api/v1/dsar',
      // TMF API Endpoints
      'tmf-party-individual': '/tmf-api/party/v5/individual',
      'tmf-consent': '/tmf-api/consent/v1/consent'
    },
    tmfCompliance: {
      'TMF641': 'Party Management API v5.0.0',
      'TMF632': 'Consent Management API v1.0.0'
    }
  });
});

// Basic API routes
app.get('/api/v1/consent/health', (req, res) => {
  res.json({ service: 'consent-service', status: 'running' });
});

app.get('/api/v1/preference/health', (req, res) => {
  res.json({ service: 'preference-service', status: 'running' });
});

app.get('/api/v1/privacy-notice/health', (req, res) => {
  res.json({ service: 'privacy-notice-service', status: 'running' });
});

app.get('/api/v1/agreement/health', (req, res) => {
  res.json({ service: 'agreement-service', status: 'running' });
});

app.get('/api/v1/event/health', (req, res) => {
  res.json({ service: 'event-service', status: 'running' });
});

app.get('/api/v1/party/health', (req, res) => {
  res.json({ service: 'party-service', status: 'running' });
});

app.get('/api/v1/auth/health', (req, res) => {
  res.json({ service: 'auth-service', status: 'running' });
});

app.get('/api/v1/dsar/health', (req, res) => {
  res.json({ service: 'dsar-service', status: 'running' });
});

// Sample data endpoints
app.get('/api/v1/party', (req, res) => {
  const parties = [
    {
      id: 'party-001',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      type: 'individual',
      status: 'active',
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: 'party-002',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+1234567891',
      type: 'individual',
      status: 'active',
      createdAt: '2024-01-20T14:15:00Z'
    },
    {
      id: 'party-003',
      name: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      phone: '+1234567892',
      type: 'individual',
      status: 'active',
      createdAt: '2024-02-01T09:00:00Z'
    },
    {
      id: 'party-004',
      name: 'Alice Brown',
      email: 'alice.brown@example.com',
      phone: '+1234567893',
      type: 'individual',
      status: 'active',
      createdAt: '2024-02-10T16:45:00Z'
    },
    {
      id: 'party-005',
      name: 'Charlie Wilson',
      email: 'charlie.wilson@example.com',
      phone: '+1234567894',
      type: 'individual',
      status: 'active',
      createdAt: '2024-02-15T11:20:00Z'
    }
  ];
  
  const { partyId } = req.query;
  if (partyId) {
    const party = parties.find(p => p.id === partyId);
    if (party) {
      res.json([party]);
    } else {
      res.status(404).json({ error: 'Party not found' });
    }
  } else {
    res.json(parties);
  }
});

app.get('/api/v1/consent', (req, res) => {
  const consents = [
    {
      id: 'consent-001',
      partyId: 'party-001',
      purpose: 'Marketing Communications',
      status: 'granted',
      consentType: 'explicit',
      description: 'Consent for marketing emails and SMS',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      validFor: {
        startDateTime: '2024-01-15T10:30:00Z',
        endDateTime: '2025-01-15T10:30:00Z'
      }
    },
    {
      id: 'consent-002',
      partyId: 'party-002',
      purpose: 'Data Analytics',
      status: 'granted',
      consentType: 'explicit',
      description: 'Consent for data analysis and insights',
      createdAt: '2024-01-20T14:15:00Z',
      updatedAt: '2024-01-20T14:15:00Z',
      validFor: {
        startDateTime: '2024-01-20T14:15:00Z',
        endDateTime: '2025-01-20T14:15:00Z'
      }
    },
    {
      id: 'consent-003',
      partyId: 'party-001',
      purpose: 'Third-party Sharing',
      status: 'revoked',
      consentType: 'explicit',
      description: 'Consent for sharing data with partners',
      createdAt: '2024-01-25T16:00:00Z',
      updatedAt: '2024-02-01T10:00:00Z',
      validFor: {
        startDateTime: '2024-01-25T16:00:00Z',
        endDateTime: '2025-01-25T16:00:00Z'
      }
    }
  ];
  
  const { partyId } = req.query;
  if (partyId) {
    const userConsents = consents.filter(c => c.partyId === partyId);
    res.json(userConsents);
  } else {
    res.json(consents);
  }
});

app.put('/api/v1/consent/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  // Simulate updating consent status
  res.json({
    id,
    status,
    updatedAt: new Date().toISOString(),
    message: 'Consent updated successfully'
  });
});

app.get('/api/v1/dsar', (req, res) => {
  const dsarRequests = [
    {
      id: 'dsar-001',
      partyId: 'party-001',
      requestType: 'access',
      status: 'pending',
      description: 'Request for all personal data',
      submittedAt: '2024-02-01T09:00:00Z',
      createdAt: '2024-02-01T09:00:00Z',
      updatedAt: '2024-02-01T09:00:00Z'
    },
    {
      id: 'dsar-002',
      partyId: 'party-002',
      requestType: 'deletion',
      status: 'in_progress',
      description: 'Request to delete all personal data',
      submittedAt: '2024-01-28T14:30:00Z',
      createdAt: '2024-01-28T14:30:00Z',
      updatedAt: '2024-02-02T10:15:00Z'
    },
    {
      id: 'dsar-003',
      partyId: 'party-003',
      requestType: 'portability',
      status: 'completed',
      description: 'Request for data export',
      submittedAt: '2024-01-20T11:00:00Z',
      createdAt: '2024-01-20T11:00:00Z',
      updatedAt: '2024-01-22T16:45:00Z'
    }
  ];
  
  const { partyId } = req.query;
  if (partyId) {
    const userRequests = dsarRequests.filter(r => r.partyId === partyId);
    res.json(userRequests);
  } else {
    res.json(dsarRequests);
  }
});

app.put('/api/v1/dsar/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  // Simulate updating DSAR request status
  res.json({
    id,
    status,
    updatedAt: new Date().toISOString(),
    message: 'DSAR request updated successfully'
  });
});

app.get('/api/v1/event', (req, res) => {
  const events = [
    {
      id: 'event-001',
      eventType: 'consent_granted',
      partyId: 'party-001',
      description: 'Marketing consent granted',
      source: 'Customer Portal',
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: 'event-002',
      eventType: 'consent_granted',
      partyId: 'party-002',
      description: 'Data analytics consent granted',
      source: 'Customer Portal',
      createdAt: '2024-01-20T14:15:00Z'
    },
    {
      id: 'event-003',
      eventType: 'consent_revoked',
      partyId: 'party-001',
      description: 'Third-party sharing consent revoked',
      source: 'Customer Portal',
      createdAt: '2024-02-01T10:00:00Z'
    },
    {
      id: 'event-004',
      eventType: 'dsar_created',
      partyId: 'party-001',
      description: 'Data access request submitted',
      source: 'Customer Portal',
      createdAt: '2024-02-01T09:00:00Z'
    },
    {
      id: 'event-005',
      eventType: 'dsar_created',
      partyId: 'party-002',
      description: 'Data deletion request submitted',
      source: 'Customer Portal',
      createdAt: '2024-01-28T14:30:00Z'
    },
    {
      id: 'event-006',
      eventType: 'dsar_completed',
      partyId: 'party-003',
      description: 'Data export completed',
      source: 'System',
      createdAt: '2024-01-22T16:45:00Z'
    }
  ];
  
  const { partyId } = req.query;
  if (partyId) {
    const userEvents = events.filter(e => e.partyId === partyId);
    res.json(userEvents);
  } else {
    res.json(events);
  }
});

app.get('/api/v1/privacy-notice', (req, res) => {
  const privacyNotices = [
    {
      id: 'notice-001',
      title: 'General Privacy Notice',
      version: '1.0',
      status: 'active',
      content: 'This is our general privacy notice explaining how we handle your data.',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'notice-002',
      title: 'Marketing Communications Privacy Notice',
      version: '1.0',
      status: 'active',
      content: 'This notice explains how we use your data for marketing purposes.',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'notice-003',
      title: 'Data Analytics Privacy Notice',
      version: '1.0',
      status: 'active',
      content: 'This notice explains how we analyze your data to improve our services.',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  ];
  
  res.json(privacyNotices);
});

app.get('/api/v1/preference', (req, res) => {
  const preferences = [
    {
      id: 'pref-001',
      partyId: 'party-001',
      type: 'communication',
      category: 'marketing',
      value: 'email_only',
      description: 'Receive marketing communications via email only',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: 'pref-002',
      partyId: 'party-002',
      type: 'communication',
      category: 'marketing',
      value: 'all_channels',
      description: 'Receive marketing communications via all channels',
      createdAt: '2024-01-20T14:15:00Z',
      updatedAt: '2024-01-20T14:15:00Z'
    }
  ];
  
  const { partyId } = req.query;
  if (partyId) {
    const userPreferences = preferences.filter(p => p.partyId === partyId);
    res.json(userPreferences);
  } else {
    res.json(preferences);
  }
});

// Dashboard stats endpoint
app.get('/api/v1/dashboard/stats', (req, res) => {
  res.json({
    totalParties: 5,
    totalConsents: 3,
    totalDSARRequests: 3,
    totalPrivacyNotices: 3,
    totalEvents: 6,
    totalPreferences: 2,
    activeConsents: 2,
    revokedConsents: 1,
    pendingDSARRequests: 1,
    completedDSARRequests: 1,
    lastUpdated: new Date().toISOString()
  });
});

// TMF641 Party Management API Endpoints
app.post('/tmf-api/party/v5/individual', (req, res) => {
  console.log('🎯 TMF641 Create Individual Request:', req.body);
  
  try {
    const individualData = req.body;
    
    // Generate unique ID
    const individualId = `individual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create TMF641 compliant individual party response
    const createdIndividual = {
      id: individualId,
      href: `/tmf-api/party/v5/individual/${individualId}`,
      '@type': 'Individual',
      '@baseType': 'Party',
      '@schemaLocation': 'https://schemas.tmforum.org/Party/v5.0.0/schema/Individual.schema.json',
      
      // Basic information
      givenName: individualData.givenName || '',
      familyName: individualData.familyName || '',
      fullName: individualData.fullName || `${individualData.givenName || ''} ${individualData.familyName || ''}`.trim(),
      title: individualData.title || '',
      
      // Personal details
      birthDate: individualData.birthDate || '',
      gender: individualData.gender || 'unknown',
      maritalStatus: individualData.maritalStatus || 'unknown',
      nationality: individualData.nationality || '',
      countryOfBirth: individualData.countryOfBirth || '',
      placeOfBirth: individualData.placeOfBirth || '',
      
      // Status and lifecycle
      status: 'active',
      engagedParty: {
        id: individualId,
        href: `/tmf-api/party/v5/individual/${individualId}`,
        '@type': 'Individual',
        '@referredType': 'Individual',
        name: individualData.fullName || `${individualData.givenName || ''} ${individualData.familyName || ''}`.trim()
      },
      
      // Contact information
      contactMedium: individualData.contactMedium || [],
      
      // TMF compliant timestamps
      creationDate: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      
      // Metadata
      version: '1.0',
      lifecycleStatus: 'active',
      validFor: {
        startDateTime: new Date().toISOString()
      }
    };
    
    console.log('✅ TMF641 Individual Created:', createdIndividual);
    
    // Return success response with redirect header
    res.status(201)
       .header('Location', `/tmf-api/party/v5/individual/${individualId}`)
       .header('X-Redirect-URL', 'https://myslt.slt.lk/')
       .json(createdIndividual);
       
    console.log('🔄 User should be redirected to: https://myslt.slt.lk/');
    
  } catch (error) {
    console.error('❌ TMF641 Individual Creation Error:', error);
    res.status(400).json({
      error: 'Bad Request',
      message: 'Failed to create individual party',
      code: 'TMF641_CREATION_FAILED',
      details: error.message
    });
  }
});

app.get('/tmf-api/party/v5/individual', (req, res) => {
  console.log('🔍 TMF641 Get All Individuals Request');
  
  // Return sample individuals list
  const individuals = [
    {
      id: 'individual-sample-1',
      href: '/tmf-api/party/v5/individual/individual-sample-1',
      '@type': 'Individual',
      '@baseType': 'Party',
      givenName: 'John',
      familyName: 'Doe',
      fullName: 'John Doe',
      status: 'active',
      creationDate: '2024-01-15T10:30:00Z'
    }
  ];
  
  res.status(200).json(individuals);
});

app.get('/tmf-api/party/v5/individual/:id', (req, res) => {
  console.log('🔍 TMF641 Get Individual by ID:', req.params.id);
  
  const individualId = req.params.id;
  
  // Return sample individual
  const individual = {
    id: individualId,
    href: `/tmf-api/party/v5/individual/${individualId}`,
    '@type': 'Individual',
    '@baseType': 'Party',
    '@schemaLocation': 'https://schemas.tmforum.org/Party/v5.0.0/schema/Individual.schema.json',
    givenName: 'Sample',
    familyName: 'User',
    fullName: 'Sample User',
    status: 'active',
    creationDate: new Date().toISOString(),
    lastUpdate: new Date().toISOString()
  };
  
  res.status(200).json(individual);
});

// TMF632 Consent Management API Endpoints
app.post('/tmf-api/consent/v1/consent', (req, res) => {
  console.log('🎯 TMF632 Create Consent Request:', req.body);
  
  try {
    const consentData = req.body;
    
    // Generate unique ID
    const consentId = `consent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create TMF632 compliant consent response
    const createdConsent = {
      id: consentId,
      href: `/tmf-api/consent/v1/consent/${consentId}`,
      '@type': 'Consent',
      '@baseType': 'EntitySpecification',
      '@schemaLocation': 'https://schemas.tmforum.org/Consent/v1.0.0/schema/Consent.schema.json',
      
      // Consent details
      name: consentData.name || 'User Consent',
      description: consentData.description || 'Consent for data processing',
      consentType: consentData.consentType || 'explicit',
      status: 'granted',
      
      // Associated party
      party: consentData.party || {
        id: 'unknown',
        '@type': 'Individual',
        '@referredType': 'Individual',
        name: 'Unknown User'
      },
      
      // Data categories and purposes
      dataCategory: consentData.dataCategory || ['personal_data'],
      processingPurpose: consentData.processingPurpose || ['service_provision'],
      
      // Timestamps
      grantDate: new Date().toISOString(),
      creationDate: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      
      // Validity period
      validFor: {
        startDateTime: new Date().toISOString(),
        endDateTime: consentData.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year default
      },
      
      // Metadata
      version: '1.0',
      lifecycleStatus: 'active'
    };
    
    console.log('✅ TMF632 Consent Created:', createdConsent);
    
    res.status(201)
       .header('Location', `/tmf-api/consent/v1/consent/${consentId}`)
       .json(createdConsent);
       
  } catch (error) {
    console.error('❌ TMF632 Consent Creation Error:', error);
    res.status(400).json({
      error: 'Bad Request',
      message: 'Failed to create consent',
      code: 'TMF632_CREATION_FAILED',
      details: error.message
    });
  }
});

app.get('/tmf-api/consent/v1/consent', (req, res) => {
  console.log('🔍 TMF632 Get All Consents Request');
  
  // Return sample consents list
  const consents = [
    {
      id: 'consent-sample-1',
      href: '/tmf-api/consent/v1/consent/consent-sample-1',
      '@type': 'Consent',
      '@baseType': 'EntitySpecification',
      name: 'Data Processing Consent',
      status: 'granted',
      consentType: 'explicit',
      grantDate: '2024-01-15T10:30:00Z'
    }
  ];
  
  res.status(200).json(consents);
});

// Catch-all route
app.get('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'API endpoint not found',
    availableEndpoints: ['/health', '/api-docs', '/api/v1/*/health']
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Gateway error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`🚀 ConsentHub API Gateway running on ${HOST}:${PORT}`);
  console.log(`📚 API Documentation available at http://${HOST}:${PORT}/api-docs`);
  console.log(`❤️  Health check available at http://${HOST}:${PORT}/health`);
});

module.exports = app;
