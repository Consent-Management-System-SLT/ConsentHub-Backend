const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/adminDashboardController');

/**
 * TMF632 Extended Admin Routes
 * Consolidated admin dashboard API aligned with TM Forum specifications
 */

// Note: Authentication middleware temporarily disabled for development

/**
 * @swagger
 * /api/v1/admin/dashboard/overview:
 *   get:
 *     summary: Get comprehensive admin dashboard overview
 *     description: Aggregates system-wide metrics from all microservices
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard overview
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     systemOverview:
 *                       type: object
 *                       properties:
 *                         totalConsents:
 *                           type: number
 *                         grantedConsents:
 *                           type: number
 *                         revokedConsents:
 *                           type: number
 *                         totalPreferences:
 *                           type: number
 *                         totalParties:
 *                           type: number
 *                         pendingDSAR:
 *                           type: number
 *                     complianceMetrics:
 *                       type: object
 *                       properties:
 *                         complianceScore:
 *                           type: number
 *                         overdueItems:
 *                           type: number
 *                     systemHealth:
 *                       type: object
 *                       properties:
 *                         servicesOnline:
 *                           type: array
 *                         systemUptime:
 *                           type: number
 *       403:
 *         description: Access denied - Admin role required
 *       500:
 *         description: Server error
 */
router.get('/dashboard/overview', adminDashboardController.getDashboardOverview);

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get user management data
 *     description: Retrieve user list with filtering and pagination
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, csr, customer]
 *         description: Filter by user role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended]
 *         description: Filter by user status
 *     responses:
 *       200:
 *         description: User management data
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/users', adminDashboardController.getUserManagementData);

/**
 * @swagger
 * /api/v1/admin/analytics/consents:
 *   get:
 *     summary: Get comprehensive consent analytics
 *     description: System-wide consent metrics and analytics
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *         description: Time range for analytics
 *       - in: query
 *         name: jurisdiction
 *         schema:
 *           type: string
 *         description: Filter by jurisdiction
 *     responses:
 *       200:
 *         description: Consent analytics data
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/analytics/consents', adminDashboardController.getConsentAnalytics);

/**
 * @swagger
 * /api/v1/admin/compliance/dashboard:
 *   get:
 *     summary: Get compliance dashboard data
 *     description: Regulatory compliance monitoring and metrics
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *         description: Time range for compliance metrics
 *       - in: query
 *         name: framework
 *         schema:
 *           type: string
 *           enum: [GDPR, CCPA, PDP, PIPEDA]
 *         description: Regulatory framework
 *     responses:
 *       200:
 *         description: Compliance dashboard data
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/compliance/dashboard', adminDashboardController.getComplianceDashboard);

/**
 * @swagger
 * /api/v1/admin/bulk-operations:
 *   post:
 *     summary: Handle bulk operations
 *     description: Process bulk import, export, or update operations
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - operation
 *               - data
 *             properties:
 *               operation:
 *                 type: string
 *                 enum: [bulk_consent_import, bulk_user_creation, bulk_data_export]
 *               data:
 *                 type: object
 *                 description: Operation-specific data
 *           examples:
 *             bulk_consent_import:
 *               summary: Import consent records
 *               value:
 *                 operation: bulk_consent_import
 *                 data:
 *                   consents: []
 *             bulk_user_creation:
 *               summary: Create multiple users
 *               value:
 *                 operation: bulk_user_creation
 *                 data:
 *                   users: []
 *     responses:
 *       200:
 *         description: Bulk operation completed
 *       400:
 *         description: Invalid operation
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.post('/bulk-operations', adminDashboardController.handleBulkOperations);

module.exports = router;
