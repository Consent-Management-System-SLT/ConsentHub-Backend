const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * ComplianceReport Model - TMF669 compliant compliance reporting
 * Generates comprehensive compliance reports for audit and regulatory purposes
 */
const ComplianceReportSchema = new Schema({
  // TMF669 Report Resource attributes
  id: {
    type: String,
    required: true,
    unique: true,
  },

  href: {
    type: String,
    required: true,
  },

  '@type': {
    type: String,
    default: 'ComplianceReport',
    immutable: true,
  },

  '@baseType': {
    type: String,
    default: 'Report',
  },

  // Report metadata
  reportMetadata: {
    title: {
      type: String,
      required: true,
    },
    description: String,
    reportType: {
      type: String,
      enum: ['audit', 'regulatory', 'internal', 'quarterly', 'annual'],
      required: true,
    },
    jurisdiction: {
      type: String,
      required: true,
    },
    regulatoryFramework: {
      type: String,
      enum: ['GDPR', 'CCPA', 'PDP', 'PIPEDA', 'LGPD'],
      required: true,
    },
    reportingPeriod: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },
    generatedBy: {
      userId: String,
      userRole: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
    status: {
      type: String,
      enum: ['draft', 'under_review', 'approved', 'submitted', 'archived'],
      default: 'draft',
    },
  },

  // Executive summary
  executiveSummary: {
    overallComplianceScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    keyFindings: [String],
    criticalIssues: [{
      issue: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
      },
      impact: String,
      recommendedAction: String,
      deadline: Date,
    }],
    improvementsFromLastPeriod: [String],
  },

  // Data subject rights compliance
  dataSubjectRights: {
    dsarRequestsProcessed: {
      total: {
        type: Number,
        default: 0,
      },
      byType: [{
        requestType: {
          type: String,
          enum: ['access', 'rectification', 'erasure', 'portability', 'restriction', 'objection'],
        },
        count: Number,
        avgProcessingTime: Number, // days
        withinDeadline: Number,
        overdue: Number,
      }],
    },
    
    responseTimeCompliance: {
      averageResponseTime: {
        type: Number, // days
        default: 0,
      },
      complianceRate: {
        type: Number, // percentage
        min: 0,
        max: 100,
        default: 100,
      },
      breaches: [{
        requestId: String,
        requestType: String,
        daysOverdue: Number,
        reason: String,
        remedialAction: String,
      }],
    },
  },

  // Consent management compliance
  consentCompliance: {
    totalConsentRecords: {
      type: Number,
      default: 0,
    },
    
    consentValidityCheck: {
      validConsents: {
        type: Number,
        default: 0,
      },
      expiredConsents: {
        type: Number,
        default: 0,
      },
      invalidConsents: [{
        consentId: String,
        reason: String,
        remedialAction: String,
      }],
    },
    
    consentWithdrawalCompliance: {
      withdrawalRequestsProcessed: {
        type: Number,
        default: 0,
      },
      processingTime: {
        average: Number, // hours
        withinCompliance: Number,
        breaches: Number,
      },
    },
    
    minorConsentCompliance: {
      totalMinorConsents: {
        type: Number,
        default: 0,
      },
      guardianVerified: {
        type: Number,
        default: 0,
      },
      pendingVerification: {
        type: Number,
        default: 0,
      },
      complianceRate: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
  },

  // Data processing compliance
  dataProcessingCompliance: {
    lawfulBasisCompliance: [{
      purpose: String,
      lawfulBasis: String,
      dataCategories: [String],
      complianceStatus: {
        type: String,
        enum: ['compliant', 'non_compliant', 'under_review'],
      },
      issues: [String],
    }],
    
    dataMinimizationCompliance: {
      score: {
        type: Number,
        min: 0,
        max: 100,
      },
      excessiveDataCollection: [{
        dataCategory: String,
        purpose: String,
        recommendation: String,
      }],
    },
    
    retentionCompliance: {
      compliantRecords: {
        type: Number,
        default: 0,
      },
      overdueForDeletion: {
        type: Number,
        default: 0,
      },
      deletionSchedule: [{
        dataCategory: String,
        retentionPeriod: String,
        nextDeletion: Date,
        recordCount: Number,
      }],
    },
  },

  // Security and technical compliance
  technicalCompliance: {
    dataProtectionByDesign: {
      score: {
        type: Number,
        min: 0,
        max: 100,
      },
      implementedMeasures: [String],
      gaps: [String],
      recommendations: [String],
    },
    
    encryptionCompliance: {
      dataAtRest: {
        encrypted: Boolean,
        algorithm: String,
        complianceLevel: String,
      },
      dataInTransit: {
        encrypted: Boolean,
        protocol: String,
        complianceLevel: String,
      },
    },
    
    accessControlCompliance: {
      roleBasedAccess: Boolean,
      principleOfLeastPrivilege: Boolean,
      regularAccessReviews: Boolean,
      unauthorizedAccessIncidents: Number,
    },
  },

  // Cross-border transfer compliance
  crossBorderTransfers: {
    transfers: [{
      destination: String,
      dataCategories: [String],
      lawfulMechanism: {
        type: String,
        enum: ['adequacy_decision', 'standard_contractual_clauses', 'binding_corporate_rules', 'derogation'],
      },
      complianceStatus: {
        type: String,
        enum: ['compliant', 'non_compliant', 'pending_assessment'],
      },
      lastReview: Date,
      nextReview: Date,
    }],
    
    adequacyDecisions: [{
      jurisdiction: String,
      status: String,
      validUntil: Date,
    }],
  },

  // Breach and incident compliance
  breachCompliance: {
    totalBreaches: {
      type: Number,
      default: 0,
    },
    
    breachesByCategory: [{
      category: String,
      count: Number,
      avgTimeToDetection: Number, // hours
      avgTimeToNotification: Number, // hours
    }],
    
    notificationCompliance: {
      supervisoryAuthorityNotifications: {
        total: Number,
        within72Hours: Number,
        late: Number,
      },
      dataSubjectNotifications: {
        total: Number,
        withoutUndelayDelay: Number,
        late: Number,
      },
    },
  },

  // Training and awareness compliance
  trainingCompliance: {
    staffTrainingRecords: {
      totalStaff: Number,
      trainedStaff: Number,
      complianceRate: {
        type: Number,
        min: 0,
        max: 100,
      },
      lastTrainingDate: Date,
      nextTrainingDue: Date,
    },
    
    awarenessPrograms: [{
      program: String,
      completionRate: Number,
      effectiveness: String,
    }],
  },

  // Third-party compliance
  thirdPartyCompliance: {
    processorAgreements: {
      total: Number,
      compliant: Number,
      underReview: Number,
      nonCompliant: Number,
    },
    
    vendorAssessments: [{
      vendor: String,
      lastAssessment: Date,
      complianceScore: Number,
      riskLevel: String,
      nextAssessment: Date,
    }],
  },

  // Recommendations and action plan
  actionPlan: {
    immediateActions: [{
      action: String,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
      },
      owner: String,
      dueDate: Date,
      status: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed', 'overdue'],
        default: 'not_started',
      },
    }],
    
    longTermImprovements: [{
      improvement: String,
      expectedBenefit: String,
      estimatedEffort: String,
      targetDate: Date,
    }],
  },

  // Appendices and supporting data
  appendices: {
    auditTrailSample: [Schema.Types.Mixed],
    consentRecordsSample: [Schema.Types.Mixed],
    dsarCaseSamples: [Schema.Types.Mixed],
    technicalDocumentation: [String],
  },

  // Report approval and sign-off
  approvalWorkflow: {
    reviewers: [{
      reviewer: String,
      role: String,
      reviewDate: Date,
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'requires_changes'],
      },
      comments: String,
    }],
    
    finalApproval: {
      approver: String,
      approvalDate: Date,
      digitalSignature: String,
    },
  },

}, {
  timestamps: true,
  versionKey: false,
});

// Indexes
ComplianceReportSchema.index({ 'reportMetadata.jurisdiction': 1, 'reportMetadata.reportType': 1 });
ComplianceReportSchema.index({ 'reportMetadata.reportingPeriod.startDate': 1, 'reportMetadata.reportingPeriod.endDate': 1 });
ComplianceReportSchema.index({ 'reportMetadata.status': 1 });
ComplianceReportSchema.index({ createdAt: -1 });

// Virtual for overall health assessment
ComplianceReportSchema.virtual('healthAssessment').get(function() {
  const score = this.executiveSummary.overallComplianceScore;
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 70) return 'adequate';
  if (score >= 60) return 'needs_improvement';
  return 'critical';
});

// Methods
ComplianceReportSchema.methods.addCriticalIssue = function(issue, severity, impact, action, deadline) {
  this.executiveSummary.criticalIssues.push({
    issue,
    severity,
    impact,
    recommendedAction: action,
    deadline,
  });
  return this.save();
};

ComplianceReportSchema.methods.updateActionStatus = function(actionIndex, status) {
  if (this.actionPlan.immediateActions[actionIndex]) {
    this.actionPlan.immediateActions[actionIndex].status = status;
    return this.save();
  }
  throw new Error('Action not found');
};

ComplianceReportSchema.methods.getOverdueActions = function() {
  const now = new Date();
  return this.actionPlan.immediateActions.filter(action => 
    action.dueDate < now && action.status !== 'completed'
  );
};

// Static methods
ComplianceReportSchema.statics.findByJurisdiction = function(jurisdiction, fromDate) {
  const query = { 'reportMetadata.jurisdiction': jurisdiction };
  if (fromDate) {
    query['reportMetadata.reportingPeriod.startDate'] = { $gte: fromDate };
  }
  return this.find(query).sort({ createdAt: -1 });
};

ComplianceReportSchema.statics.getLatestForJurisdiction = function(jurisdiction) {
  return this.findOne({ 'reportMetadata.jurisdiction': jurisdiction })
    .sort({ createdAt: -1 });
};

ComplianceReportSchema.statics.generateComplianceScoreTrend = function(jurisdiction, months = 12) {
  return this.aggregate([
    {
      $match: {
        'reportMetadata.jurisdiction': jurisdiction,
        createdAt: { $gte: new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000) },
      },
    },
    {
      $project: {
        month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        score: '$executiveSummary.overallComplianceScore',
      },
    },
    {
      $group: {
        _id: '$month',
        avgScore: { $avg: '$score' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id': 1 } },
  ]);
};

// Pre-save middleware
ComplianceReportSchema.pre('save', function(next) {
  // Generate ID if not provided
  if (!this.id) {
    const timestamp = Date.now();
    const jurisdiction = this.reportMetadata.jurisdiction.toLowerCase();
    this.id = `compliance-${jurisdiction}-${timestamp}`;
  }
  
  // Generate href
  if (!this.href) {
    this.href = `/tmf-api/privacyManagement/v1/reports/${this.id}`;
  }
  
  next();
});

const ComplianceReport = mongoose.model('ComplianceReport', ComplianceReportSchema);

module.exports = ComplianceReport;
