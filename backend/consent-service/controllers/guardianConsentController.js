const PrivacyConsent = require('../../consent-service/models/PrivacyConsent');
const Party = require('../models/Party');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../../shared/utils');

class GuardianConsentController {
  /**
   * Grant consent on behalf of a minor
   */
  async grantConsentForMinor(req, res) {
    try {
      const { minorPartyId, guardianPartyId, purpose, channel, privacyNoticeId } = req.body;

      // Verify guardian relationship and authority
      const guardian = await Party.findOne({ id: guardianPartyId });
      if (!guardian) {
        return res.status(404).json({
          error: 'Guardian not found',
          code: 'GUARDIAN_NOT_FOUND',
        });
      }

      // Check if guardian has authority for this minor
      const guardianRelation = guardian.relatedParty.find(
        rel => rel.id === minorPartyId && 
               rel.role === 'minor' && 
               rel.consentAuthority.canGrantConsent
      );

      if (!guardianRelation) {
        return res.status(403).json({
          error: 'Guardian does not have consent authority for this minor',
          code: 'INSUFFICIENT_AUTHORITY',
        });
      }

      // Verify minor exists and requires guardian consent
      const minor = await Party.findOne({ id: minorPartyId });
      if (!minor) {
        return res.status(404).json({
          error: 'Minor party not found',
          code: 'MINOR_NOT_FOUND',
        });
      }

      if (!minor.ageVerification.requiresGuardianConsent) {
        return res.status(400).json({
          error: 'This party does not require guardian consent',
          code: 'GUARDIAN_CONSENT_NOT_REQUIRED',
        });
      }

      // Check if guardian has authority for this specific purpose
      if (guardianRelation.consentAuthority.purposes.length > 0 && 
          !guardianRelation.consentAuthority.purposes.includes(purpose)) {
        return res.status(403).json({
          error: `Guardian does not have authority for purpose: ${purpose}`,
          code: 'INSUFFICIENT_PURPOSE_AUTHORITY',
        });
      }

      // Create consent with guardian metadata
      const consent = new PrivacyConsent({
        id: uuidv4(),
        partyId: minorPartyId,
        purpose,
        status: 'granted',
        geoLocation: req.body.geoLocation || 'LK',
        privacyNoticeId,
        validityPeriod: {
          startDateTime: new Date(),
          endDateTime: req.body.endDateTime || null,
        },
        consentData: {
          ...req.body.consentData,
          grantedByGuardian: true,
          guardianPartyId,
          guardianRelationship: guardianRelation.relationshipType,
          channel: channel || 'guardian-portal',
        },
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date(),
          grantedByGuardian: true,
          guardianVerified: true,
          guardianDocument: guardianRelation.legalDocuments.find(doc => doc.verificationStatus === 'verified'),
        },
      });

      await consent.save();

      // Log the guardian consent action
      logger.info('Guardian consent granted', {
        consentId: consent.id,
        minorPartyId,
        guardianPartyId,
        purpose,
        channel,
      });

      res.status(201).json({
        message: 'Guardian consent granted successfully',
        consent: {
          id: consent.id,
          partyId: consent.partyId,
          purpose: consent.purpose,
          status: consent.status,
          grantedByGuardian: true,
          guardianPartyId,
        },
      });

    } catch (error) {
      logger.error('Error granting guardian consent:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  /**
   * Revoke consent on behalf of a minor
   */
  async revokeConsentForMinor(req, res) {
    try {
      const { consentId } = req.params;
      const { guardianPartyId, reason } = req.body;

      // Find the consent
      const consent = await PrivacyConsent.findOne({ id: consentId });
      if (!consent) {
        return res.status(404).json({
          error: 'Consent not found',
          code: 'CONSENT_NOT_FOUND',
        });
      }

      // Verify this consent was granted by guardian or can be revoked by guardian
      const guardian = await Party.findOne({ id: guardianPartyId });
      if (!guardian) {
        return res.status(404).json({
          error: 'Guardian not found',
          code: 'GUARDIAN_NOT_FOUND',
        });
      }

      const guardianRelation = guardian.relatedParty.find(
        rel => rel.id === consent.partyId && 
               rel.role === 'minor' && 
               rel.consentAuthority.canRevokeConsent
      );

      if (!guardianRelation) {
        return res.status(403).json({
          error: 'Guardian does not have revoke authority for this minor',
          code: 'INSUFFICIENT_REVOKE_AUTHORITY',
        });
      }

      // Update consent status
      consent.status = 'revoked';
      consent.consentData = {
        ...consent.consentData,
        revokedByGuardian: true,
        revocationReason: reason,
        revokedAt: new Date(),
      };
      consent.metadata = {
        ...consent.metadata,
        revokedByGuardian: true,
        revocationTimestamp: new Date(),
      };

      await consent.save();

      logger.info('Guardian consent revoked', {
        consentId,
        minorPartyId: consent.partyId,
        guardianPartyId,
        reason,
      });

      res.json({
        message: 'Guardian consent revoked successfully',
        consent: {
          id: consent.id,
          partyId: consent.partyId,
          purpose: consent.purpose,
          status: consent.status,
          revokedByGuardian: true,
          guardianPartyId,
        },
      });

    } catch (error) {
      logger.error('Error revoking guardian consent:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  /**
   * Get consents managed by guardian
   */
  async getGuardianManagedConsents(req, res) {
    try {
      const { guardianPartyId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      // Find all minors under this guardian's authority
      const guardian = await Party.findOne({ id: guardianPartyId });
      if (!guardian) {
        return res.status(404).json({
          error: 'Guardian not found',
          code: 'GUARDIAN_NOT_FOUND',
        });
      }

      const minorIds = guardian.relatedParty
        .filter(rel => rel.role === 'minor')
        .map(rel => rel.id);

      if (minorIds.length === 0) {
        return res.json({
          consents: [],
          totalCount: 0,
          message: 'No minors under guardian authority',
        });
      }

      // Find all consents for these minors
      const consents = await PrivacyConsent.find({
        partyId: { $in: minorIds }
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

      const totalCount = await PrivacyConsent.countDocuments({
        partyId: { $in: minorIds }
      });

      res.json({
        consents,
        totalCount,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        hasMore: totalCount > page * limit,
      });

    } catch (error) {
      logger.error('Error fetching guardian managed consents:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  /**
   * Validate guardian authority
   */
  async validateGuardianAuthority(req, res) {
    try {
      const { guardianPartyId, minorPartyId, purpose } = req.query;

      const guardian = await Party.findOne({ id: guardianPartyId });
      if (!guardian) {
        return res.status(404).json({
          error: 'Guardian not found',
          code: 'GUARDIAN_NOT_FOUND',
        });
      }

      const guardianRelation = guardian.relatedParty.find(
        rel => rel.id === minorPartyId && rel.role === 'minor'
      );

      if (!guardianRelation) {
        return res.json({
          hasAuthority: false,
          reason: 'No guardian relationship found',
        });
      }

      const hasGeneralAuthority = guardianRelation.consentAuthority.canGrantConsent;
      const hasPurposeAuthority = guardianRelation.consentAuthority.purposes.length === 0 || 
                                 guardianRelation.consentAuthority.purposes.includes(purpose);
      
      const isNotExpired = !guardianRelation.consentAuthority.expiresAt || 
                          guardianRelation.consentAuthority.expiresAt > new Date();

      res.json({
        hasAuthority: hasGeneralAuthority && hasPurposeAuthority && isNotExpired,
        details: {
          canGrantConsent: guardianRelation.consentAuthority.canGrantConsent,
          canRevokeConsent: guardianRelation.consentAuthority.canRevokeConsent,
          hasPurposeAuthority,
          isNotExpired,
          authorizedPurposes: guardianRelation.consentAuthority.purposes,
          expiresAt: guardianRelation.consentAuthority.expiresAt,
        },
      });

    } catch (error) {
      logger.error('Error validating guardian authority:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
}

module.exports = new GuardianConsentController();
