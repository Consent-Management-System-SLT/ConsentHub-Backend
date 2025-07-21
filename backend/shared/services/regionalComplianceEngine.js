const RegionalCompliance = require('../models/RegionalCompliance');
const { logger } = require('../utils');

class RegionalComplianceEngine {
  /**
   * Initialize default compliance rules for major jurisdictions
   */
  async initializeComplianceRules() {
    try {
      // GDPR Rules
      const gdprRules = new RegionalCompliance({
        id: 'gdpr-2024',
        jurisdiction: 'GDPR',
        legalFramework: {
          fullName: 'General Data Protection Regulation',
          effectiveDate: new Date('2018-05-25'),
          lastUpdated: new Date('2024-01-01'),
          applicableRegions: ['EU', 'EEA', 'UK'],
          regulatoryBody: 'European Data Protection Board',
          officialUrl: 'https://gdpr-info.eu/',
        },
        consentRequirements: {
          digitalConsentAge: 16,
          consentMechanisms: ['explicit'],
          consentRenewal: {
            required: false,
            frequency: 'never',
            warningPeriod: 30,
          },
          withdrawalRequirements: {
            mustBeEasyAsGiving: true,
            maxProcessingTime: 24,
            requiresConfirmation: false,
          },
        },
        dataSubjectRights: {
          rightOfAccess: {
            enabled: true,
            responseTime: 30,
            extensionAllowed: true,
            extensionPeriod: 60,
            feePermitted: false,
          },
          rightOfRectification: {
            enabled: true,
            responseTime: 30,
            verificationRequired: true,
          },
          rightOfErasure: {
            enabled: true,
            responseTime: 30,
            exceptions: ['freedom_of_expression', 'legal_obligation', 'public_interest'],
          },
          rightOfPortability: {
            enabled: true,
            responseTime: 30,
            formats: ['json', 'xml', 'csv'],
          },
          rightToObject: {
            enabled: true,
            responseTime: 30,
            applicationScope: ['marketing', 'profiling', 'automated_decision_making'],
          },
        },
        notificationRequirements: {
          breachNotification: {
            authorityNotificationTime: 72,
            subjectNotificationRequired: true,
            subjectNotificationTime: 72,
            riskThreshold: 'high',
          },
          consentChanges: {
            advanceNoticeRequired: true,
            advanceNoticePeriod: 30,
            reconsent: 'required',
          },
        },
        penalties: {
          maximumFine: {
            percentage: 4, // 4% of annual revenue
            fixedAmount: 20000000, // €20 million
          },
          currency: 'EUR',
        },
        version: '1.0',
        status: 'active',
      });

      // Sri Lanka PDP Rules
      const pdpRules = new RegionalCompliance({
        id: 'pdp-lk-2024',
        jurisdiction: 'PDP',
        legalFramework: {
          fullName: 'Personal Data Protection Act No. 9 of 2022',
          effectiveDate: new Date('2022-10-19'),
          lastUpdated: new Date('2024-01-01'),
          applicableRegions: ['LK'],
          regulatoryBody: 'Personal Data Protection Commission',
          officialUrl: 'https://www.pdpc.gov.lk/',
        },
        consentRequirements: {
          digitalConsentAge: 18, // Sri Lanka
          consentMechanisms: ['explicit', 'opt_in'],
          consentRenewal: {
            required: false,
            frequency: 'never',
            warningPeriod: 30,
          },
          withdrawalRequirements: {
            mustBeEasyAsGiving: true,
            maxProcessingTime: 48, // 2 days
            requiresConfirmation: true,
          },
        },
        dataSubjectRights: {
          rightOfAccess: {
            enabled: true,
            responseTime: 30,
            extensionAllowed: true,
            extensionPeriod: 30,
            feePermitted: true,
          },
          rightOfRectification: {
            enabled: true,
            responseTime: 30,
            verificationRequired: true,
          },
          rightOfErasure: {
            enabled: true,
            responseTime: 30,
            exceptions: ['legal_obligation', 'defense_of_legal_claims'],
          },
          rightOfPortability: {
            enabled: true,
            responseTime: 30,
            formats: ['json', 'csv', 'pdf'],
          },
          rightToObject: {
            enabled: true,
            responseTime: 30,
            applicationScope: ['marketing', 'profiling'],
          },
        },
        notificationRequirements: {
          breachNotification: {
            authorityNotificationTime: 72,
            subjectNotificationRequired: true,
            subjectNotificationTime: 72,
            riskThreshold: 'medium',
          },
          consentChanges: {
            advanceNoticeRequired: true,
            advanceNoticePeriod: 14,
            reconsent: 'required',
          },
        },
        penalties: {
          maximumFine: {
            percentage: 2, // 2% of annual turnover
            fixedAmount: 10000000, // LKR 10 million
          },
          currency: 'LKR',
        },
        version: '1.0',
        status: 'active',
      });

      // CCPA Rules
      const ccpaRules = new RegionalCompliance({
        id: 'ccpa-2024',
        jurisdiction: 'CCPA',
        legalFramework: {
          fullName: 'California Consumer Privacy Act',
          effectiveDate: new Date('2020-01-01'),
          lastUpdated: new Date('2024-01-01'),
          applicableRegions: ['CA', 'US-CA'],
          regulatoryBody: 'California Privacy Protection Agency',
          officialUrl: 'https://cppa.ca.gov/',
        },
        consentRequirements: {
          digitalConsentAge: 13,
          consentMechanisms: ['opt_in', 'opt_out'],
          consentRenewal: {
            required: true,
            frequency: 'annual',
            warningPeriod: 30,
          },
          withdrawalRequirements: {
            mustBeEasyAsGiving: true,
            maxProcessingTime: 24,
            requiresConfirmation: false,
          },
        },
        dataSubjectRights: {
          rightOfAccess: {
            enabled: true,
            responseTime: 45,
            extensionAllowed: true,
            extensionPeriod: 45,
            feePermitted: false,
          },
          rightOfRectification: {
            enabled: true,
            responseTime: 45,
            verificationRequired: true,
          },
          rightOfErasure: {
            enabled: true,
            responseTime: 45,
            exceptions: ['legal_obligation', 'freedom_of_expression'],
          },
          rightOfPortability: {
            enabled: true,
            responseTime: 45,
            formats: ['json', 'csv'],
          },
          rightToObject: {
            enabled: true,
            responseTime: 45,
            applicationScope: ['marketing', 'automated_decision_making'],
          },
        },
        notificationRequirements: {
          breachNotification: {
            authorityNotificationTime: 72,
            subjectNotificationRequired: false,
            subjectNotificationTime: 0,
            riskThreshold: 'high',
          },
          consentChanges: {
            advanceNoticeRequired: true,
            advanceNoticePeriod: 30,
            reconsent: 'optional',
          },
        },
        penalties: {
          maximumFine: {
            percentage: 0, // No percentage-based fines
            fixedAmount: 7500, // $7,500 per violation
          },
          currency: 'USD',
        },
        version: '1.0',
        status: 'active',
      });

      // Save rules if they don't exist
      const existingGDPR = await RegionalCompliance.findOne({ jurisdiction: 'GDPR' });
      if (!existingGDPR) await gdprRules.save();

      const existingPDP = await RegionalCompliance.findOne({ jurisdiction: 'PDP' });
      if (!existingPDP) await pdpRules.save();

      const existingCCPA = await RegionalCompliance.findOne({ jurisdiction: 'CCPA' });
      if (!existingCCPA) await ccpaRules.save();

      logger.info('Regional compliance rules initialized successfully');

    } catch (error) {
      logger.error('Error initializing compliance rules:', error);
      throw error;
    }
  }

  /**
   * Determine applicable jurisdiction based on party location and business context
   */
  async determineJurisdiction(partyData, businessContext = {}) {
    try {
      let jurisdiction = 'GDPR'; // Default fallback

      // Determine based on party location
      if (partyData.geoLocation) {
        const location = partyData.geoLocation.toUpperCase();
        
        if (['LK', 'SRI LANKA'].includes(location)) {
          jurisdiction = 'PDP';
        } else if (location.includes('CA') || location.includes('CALIFORNIA')) {
          jurisdiction = 'CCPA';
        } else if (['EU', 'EEA', 'UK'].some(region => location.includes(region))) {
          jurisdiction = 'GDPR';
        }
      }

      // Override based on business context
      if (businessContext.jurisdiction) {
        jurisdiction = businessContext.jurisdiction;
      }

      // Validate jurisdiction exists in our system
      const rules = await RegionalCompliance.findOne({ jurisdiction, status: 'active' });
      if (!rules) {
        logger.warn(`No compliance rules found for jurisdiction: ${jurisdiction}, falling back to GDPR`);
        jurisdiction = 'GDPR';
      }

      return {
        jurisdiction,
        confidence: partyData.geoLocation ? 'high' : 'low',
        source: businessContext.jurisdiction ? 'business_override' : 'geo_location',
      };

    } catch (error) {
      logger.error('Error determining jurisdiction:', error);
      return { jurisdiction: 'GDPR', confidence: 'low', source: 'fallback' };
    }
  }

  /**
   * Validate consent according to jurisdiction rules
   */
  async validateConsent(consentData, jurisdiction) {
    try {
      const rules = await RegionalCompliance.getComplianceRules(jurisdiction);
      if (!rules) {
        throw new Error(`No compliance rules found for jurisdiction: ${jurisdiction}`);
      }

      const validation = rules.isConsentValid(consentData);
      
      // Additional validations
      const validations = {
        ageCompliance: validation,
        mechanism: true,
        withdrawal: true,
        documentation: true,
      };

      // Check consent mechanism
      if (rules.consentRequirements.consentMechanisms.length > 0) {
        validations.mechanism = rules.consentRequirements.consentMechanisms.includes(
          consentData.mechanism || 'explicit'
        );
      }

      // Check withdrawal capability
      if (consentData.withdrawalMethod) {
        const withdrawalReqs = rules.consentRequirements.withdrawalRequirements;
        validations.withdrawal = withdrawalReqs.mustBeEasyAsGiving ? 
          consentData.withdrawalMethod === 'easy' : true;
      }

      return {
        isValid: Object.values(validations).every(v => v === true || (v && v.valid !== false)),
        details: validations,
        jurisdiction,
        complianceRules: rules.id,
      };

    } catch (error) {
      logger.error('Error validating consent:', error);
      throw error;
    }
  }

  /**
   * Get DSAR response timeframes for jurisdiction
   */
  async getDSARTimeframes(jurisdiction, requestType) {
    try {
      const timeframes = await RegionalCompliance.getDSARResponseTime(jurisdiction, requestType);
      if (!timeframes) {
        throw new Error(`No DSAR timeframes found for ${jurisdiction}/${requestType}`);
      }

      const now = new Date();
      const responseDeadline = new Date(now.getTime() + timeframes.responseTime * 24 * 60 * 60 * 1000);
      const extensionDeadline = timeframes.extensionAllowed ? 
        new Date(responseDeadline.getTime() + timeframes.extensionPeriod * 24 * 60 * 60 * 1000) : null;

      return {
        responseTime: timeframes.responseTime,
        responseDeadline,
        extensionAllowed: timeframes.extensionAllowed,
        extensionPeriod: timeframes.extensionPeriod,
        extensionDeadline,
        jurisdiction,
      };

    } catch (error) {
      logger.error('Error getting DSAR timeframes:', error);
      throw error;
    }
  }

  /**
   * Check if consent needs renewal based on jurisdiction rules
   */
  async checkConsentRenewal(consentData, jurisdiction) {
    try {
      const rules = await RegionalCompliance.getComplianceRules(jurisdiction);
      if (!rules) {
        return { renewalRequired: false, reason: 'No jurisdiction rules found' };
      }

      const renewalReqs = rules.consentRequirements.consentRenewal;
      if (!renewalReqs.required) {
        return { renewalRequired: false, reason: 'Jurisdiction does not require renewal' };
      }

      const consentDate = new Date(consentData.createdAt || consentData.timestampGranted);
      const now = new Date();

      let renewalPeriod;
      switch (renewalReqs.frequency) {
        case 'annual':
          renewalPeriod = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
          break;
        case 'biennial':
          renewalPeriod = 2 * 365 * 24 * 60 * 60 * 1000; // 2 years
          break;
        default:
          return { renewalRequired: false, reason: 'No renewal frequency specified' };
      }

      const nextRenewalDate = new Date(consentDate.getTime() + renewalPeriod);
      const warningDate = new Date(nextRenewalDate.getTime() - renewalReqs.warningPeriod * 24 * 60 * 60 * 1000);

      return {
        renewalRequired: now >= nextRenewalDate,
        warningPeriod: now >= warningDate && now < nextRenewalDate,
        nextRenewalDate,
        warningDate,
        daysUntilRenewal: Math.ceil((nextRenewalDate - now) / (24 * 60 * 60 * 1000)),
        jurisdiction,
      };

    } catch (error) {
      logger.error('Error checking consent renewal:', error);
      throw error;
    }
  }

  /**
   * Get breach notification requirements
   */
  async getBreachNotificationRequirements(jurisdiction, breachSeverity = 'high') {
    try {
      const rules = await RegionalCompliance.getComplianceRules(jurisdiction);
      if (!rules) {
        throw new Error(`No compliance rules found for jurisdiction: ${jurisdiction}`);
      }

      const breachReqs = rules.notificationRequirements.breachNotification;
      const requiresNotification = this.shouldNotifyForBreach(breachSeverity, breachReqs.riskThreshold);

      return {
        requiresNotification,
        authorityNotificationTime: breachReqs.authorityNotificationTime, // hours
        subjectNotificationRequired: breachReqs.subjectNotificationRequired,
        subjectNotificationTime: breachReqs.subjectNotificationTime, // hours
        riskThreshold: breachReqs.riskThreshold,
        jurisdiction,
      };

    } catch (error) {
      logger.error('Error getting breach notification requirements:', error);
      throw error;
    }
  }

  /**
   * Helper method to determine if breach requires notification
   */
  shouldNotifyForBreach(breachSeverity, threshold) {
    const severityLevels = { 'low': 1, 'medium': 2, 'high': 3 };
    const thresholdLevel = severityLevels[threshold] || 3;
    const breachLevel = severityLevels[breachSeverity] || 1;
    
    return breachLevel >= thresholdLevel;
  }

  /**
   * Get all active jurisdictions
   */
  async getActiveJurisdictions() {
    try {
      const jurisdictions = await RegionalCompliance.find({ status: 'active' })
        .select('jurisdiction legalFramework.fullName legalFramework.applicableRegions version')
        .lean();

      return jurisdictions.map(j => ({
        code: j.jurisdiction,
        name: j.legalFramework.fullName,
        regions: j.legalFramework.applicableRegions,
        version: j.version,
      }));

    } catch (error) {
      logger.error('Error getting active jurisdictions:', error);
      throw error;
    }
  }

  /**
   * Update compliance rules (admin function)
   */
  async updateComplianceRules(jurisdiction, updates, userId) {
    try {
      const rules = await RegionalCompliance.findOne({ jurisdiction, status: 'active' });
      if (!rules) {
        throw new Error(`No active compliance rules found for jurisdiction: ${jurisdiction}`);
      }

      // Create new version
      const newVersion = this.incrementVersion(rules.version);
      
      // Update fields
      Object.assign(rules, updates);
      rules.version = newVersion;
      rules.metadata.lastReviewedBy = userId;
      rules.metadata.lastReviewDate = new Date();

      await rules.save();

      logger.info(`Compliance rules updated for ${jurisdiction}`, {
        version: newVersion,
        updatedBy: userId,
      });

      return rules;

    } catch (error) {
      logger.error('Error updating compliance rules:', error);
      throw error;
    }
  }

  /**
   * Helper to increment version number
   */
  incrementVersion(currentVersion) {
    const parts = currentVersion.split('.');
    parts[parts.length - 1] = String(parseInt(parts[parts.length - 1]) + 1);
    return parts.join('.');
  }
}

module.exports = new RegionalComplianceEngine();
