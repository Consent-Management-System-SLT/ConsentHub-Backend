const PrivacyConsent = require('../models/PrivacyConsent');
const { generateUUID, logger, createAuditLog } = require('../../shared/utils');
const axios = require('axios');

class ConsentController {
  // Create new privacy consent
  async createConsent(req, res) {
    try {
      const consentData = {
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
      };

      const consent = new PrivacyConsent(consentData);
      await consent.save();

      // Create audit log
      await createAuditLog(
        'CREATE_CONSENT',
        req.user.uid,
        'consent-service',
        { consentId: consent.id, partyId: consent.partyId }
      );

      // Emit event
      await this.emitConsentEvent('PrivacyConsentCreated', consent);

      logger.info(`Privacy consent created: ${consent.id}`);
      res.status(201).json(consent);
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

      const filter = { partyId };
      if (status) filter.status = status;
      if (purpose) filter.purpose = purpose;

      const consents = await PrivacyConsent.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset));

      const total = await PrivacyConsent.countDocuments(filter);

      res.json({
        consents,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total,
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
      const consent = await PrivacyConsent.findOne({ id });

      if (!consent) {
        return res.status(404).json({ error: 'Consent not found' });
      }

      res.json(consent);
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

      const consent = await PrivacyConsent.findOne({ id });
      if (!consent) {
        return res.status(404).json({ error: 'Consent not found' });
      }

      // Check if user has permission to update this consent
      if (req.user.role === 'customer' && consent.partyId !== req.user.uid) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const previousStatus = consent.status;
      Object.assign(consent, updateData);
      consent.metadata.timestamp = new Date();
      await consent.save();

      // Create audit log
      await createAuditLog(
        'UPDATE_CONSENT',
        req.user.uid,
        'consent-service',
        { 
          consentId: consent.id, 
          partyId: consent.partyId,
          previousStatus,
          newStatus: consent.status
        }
      );

      // Emit event if status changed
      if (previousStatus !== consent.status) {
        await this.emitConsentEvent('PrivacyConsentStatusChanged', consent);
      }

      logger.info(`Privacy consent updated: ${consent.id}`);
      res.json(consent);
    } catch (error) {
      logger.error('Error updating consent:', error);
      res.status(500).json({ error: 'Failed to update consent' });
    }
  }

  // Revoke consent
  async revokeConsent(req, res) {
    try {
      const { id } = req.params;
      const consent = await PrivacyConsent.findOne({ id });

      if (!consent) {
        return res.status(404).json({ error: 'Consent not found' });
      }

      // Check if user has permission to revoke this consent
      if (req.user.role === 'customer' && consent.partyId !== req.user.uid) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      consent.status = 'revoked';
      consent.metadata.timestamp = new Date();
      await consent.save();

      // Create audit log
      await createAuditLog(
        'REVOKE_CONSENT',
        req.user.uid,
        'consent-service',
        { consentId: consent.id, partyId: consent.partyId }
      );

      // Emit event
      await this.emitConsentEvent('PrivacyConsentRevoked', consent);

      logger.info(`Privacy consent revoked: ${consent.id}`);
      res.json(consent);
    } catch (error) {
      logger.error('Error revoking consent:', error);
      res.status(500).json({ error: 'Failed to revoke consent' });
    }
  }

  // Get expired consents
  async getExpiredConsents(req, res) {
    try {
      const now = new Date();
      const expiredConsents = await PrivacyConsent.find({
        'validityPeriod.endDateTime': { $lt: now },
        status: 'granted'
      });

      res.json(expiredConsents);
    } catch (error) {
      logger.error('Error fetching expired consents:', error);
      res.status(500).json({ error: 'Failed to fetch expired consents' });
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
    } catch (error) {
      logger.error('Failed to emit event:', error);
    }
  }
}

module.exports = new ConsentController();
