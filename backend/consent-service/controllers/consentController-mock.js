const { generateUUID, logger, createAuditLog } = require('../../shared/utils');
const axios = require('axios');

class ConsentController {
  // Create new privacy consent
  async createConsent(req, res) {
    try {
      logger.info('Mock creating new consent');
      
      const mockConsent = {
        id: generateUUID(),
        partyId: req.body.partyId,
        privacyNoticeId: req.body.privacyNoticeId,
        productId: req.body.productId,
        purpose: req.body.purpose,
        status: req.body.status || 'granted',
        geoLocation: req.body.geoLocation,
        validityPeriod: req.body.validityPeriod,
        consentData: req.body.consentData || {},
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create audit log
      await createAuditLog(
        'CREATE_CONSENT',
        req.user?.uid || 'admin-demo',
        'consent-service',
        { consentId: mockConsent.id, partyId: mockConsent.partyId }
      );

      // Emit event
      await this.emitConsentEvent('PrivacyConsentCreated', mockConsent);

      logger.info(`Mock privacy consent created: ${mockConsent.id}`);
      res.status(201).json(mockConsent);
    } catch (error) {
      logger.error('Error creating consent:', error);
      res.status(500).json({ error: 'Failed to create consent' });
    }
  }

  // Get consents by partyId
  async getConsentsByParty(req, res) {
    try {
      const { partyId } = req.params;
      const { status, purpose, limit = 10, offset = 0 } = req.query;

      logger.info(`Mock serving consents for party: ${partyId}`);
      
      const mockConsents = [
        {
          id: 'consent-001',
          partyId: partyId,
          privacyNoticeId: 'notice-001',
          purpose: 'Marketing Communications',
          status: status || 'granted',
          validityPeriod: {
            startDateTime: new Date('2024-01-01'),
            endDateTime: new Date('2024-12-31')
          },
          geoLocation: 'US',
          consentData: {
            emailMarketing: true,
            smsMarketing: false
          },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        },
        {
          id: 'consent-002',
          partyId: partyId,
          privacyNoticeId: 'notice-002',
          purpose: 'Data Analytics',
          status: status || 'granted',
          validityPeriod: {
            startDateTime: new Date('2024-02-01'),
            endDateTime: new Date('2024-12-31')
          },
          geoLocation: 'EU',
          consentData: {
            analytics: true,
            personalization: false
          },
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-02-01')
        }
      ].filter(consent => !purpose || consent.purpose.toLowerCase().includes(purpose.toLowerCase()));

      res.json({
        consents: mockConsents,
        pagination: {
          total: mockConsents.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: false,
        },
      });
    } catch (error) {
      logger.error('Error fetching consents:', error);
      res.status(500).json({ error: 'Failed to fetch consents' });
    }
  }

  // Get consent by ID
  async getConsentById(req, res) {
    try {
      const { id } = req.params;
      
      logger.info(`Mock serving consent for ID: ${id}`);
      
      const mockConsent = {
        id: id,
        partyId: 'party-001',
        privacyNoticeId: 'notice-001',
        purpose: 'Marketing Communications',
        status: 'granted',
        validityPeriod: {
          startDateTime: new Date('2024-01-01'),
          endDateTime: new Date('2024-12-31')
        },
        geoLocation: 'US',
        consentData: {
          emailMarketing: true,
          smsMarketing: false
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      };

      res.json(mockConsent);
    } catch (error) {
      logger.error('Error fetching consent:', error);
      res.status(500).json({ error: 'Failed to fetch consent' });
    }
  }

  // Update consent (revoke/modify)
  async updateConsent(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      logger.info(`Mock updating consent: ${id}`);
      
      const mockUpdatedConsent = {
        id: id,
        partyId: 'party-001',
        privacyNoticeId: 'notice-001',
        purpose: 'Marketing Communications',
        status: updateData.status || 'granted',
        validityPeriod: updateData.validityPeriod || {
          startDateTime: new Date('2024-01-01'),
          endDateTime: new Date('2024-12-31')
        },
        geoLocation: updateData.geoLocation || 'US',
        consentData: updateData.consentData || {
          emailMarketing: true,
          smsMarketing: false
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date()
      };

      // Create audit log
      await createAuditLog(
        'UPDATE_CONSENT',
        req.user?.uid || 'admin-demo',
        'consent-service',
        { consentId: id, changes: updateData }
      );

      // Emit event
      await this.emitConsentEvent('PrivacyConsentUpdated', mockUpdatedConsent);

      logger.info(`Mock consent updated: ${id}`);
      res.json(mockUpdatedConsent);
    } catch (error) {
      logger.error('Error updating consent:', error);
      res.status(500).json({ error: 'Failed to update consent' });
    }
  }

  // Delete consent
  async deleteConsent(req, res) {
    try {
      const { id } = req.params;

      logger.info(`Mock deleting consent: ${id}`);

      // Create audit log
      await createAuditLog(
        'DELETE_CONSENT',
        req.user?.uid || 'admin-demo',
        'consent-service',
        { consentId: id }
      );

      // Emit event
      await this.emitConsentEvent('PrivacyConsentDeleted', { id });

      logger.info(`Mock consent deleted: ${id}`);
      res.json({ message: 'Consent deleted successfully', id });
    } catch (error) {
      logger.error('Error deleting consent:', error);
      res.status(500).json({ error: 'Failed to delete consent' });
    }
  }

  // Get expired consents
  async getExpiredConsents(req, res) {
    try {
      logger.info('Mock serving expired consents data');
      
      const mockExpiredConsents = [
        {
          id: 'consent-exp-001',
          partyId: 'party-001',
          privacyNoticeId: 'notice-001',
          purpose: 'Marketing Communications',
          status: 'expired',
          validityPeriod: {
            startDateTime: new Date('2024-01-01'),
            endDateTime: new Date('2024-06-01')
          },
          geoLocation: 'US',
          consentData: {
            emailMarketing: false,
            smsMarketing: false
          },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-06-01')
        },
        {
          id: 'consent-exp-002',
          partyId: 'party-002',
          privacyNoticeId: 'notice-002',
          purpose: 'Data Analytics',
          status: 'expired',
          validityPeriod: {
            startDateTime: new Date('2024-02-01'),
            endDateTime: new Date('2024-07-01')
          },
          geoLocation: 'EU',
          consentData: {
            analytics: false,
            personalization: false
          },
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-07-01')
        }
      ];

      res.json(mockExpiredConsents);
    } catch (error) {
      logger.error('Error fetching expired consents:', error);
      res.status(500).json({ error: 'Failed to fetch expired consents' });
    }
  }

  // Get consent statistics
  async getConsentStats(req, res) {
    try {
      logger.info('Mock serving consent statistics');
      
      const mockStats = {
        total: 150,
        granted: 120,
        revoked: 20,
        expired: 10,
        byPurpose: {
          'Marketing Communications': 60,
          'Data Analytics': 40,
          'Personalization': 30,
          'Third Party Sharing': 20
        },
        byGeoLocation: {
          'US': 70,
          'EU': 50,
          'UK': 20,
          'Other': 10
        },
        recent: {
          lastDay: 5,
          lastWeek: 25,
          lastMonth: 80
        }
      };

      res.json(mockStats);
    } catch (error) {
      logger.error('Error fetching consent statistics:', error);
      res.status(500).json({ error: 'Failed to fetch consent statistics' });
    }
  }

  // Helper method to emit events
  async emitConsentEvent(eventType, consent) {
    try {
      const eventServiceUrl = process.env.EVENT_SERVICE_URL || 'http://localhost:3005';
      await axios.post(`${eventServiceUrl}/events`, {
        eventType,
        source: 'consent-service',
        data: consent,
      });
      logger.info(`Event emitted: ${eventType}`);
    } catch (error) {
      logger.error('Failed to emit event:', error);
    }
  }
}

module.exports = new ConsentController();
