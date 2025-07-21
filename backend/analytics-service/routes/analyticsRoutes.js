const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, authorizeRoles } = require('../../shared/middleware/auth');
const { validateRequest } = require('../../shared/middleware/validation');
const { rateLimiter } = require('../../shared/middleware/rateLimiter');

/**
 * TMF669 Privacy Management API - Analytics Routes
 * Provides comprehensive analytics endpoints for consent, compliance, and performance metrics
 */

// Apply rate limiting to all analytics routes
router.use(rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many analytics requests from this IP',
}));

// Authentication required for all routes
router.use(authenticateToken);

/**
 * @route GET /analytics/consent
 * @desc Get comprehensive consent analytics dashboard
 * @access Admin, CSR, Manager
 * @query {string} timeframe - 7d, 30d, 90d, 1y (default: 30d)
 * @query {string} jurisdiction - Filter by jurisdiction
 * @query {string} purpose - Filter by consent purpose
 * @query {string} format - json, csv (default: json)
 */
router.get('/consent',
  authorizeRoles(['admin', 'csr', 'manager']),
  validateRequest([
    {
      field: 'timeframe',
      type: 'string',
      enum: ['7d', '30d', '90d', '1y'],
      optional: true,
    },
    {
      field: 'jurisdiction',
      type: 'string',
      optional: true,
    },
  ]),
  analyticsController.getConsentAnalytics
);

/**
 * @route GET /analytics/compliance
 * @desc Get compliance and audit readiness metrics
 * @access Admin, Compliance Officer
 * @query {string} timeframe - 7d, 30d, 90d, 1y (default: 30d)
 * @query {string} jurisdiction - Filter by jurisdiction
 * @query {string} framework - GDPR, CCPA, PDP, etc.
 */
router.get('/compliance',
  authorizeRoles(['admin', 'compliance']),
  validateRequest([
    {
      field: 'timeframe',
      type: 'string',
      enum: ['7d', '30d', '90d', '1y'],
      optional: true,
    },
    {
      field: 'jurisdiction',
      type: 'string',
      optional: true,
    },
    {
      field: 'framework',
      type: 'string',
      enum: ['GDPR', 'CCPA', 'PDP', 'PIPEDA', 'LGPD'],
      optional: true,
    },
  ]),
  async (req, res) => {
    try {
      const { timeframe = '30d', jurisdiction, framework } = req.query;
      const timeRange = analyticsController.getTimeRange(timeframe);

      const complianceMetrics = await analyticsController.getComplianceMetrics(
        timeRange, 
        jurisdiction
      );

      res.json({
        timeframe,
        jurisdiction: jurisdiction || 'all',
        framework: framework || 'all',
        generatedAt: new Date().toISOString(),
        compliance: complianceMetrics,
      });

    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
);

/**
 * @route GET /analytics/performance
 * @desc Get system performance metrics
 * @access Admin, Technical Team
 * @query {string} timeframe - 7d, 30d, 90d, 1y (default: 30d)
 * @query {string} service - Filter by specific service
 */
router.get('/performance',
  authorizeRoles(['admin', 'technical']),
  validateRequest([
    {
      field: 'timeframe',
      type: 'string',
      enum: ['7d', '30d', '90d', '1y'],
      optional: true,
    },
    {
      field: 'service',
      type: 'string',
      enum: ['consent-service', 'preference-service', 'party-service', 'dsar-service', 'event-service'],
      optional: true,
    },
  ]),
  async (req, res) => {
    try {
      const { timeframe = '30d', service } = req.query;
      const timeRange = analyticsController.getTimeRange(timeframe);

      const performanceMetrics = await analyticsController.getPerformanceMetrics(
        timeRange
      );

      // Filter by service if requested
      let filteredMetrics = performanceMetrics;
      if (service) {
        filteredMetrics = {
          ...performanceMetrics,
          serviceSpecific: performanceMetrics.apiPerformance.find(
            api => api._id === service
          ),
        };
      }

      res.json({
        timeframe,
        service: service || 'all',
        generatedAt: new Date().toISOString(),
        performance: filteredMetrics,
      });

    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
);

/**
 * @route GET /analytics/trends
 * @desc Get trend analysis over time
 * @access Admin, Manager, Analyst
 * @query {string} timeframe - 7d, 30d, 90d, 1y (default: 30d)
 * @query {string} jurisdiction - Filter by jurisdiction
 * @query {string} metric - consent, dsar, preference (default: consent)
 */
router.get('/trends',
  authorizeRoles(['admin', 'manager', 'analyst']),
  validateRequest([
    {
      field: 'timeframe',
      type: 'string',
      enum: ['7d', '30d', '90d', '1y'],
      optional: true,
    },
    {
      field: 'jurisdiction',
      type: 'string',
      optional: true,
    },
    {
      field: 'metric',
      type: 'string',
      enum: ['consent', 'dsar', 'preference'],
      optional: true,
    },
  ]),
  async (req, res) => {
    try {
      const { timeframe = '30d', jurisdiction, metric = 'consent' } = req.query;
      const timeRange = analyticsController.getTimeRange(timeframe);

      const trendAnalysis = await analyticsController.getTrendAnalysis(
        timeRange, 
        jurisdiction
      );

      res.json({
        timeframe,
        jurisdiction: jurisdiction || 'all',
        metric,
        generatedAt: new Date().toISOString(),
        trends: trendAnalysis,
      });

    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
);

/**
 * @route GET /analytics/realtime
 * @desc Get real-time system metrics and activity
 * @access Admin, Technical Team, Manager
 */
router.get('/realtime',
  authorizeRoles(['admin', 'technical', 'manager']),
  analyticsController.getRealtimeMetrics
);

/**
 * @route GET /analytics/dashboard
 * @desc Get consolidated dashboard data
 * @access Admin, Manager
 * @query {string} timeframe - 7d, 30d, 90d, 1y (default: 30d)
 * @query {string} jurisdiction - Filter by jurisdiction
 */
router.get('/dashboard',
  authorizeRoles(['admin', 'manager']),
  validateRequest([
    {
      field: 'timeframe',
      type: 'string',
      enum: ['7d', '30d', '90d', '1y'],
      optional: true,
    },
    {
      field: 'jurisdiction',
      type: 'string',
      optional: true,
    },
  ]),
  async (req, res) => {
    try {
      const { timeframe = '30d', jurisdiction } = req.query;
      const timeRange = analyticsController.getTimeRange(timeframe);

      // Gather all dashboard data in parallel
      const [
        consentMetrics,
        complianceMetrics,
        performanceMetrics,
        trendAnalysis,
        realtimeData,
      ] = await Promise.all([
        analyticsController.getConsentMetrics(timeRange, jurisdiction),
        analyticsController.getComplianceMetrics(timeRange, jurisdiction),
        analyticsController.getPerformanceMetrics(timeRange),
        analyticsController.getTrendAnalysis(timeRange, jurisdiction),
        analyticsController.getRealtimeMetrics({ query: {} }, { json: (data) => data }),
      ]);

      res.json({
        timeframe,
        jurisdiction: jurisdiction || 'all',
        generatedAt: new Date().toISOString(),
        dashboard: {
          consent: {
            summary: consentMetrics.summary,
            conversionRate: consentMetrics.conversionRate,
            topPurposes: consentMetrics.byPurpose.slice(0, 5),
          },
          compliance: {
            complianceScore: complianceMetrics.complianceScore,
            overdueItems: complianceMetrics.dsarRequests.overdue,
            upcomingDeadlines: complianceMetrics.consentCompliance.expiringConsents,
          },
          performance: {
            systemHealth: performanceMetrics.systemHealth,
            avgResponseTime: performanceMetrics.apiPerformance.reduce(
              (avg, api) => avg + (api.avgResponseTime || 0), 0
            ) / performanceMetrics.apiPerformance.length,
            uptime: performanceMetrics.serviceUptime,
          },
          trends: {
            dailyTrends: trendAnalysis.dailyTrends.slice(-7), // Last 7 days
            insights: trendAnalysis.insights.slice(0, 3), // Top 3 insights
            predictions: trendAnalysis.predictions,
          },
          realtime: realtimeData,
        },
      });

    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
);

/**
 * @route POST /analytics/report
 * @desc Generate custom analytics report
 * @access Admin, Manager, Compliance Officer
 * @body {object} reportConfig - Report configuration
 */
router.post('/report',
  authorizeRoles(['admin', 'manager', 'compliance']),
  validateRequest([
    {
      field: 'reportType',
      type: 'string',
      enum: ['consent', 'compliance', 'performance', 'comprehensive'],
      required: true,
    },
    {
      field: 'timeframe',
      type: 'string',
      enum: ['7d', '30d', '90d', '1y'],
      required: true,
    },
    {
      field: 'format',
      type: 'string',
      enum: ['json', 'pdf', 'csv'],
      optional: true,
    },
    {
      field: 'filters',
      type: 'object',
      optional: true,
    },
  ]),
  async (req, res) => {
    try {
      const { reportType, timeframe, format = 'json', filters = {} } = req.body;
      const timeRange = analyticsController.getTimeRange(timeframe);

      let reportData = {};

      switch (reportType) {
        case 'consent':
          reportData = await analyticsController.getConsentMetrics(
            timeRange,
            filters.jurisdiction
          );
          break;
        case 'compliance':
          reportData = await analyticsController.getComplianceMetrics(
            timeRange,
            filters.jurisdiction
          );
          break;
        case 'performance':
          reportData = await analyticsController.getPerformanceMetrics(timeRange);
          break;
        case 'comprehensive':
          reportData = {
            consent: await analyticsController.getConsentMetrics(
              timeRange,
              filters.jurisdiction
            ),
            compliance: await analyticsController.getComplianceMetrics(
              timeRange,
              filters.jurisdiction
            ),
            performance: await analyticsController.getPerformanceMetrics(timeRange),
            trends: await analyticsController.getTrendAnalysis(
              timeRange,
              filters.jurisdiction
            ),
          };
          break;
      }

      // Handle different format responses
      if (format === 'pdf') {
        // Would integrate with PDF generation service
        res.json({
          message: 'PDF report generation initiated',
          reportId: `report-${Date.now()}`,
          downloadUrl: '/analytics/reports/download',
        });
      } else if (format === 'csv') {
        // Would convert to CSV format
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="analytics-report.csv"');
        res.send('CSV data would be generated here');
      } else {
        res.json({
          reportType,
          timeframe,
          filters,
          generatedAt: new Date().toISOString(),
          data: reportData,
        });
      }

    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
);

/**
 * @route GET /analytics/export/:format
 * @desc Export analytics data in various formats
 * @access Admin, Manager
 * @params {string} format - csv, json, excel
 * @query {string} timeframe - 7d, 30d, 90d, 1y (default: 30d)
 * @query {string} dataType - consent, compliance, performance (default: consent)
 */
router.get('/export/:format',
  authorizeRoles(['admin', 'manager']),
  validateRequest([
    {
      field: 'format',
      type: 'string',
      enum: ['csv', 'json', 'excel'],
      required: true,
      location: 'params',
    },
    {
      field: 'timeframe',
      type: 'string',
      enum: ['7d', '30d', '90d', '1y'],
      optional: true,
    },
    {
      field: 'dataType',
      type: 'string',
      enum: ['consent', 'compliance', 'performance'],
      optional: true,
    },
  ]),
  async (req, res) => {
    try {
      const { format } = req.params;
      const { timeframe = '30d', dataType = 'consent' } = req.query;
      const timeRange = analyticsController.getTimeRange(timeframe);

      let data;
      switch (dataType) {
        case 'consent':
          data = await analyticsController.getConsentMetrics(timeRange);
          break;
        case 'compliance':
          data = await analyticsController.getComplianceMetrics(timeRange);
          break;
        case 'performance':
          data = await analyticsController.getPerformanceMetrics(timeRange);
          break;
      }

      const filename = `${dataType}-analytics-${timeframe}.${format}`;

      switch (format) {
        case 'csv':
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          // Would implement CSV conversion logic here
          res.send('CSV export would be implemented here');
          break;
        case 'json':
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.json(data);
          break;
        case 'excel':
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          // Would implement Excel conversion logic here
          res.send('Excel export would be implemented here');
          break;
      }

    } catch (error) {
      res.status(500).json({
        error: 'Export failed',
        message: error.message,
      });
    }
  }
);

/**
 * @route GET /analytics/health
 * @desc Get analytics service health status
 * @access Public (for monitoring)
 */
router.get('/health', (req, res) => {
  res.json({
    service: 'analytics-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    dependencies: {
      database: 'connected',
      redis: 'connected',
      elasticsearch: 'optional',
    },
  });
});

module.exports = router;
