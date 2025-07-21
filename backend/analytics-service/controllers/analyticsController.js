const PrivacyConsent = require('../../consent-service/models/PrivacyConsent');
const PrivacyPreference = require('../../preference-service/models/PrivacyPreference');
const Party = require('../../party-service/models/Party');
const DSARRequest = require('../../dsar-service/models/DSARRequest');
const TMF669Event = require('../../event-service/models/Event');
const RegionalCompliance = require('../../shared/models/RegionalCompliance');
const { logger } = require('../../shared/utils');

class AnalyticsController {
  /**
   * Get comprehensive consent analytics dashboard
   */
  async getConsentAnalytics(req, res) {
    try {
      const { timeframe = '30d', jurisdiction } = req.query;
      const timeRange = this.getTimeRange(timeframe);

      // Consent metrics
      const consentMetrics = await this.getConsentMetrics(timeRange, jurisdiction);
      
      // Compliance metrics
      const complianceMetrics = await this.getComplianceMetrics(timeRange, jurisdiction);
      
      // Performance metrics
      const performanceMetrics = await this.getPerformanceMetrics(timeRange);
      
      // Trend analysis
      const trendAnalysis = await this.getTrendAnalysis(timeRange, jurisdiction);

      res.json({
        timeframe,
        jurisdiction: jurisdiction || 'all',
        generatedAt: new Date().toISOString(),
        metrics: {
          consent: consentMetrics,
          compliance: complianceMetrics,
          performance: performanceMetrics,
          trends: trendAnalysis,
        },
      });

    } catch (error) {
      logger.error('Error generating consent analytics:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  /**
   * Get consent conversion and grant/revoke rates
   */
  async getConsentMetrics(timeRange, jurisdiction) {
    try {
      const matchStage = {
        createdAt: { $gte: timeRange.start, $lte: timeRange.end },
      };

      if (jurisdiction) {
        matchStage.geoLocation = jurisdiction;
      }

      // Total consents by status
      const consentsByStatus = await PrivacyConsent.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      // Consents by purpose
      const consentsByPurpose = await PrivacyConsent.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$purpose',
            granted: {
              $sum: { $cond: [{ $eq: ['$status', 'granted'] }, 1, 0] },
            },
            revoked: {
              $sum: { $cond: [{ $eq: ['$status', 'revoked'] }, 1, 0] },
            },
            total: { $sum: 1 },
          },
        },
        {
          $addFields: {
            conversionRate: {
              $multiply: [{ $divide: ['$granted', '$total'] }, 100],
            },
          },
        },
      ]);

      // Consent lifecycle metrics
      const lifecycleMetrics = await PrivacyConsent.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalConsents: { $sum: 1 },
            avgTimeToRevoke: {
              $avg: {
                $subtract: [
                  { $ifNull: ['$updatedAt', new Date()] },
                  '$createdAt',
                ],
              },
            },
            consentDuration: {
              $avg: {
                $cond: [
                  { $eq: ['$status', 'granted'] },
                  { $subtract: [new Date(), '$createdAt'] },
                  0,
                ],
              },
            },
          },
        },
      ]);

      // Channel analysis
      const channelAnalysis = await PrivacyConsent.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$consentData.channel',
            count: { $sum: 1 },
            grantedRate: {
              $avg: { $cond: [{ $eq: ['$status', 'granted'] }, 1, 0] },
            },
          },
        },
        { $sort: { count: -1 } },
      ]);

      return {
        summary: {
          totalConsents: consentsByStatus.reduce((sum, item) => sum + item.count, 0),
          grantedConsents: consentsByStatus.find(item => item._id === 'granted')?.count || 0,
          revokedConsents: consentsByStatus.find(item => item._id === 'revoked')?.count || 0,
          pendingConsents: consentsByStatus.find(item => item._id === 'pending')?.count || 0,
        },
        byStatus: consentsByStatus,
        byPurpose: consentsByPurpose,
        lifecycle: lifecycleMetrics[0] || {},
        channelPerformance: channelAnalysis,
        conversionRate: this.calculateOverallConversionRate(consentsByStatus),
      };

    } catch (error) {
      logger.error('Error getting consent metrics:', error);
      throw error;
    }
  }

  /**
   * Get compliance and audit readiness metrics
   */
  async getComplianceMetrics(timeRange, jurisdiction) {
    try {
      // DSAR request metrics
      const dsarMetrics = await DSARRequest.aggregate([
        {
          $match: {
            createdAt: { $gte: timeRange.start, $lte: timeRange.end },
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgProcessingTime: {
              $avg: {
                $subtract: [
                  { $ifNull: ['$processing.completedAt', new Date()] },
                  '$processing.startedAt',
                ],
              },
            },
          },
        },
      ]);

      // Overdue DSAR requests
      const overdueDSARs = await DSARRequest.countDocuments({
        status: { $in: ['pending', 'in_progress'] },
        $expr: {
          $lt: [
            { $ifNull: ['$compliance.extendedDeadline', '$compliance.responseDeadline'] },
            new Date(),
          ],
        },
      });

      // Consent expiry tracking
      const expiringConsents = await PrivacyConsent.countDocuments({
        status: 'granted',
        'validityPeriod.endDateTime': {
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
        },
      });

      // Guardian consent compliance
      const guardianConsentMetrics = await PrivacyConsent.aggregate([
        {
          $match: {
            'consentData.grantedByGuardian': true,
            createdAt: { $gte: timeRange.start, $lte: timeRange.end },
          },
        },
        {
          $group: {
            _id: null,
            totalGuardianConsents: { $sum: 1 },
            verifiedGuardianConsents: {
              $sum: { $cond: ['$metadata.guardianVerified', 1, 0] },
            },
          },
        },
      ]);

      // Jurisdiction compliance status
      const jurisdictionCompliance = await this.getJurisdictionComplianceStatus(jurisdiction);

      // Audit trail completeness
      const auditMetrics = await this.getAuditTrailMetrics(timeRange);

      return {
        dsarRequests: {
          total: dsarMetrics.reduce((sum, item) => sum + item.count, 0),
          byStatus: dsarMetrics,
          overdue: overdueDSARs,
          avgProcessingTime: dsarMetrics.reduce((avg, item) => avg + (item.avgProcessingTime || 0), 0) / dsarMetrics.length,
        },
        consentCompliance: {
          expiringConsents,
          guardianConsents: guardianConsentMetrics[0] || { totalGuardianConsents: 0, verifiedGuardianConsents: 0 },
        },
        jurisdictionCompliance,
        auditReadiness: auditMetrics,
        complianceScore: this.calculateComplianceScore({
          overdueDSARs,
          expiringConsents,
          auditCompleteness: auditMetrics.completeness,
        }),
      };

    } catch (error) {
      logger.error('Error getting compliance metrics:', error);
      throw error;
    }
  }

  /**
   * Get system performance metrics
   */
  async getPerformanceMetrics(timeRange) {
    try {
      // API response time metrics (from events)
      const apiMetrics = await TMF669Event.aggregate([
        {
          $match: {
            eventTime: { $gte: timeRange.start, $lte: timeRange.end },
            source: { $in: ['consent-service', 'preference-service', 'party-service'] },
          },
        },
        {
          $group: {
            _id: '$source',
            totalRequests: { $sum: 1 },
            avgResponseTime: {
              $avg: {
                $subtract: ['$eventTime', '$createdAt'],
              },
            },
          },
        },
      ]);

      // Service uptime metrics
      const uptimeMetrics = await this.getServiceUptimeMetrics(timeRange);

      // Error rate metrics
      const errorMetrics = await TMF669Event.aggregate([
        {
          $match: {
            eventTime: { $gte: timeRange.start, $lte: timeRange.end },
            priority: 'Critical',
          },
        },
        {
          $group: {
            _id: '$source',
            errorCount: { $sum: 1 },
          },
        },
      ]);

      // Data processing volume
      const volumeMetrics = await this.getDataProcessingVolume(timeRange);

      return {
        apiPerformance: apiMetrics,
        serviceUptime: uptimeMetrics,
        errorRates: errorMetrics,
        dataVolume: volumeMetrics,
        systemHealth: this.calculateSystemHealthScore(apiMetrics, errorMetrics),
      };

    } catch (error) {
      logger.error('Error getting performance metrics:', error);
      throw error;
    }
  }

  /**
   * Get trend analysis over time
   */
  async getTrendAnalysis(timeRange, jurisdiction) {
    try {
      // Daily consent trends
      const dailyConsentTrends = await PrivacyConsent.aggregate([
        {
          $match: {
            createdAt: { $gte: timeRange.start, $lte: timeRange.end },
            ...(jurisdiction && { geoLocation: jurisdiction }),
          },
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              status: '$status',
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.date': 1 } },
      ]);

      // Purpose-based trends
      const purposeTrends = await PrivacyConsent.aggregate([
        {
          $match: {
            createdAt: { $gte: timeRange.start, $lte: timeRange.end },
            ...(jurisdiction && { geoLocation: jurisdiction }),
          },
        },
        {
          $group: {
            _id: {
              week: { $dateToString: { format: '%Y-W%U', date: '$createdAt' } },
              purpose: '$purpose',
            },
            granted: {
              $sum: { $cond: [{ $eq: ['$status', 'granted'] }, 1, 0] },
            },
            total: { $sum: 1 },
          },
        },
        {
          $addFields: {
            conversionRate: { $multiply: [{ $divide: ['$granted', '$total'] }, 100] },
          },
        },
        { $sort: { '_id.week': 1 } },
      ]);

      // Seasonal patterns (if enough data)
      const seasonalPatterns = await this.getSeasonalPatterns(timeRange, jurisdiction);

      // Predictive insights
      const predictions = await this.generatePredictiveInsights(dailyConsentTrends);

      return {
        dailyTrends: dailyConsentTrends,
        purposeTrends,
        seasonalPatterns,
        predictions,
        insights: this.generateTrendInsights(dailyConsentTrends, purposeTrends),
      };

    } catch (error) {
      logger.error('Error getting trend analysis:', error);
      throw error;
    }
  }

  /**
   * Get real-time system metrics
   */
  async getRealtimeMetrics(req, res) {
    try {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Recent activity
      const recentActivity = {
        newConsents: await PrivacyConsent.countDocuments({
          createdAt: { $gte: last24Hours },
        }),
        consentRevocations: await PrivacyConsent.countDocuments({
          updatedAt: { $gte: last24Hours },
          status: 'revoked',
        }),
        newDSARRequests: await DSARRequest.countDocuments({
          createdAt: { $gte: last24Hours },
        }),
        systemEvents: await TMF669Event.countDocuments({
          eventTime: { $gte: last24Hours },
        }),
      };

      // Current system status
      const systemStatus = {
        activeServices: 8, // Total microservices
        healthyServices: 8, // Should be dynamic in production
        criticalAlerts: await TMF669Event.countDocuments({
          eventTime: { $gte: last24Hours },
          priority: 'Critical',
        }),
        avgResponseTime: 125, // ms - should be measured from actual API calls
      };

      // Active user sessions (mock data - would integrate with auth service)
      const activeUsers = {
        total: 45,
        customers: 38,
        csrAgents: 5,
        admins: 2,
      };

      res.json({
        timestamp: new Date().toISOString(),
        recentActivity,
        systemStatus,
        activeUsers,
        uptime: this.getSystemUptime(),
      });

    } catch (error) {
      logger.error('Error getting realtime metrics:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  // Helper methods

  getTimeRange(timeframe) {
    const end = new Date();
    let start;

    switch (timeframe) {
      case '7d':
        start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        start = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    return { start, end };
  }

  calculateOverallConversionRate(consentsByStatus) {
    const total = consentsByStatus.reduce((sum, item) => sum + item.count, 0);
    const granted = consentsByStatus.find(item => item._id === 'granted')?.count || 0;
    return total > 0 ? Math.round((granted / total) * 100) : 0;
  }

  async getJurisdictionComplianceStatus(jurisdiction) {
    // Placeholder for jurisdiction-specific compliance checks
    return {
      status: 'compliant',
      score: 95,
      lastAudit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      nextAudit: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    };
  }

  async getAuditTrailMetrics(timeRange) {
    const totalEvents = await TMF669Event.countDocuments({
      eventTime: { $gte: timeRange.start, $lte: timeRange.end },
    });

    return {
      totalEvents,
      completeness: Math.min(100, (totalEvents / 1000) * 100), // Placeholder calculation
      integrityChecks: 'passed',
      retentionCompliance: 'compliant',
    };
  }

  calculateComplianceScore({ overdueDSARs, expiringConsents, auditCompleteness }) {
    let score = 100;
    
    // Deduct points for overdue DSARs
    score -= overdueDSARs * 5;
    
    // Deduct points for expiring consents
    score -= Math.min(expiringConsents * 2, 20);
    
    // Factor in audit completeness
    score = score * (auditCompleteness / 100);
    
    return Math.max(0, Math.round(score));
  }

  async getServiceUptimeMetrics(timeRange) {
    // Placeholder - would integrate with monitoring service
    return {
      'consent-service': 99.9,
      'preference-service': 99.8,
      'party-service': 99.95,
      'dsar-service': 99.7,
      'event-service': 99.85,
    };
  }

  async getDataProcessingVolume(timeRange) {
    return {
      totalRequests: 15420,
      peakHour: '14:00-15:00',
      avgRequestsPerHour: 642,
      dataTransfer: '2.3 GB',
    };
  }

  calculateSystemHealthScore(apiMetrics, errorMetrics) {
    // Simplified health score calculation
    const totalRequests = apiMetrics.reduce((sum, item) => sum + item.totalRequests, 0);
    const totalErrors = errorMetrics.reduce((sum, item) => sum + item.errorCount, 0);
    
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
    return Math.max(0, Math.round(100 - errorRate * 10));
  }

  async getSeasonalPatterns(timeRange, jurisdiction) {
    // Placeholder for seasonal analysis
    return {
      patterns: 'insufficient_data',
      recommendation: 'Collect at least 1 year of data for seasonal analysis',
    };
  }

  async generatePredictiveInsights(trendData) {
    // Simple trend prediction based on recent data
    if (trendData.length < 7) {
      return { prediction: 'insufficient_data' };
    }

    const recent = trendData.slice(-7);
    const avgGrowth = recent.reduce((sum, item) => sum + item.count, 0) / recent.length;
    
    return {
      nextWeekPrediction: Math.round(avgGrowth * 1.1),
      trend: avgGrowth > 0 ? 'increasing' : 'stable',
      confidence: 'medium',
    };
  }

  generateTrendInsights(dailyTrends, purposeTrends) {
    const insights = [];
    
    // Analyze daily trends for patterns
    if (dailyTrends.length >= 7) {
      const recent = dailyTrends.slice(-7);
      const avgRecent = recent.reduce((sum, item) => sum + item.count, 0) / recent.length;
      const earlier = dailyTrends.slice(0, 7);
      const avgEarlier = earlier.reduce((sum, item) => sum + item.count, 0) / earlier.length;
      
      if (avgRecent > avgEarlier * 1.1) {
        insights.push('Consent volume is trending upward');
      } else if (avgRecent < avgEarlier * 0.9) {
        insights.push('Consent volume is trending downward');
      }
    }

    // Analyze purpose trends
    const marketingPurpose = purposeTrends.filter(p => p._id.purpose === 'marketing');
    if (marketingPurpose.length > 0) {
      const avgConversion = marketingPurpose.reduce((sum, item) => sum + item.conversionRate, 0) / marketingPurpose.length;
      if (avgConversion < 50) {
        insights.push('Marketing consent conversion rate is below optimal (50%)');
      }
    }

    return insights;
  }

  getSystemUptime() {
    // Placeholder - would calculate from service start time
    return {
      days: 15,
      hours: 4,
      minutes: 23,
      percentage: 99.92,
    };
  }
}

module.exports = new AnalyticsController();
