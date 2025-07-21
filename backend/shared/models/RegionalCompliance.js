const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Regional Compliance Settings Schema
const regionalComplianceSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  jurisdiction: {
    type: String,
    enum: ['GDPR', 'CCPA', 'PDP', 'LGPD', 'PIPEDA', 'PDPC'],
    required: true,
    unique: true,
  },
  
  // Legal Framework Details
  legalFramework: {
    fullName: {
      type: String,
      required: true,
    },
    effectiveDate: Date,
    lastUpdated: Date,
    applicableRegions: [String],
    regulatoryBody: String,
    officialUrl: String,
  },
  
  // Consent Requirements
  consentRequirements: {
    // Age of digital consent
    digitalConsentAge: {
      type: Number,
      required: true,
      default: 16, // GDPR default
    },
    
    // Consent collection requirements
    consentMechanisms: [{
      type: String,
      enum: ['explicit', 'opt_in', 'opt_out', 'implied', 'deemed'],
    }],
    
    // Consent renewal requirements
    consentRenewal: {
      required: {
        type: Boolean,
        default: false,
      },
      frequency: {
        type: String,
        enum: ['annual', 'biennial', 'never'],
        default: 'never',
      },
      warningPeriod: {
        type: Number, // days before expiry to warn
        default: 30,
      },
    },
    
    // Withdrawal requirements
    withdrawalRequirements: {
      mustBeEasyAsGiving: {
        type: Boolean,
        default: true,
      },
      maxProcessingTime: {
        type: Number, // hours
        default: 24,
      },
      requiresConfirmation: {
        type: Boolean,
        default: false,
      },
    },
  },
  
  // Data Subject Rights
  dataSubjectRights: {
    rightOfAccess: {
      enabled: {
        type: Boolean,
        default: true,
      },
      responseTime: {
        type: Number, // days
        default: 30,
      },
      extensionAllowed: {
        type: Boolean,
        default: true,
      },
      extensionPeriod: {
        type: Number, // additional days
        default: 60,
      },
      feePermitted: {
        type: Boolean,
        default: false,
      },
    },
    
    rightOfRectification: {
      enabled: {
        type: Boolean,
        default: true,
      },
      responseTime: {
        type: Number, // days
        default: 30,
      },
      verificationRequired: {
        type: Boolean,
        default: true,
      },
    },
    
    rightOfErasure: {
      enabled: {
        type: Boolean,
        default: true,
      },
      responseTime: {
        type: Number, // days
        default: 30,
      },
      exceptions: [{
        type: String,
        enum: [
          'freedom_of_expression',
          'legal_obligation',
          'public_interest',
          'archiving_purposes',
          'defense_of_legal_claims'
        ],
      }],
    },
    
    rightOfPortability: {
      enabled: {
        type: Boolean,
        default: true,
      },
      responseTime: {
        type: Number, // days
        default: 30,
      },
      formats: [{
        type: String,
        enum: ['json', 'xml', 'csv', 'pdf'],
      }],
    },
    
    rightToObject: {
      enabled: {
        type: Boolean,
        default: true,
      },
      responseTime: {
        type: Number, // days
        default: 30,
      },
      applicationScope: [{
        type: String,
        enum: ['marketing', 'profiling', 'automated_decision_making'],
      }],
    },
  },
  
  // Notification Requirements
  notificationRequirements: {
    breachNotification: {
      authorityNotificationTime: {
        type: Number, // hours
        default: 72,
      },
      subjectNotificationRequired: {
        type: Boolean,
        default: true,
      },
      subjectNotificationTime: {
        type: Number, // hours
        default: 72,
      },
      riskThreshold: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'high',
      },
    },
    
    consentChanges: {
      advanceNoticeRequired: {
        type: Boolean,
        default: true,
      },
      advanceNoticePeriod: {
        type: Number, // days
        default: 30,
      },
      reconsent: {
        type: String,
        enum: ['required', 'optional', 'not_required'],
        default: 'required',
      },
    },
  },
  
  // Processing Lawful Basis
  lawfulBasis: [{
    basis: {
      type: String,
      enum: [
        'consent',
        'contract',
        'legal_obligation',
        'vital_interests',
        'public_task',
        'legitimate_interests'
      ],
    },
    applicablePurposes: [String],
    additionalRequirements: [String],
  }],
  
  // Cross-border Transfer Rules
  crossBorderTransfer: {
    restricted: {
      type: Boolean,
      default: false,
    },
    adequacyDecisions: [String], // Countries with adequacy decisions
    safeguardMechanisms: [{
      type: String,
      enum: ['standard_contractual_clauses', 'binding_corporate_rules', 'certification'],
    }],
    prohibitedCountries: [String],
  },
  
  // Penalties and Fines
  penalties: {
    maximumFine: {
      percentage: Number, // % of annual revenue
      fixedAmount: Number, // in local currency
    },
    currency: String,
    escalationFactors: [String],
  },
  
  // Industry-specific Requirements
  industrySpecificRules: [{
    industry: {
      type: String,
      enum: ['healthcare', 'finance', 'telecommunications', 'education', 'government'],
    },
    additionalRequirements: [String],
    exemptions: [String],
  }],
  
  // Language and Accessibility Requirements
  languageRequirements: {
    requiredLanguages: [String],
    plainLanguageRequired: {
      type: Boolean,
      default: true,
    },
    readingLevel: String,
    accessibilityStandards: [String],
  },
  
  // Record Keeping Requirements
  recordKeeping: {
    consentRecords: {
      retentionPeriod: {
        type: Number, // years
        default: 7,
      },
      requiredFields: [String],
    },
    processingActivities: {
      required: {
        type: Boolean,
        default: true,
      },
      updateFrequency: {
        type: String,
        enum: ['monthly', 'quarterly', 'annual'],
        default: 'annual',
      },
    },
  },
  
  // Configuration Status
  status: {
    type: String,
    enum: ['active', 'draft', 'deprecated'],
    default: 'active',
  },
  
  version: {
    type: String,
    required: true,
  },
  
  // Metadata
  metadata: {
    createdBy: String,
    lastReviewedBy: String,
    lastReviewDate: Date,
    nextReviewDate: Date,
    approvedBy: String,
    approvalDate: Date,
  },
}, {
  timestamps: true,
});

// Indexes
regionalComplianceSchema.index({ jurisdiction: 1, status: 1 });
regionalComplianceSchema.index({ version: 1 });
regionalComplianceSchema.index({ 'legalFramework.applicableRegions': 1 });

// Static methods for compliance checking
regionalComplianceSchema.statics.getComplianceRules = function(jurisdiction) {
  return this.findOne({ jurisdiction, status: 'active' });
};

regionalComplianceSchema.statics.validateConsentAge = function(jurisdiction, age) {
  return this.findOne({ jurisdiction, status: 'active' })
    .then(rules => {
      if (!rules) return { valid: false, reason: 'Unknown jurisdiction' };
      
      const minAge = rules.consentRequirements.digitalConsentAge;
      return {
        valid: age >= minAge,
        minimumAge: minAge,
        requiresGuardian: age < minAge,
      };
    });
};

regionalComplianceSchema.statics.getDSARResponseTime = function(jurisdiction, requestType) {
  return this.findOne({ jurisdiction, status: 'active' })
    .then(rules => {
      if (!rules) return null;
      
      const rightMap = {
        'access': 'rightOfAccess',
        'rectification': 'rightOfRectification', 
        'erasure': 'rightOfErasure',
        'portability': 'rightOfPortability',
        'objection': 'rightToObject',
      };
      
      const rightKey = rightMap[requestType];
      if (!rightKey || !rules.dataSubjectRights[rightKey]) return null;
      
      return {
        responseTime: rules.dataSubjectRights[rightKey].responseTime,
        extensionAllowed: rules.dataSubjectRights[rightKey].extensionAllowed,
        extensionPeriod: rules.dataSubjectRights[rightKey].extensionPeriod,
      };
    });
};

// Instance methods
regionalComplianceSchema.methods.isConsentValid = function(consentData) {
  // Check if consent meets jurisdiction requirements
  const requirements = this.consentRequirements;
  
  // Check age requirements
  if (consentData.subjectAge && consentData.subjectAge < requirements.digitalConsentAge) {
    return {
      valid: false,
      reason: 'Subject below digital consent age',
      requiresGuardian: true,
    };
  }
  
  // Check consent mechanism
  if (requirements.consentMechanisms.length > 0 && 
      !requirements.consentMechanisms.includes(consentData.mechanism)) {
    return {
      valid: false,
      reason: 'Invalid consent mechanism for jurisdiction',
      allowedMechanisms: requirements.consentMechanisms,
    };
  }
  
  return { valid: true };
};

regionalComplianceSchema.methods.getRequiredNotificationTime = function(notificationType) {
  const notifications = this.notificationRequirements;
  
  switch (notificationType) {
    case 'breach_authority':
      return notifications.breachNotification.authorityNotificationTime;
    case 'breach_subject':
      return notifications.breachNotification.subjectNotificationTime;
    case 'consent_changes':
      return notifications.consentChanges.advanceNoticePeriod * 24; // convert days to hours
    default:
      return null;
  }
};

module.exports = mongoose.model('RegionalCompliance', regionalComplianceSchema);
