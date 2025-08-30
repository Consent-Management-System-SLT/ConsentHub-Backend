const express = require('express');
const router = express.Router();
const consentController = require('../controllers/consentController');
const { authenticateCustomer, customerRateLimit } = require('../middleware/auth');

// Apply rate limiting to all consent routes
router.use(customerRateLimit);

// Apply authentication to all routes
router.use(authenticateCustomer);

/**
 * @swagger
 * /api/v1/customer/consents:
 *   get:
 *     summary: Get customer's consents
 *     tags: [Customer Consents]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [granted, revoked, expired, pending]
 *         description: Filter by consent status
 *       - in: query
 *         name: purpose
 *         schema:
 *           type: string
 *         description: Filter by purpose
 *       - in: query
 *         name: consentType
 *         schema:
 *           type: string
 *         description: Filter by consent type
 *     responses:
 *       200:
 *         description: Consents retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', consentController.getConsents);

/**
 * @swagger
 * /api/v1/customer/consents/summary:
 *   get:
 *     summary: Get customer's consent summary
 *     tags: [Customer Consents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Consent summary retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/summary', consentController.getConsentSummary);

/**
 * @swagger
 * /api/v1/customer/consents:
 *   post:
 *     summary: Grant new consent
 *     tags: [Customer Consents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - purpose
 *               - consentType
 *             properties:
 *               purpose:
 *                 type: string
 *                 description: Purpose of the consent
 *               consentType:
 *                 type: string
 *                 description: Type of consent
 *               description:
 *                 type: string
 *                 description: Description of the consent
 *               validFor:
 *                 type: object
 *                 properties:
 *                   startDateTime:
 *                     type: string
 *                     format: date-time
 *                   endDateTime:
 *                     type: string
 *                     format: date-time
 *     responses:
 *       201:
 *         description: Consent granted successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', consentController.grantConsent);

/**
 * @swagger
 * /api/v1/customer/consents/{id}:
 *   get:
 *     summary: Get specific consent by ID
 *     tags: [Customer Consents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Consent ID
 *     responses:
 *       200:
 *         description: Consent retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Consent not found
 *       500:
 *         description: Server error
 */
router.get('/:id', consentController.getConsentById);

/**
 * @swagger
 * /api/v1/customer/consents/{id}/grant:
 *   post:
 *     summary: Grant or re-grant consent
 *     tags: [Customer Consents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Consent ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *     responses:
 *       200:
 *         description: Consent granted successfully
 *       400:
 *         description: Consent already granted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Consent not found
 *       500:
 *         description: Server error
 */
router.post('/:id/grant', consentController.grantConsent);

/**
 * @swagger
 * /api/v1/customer/consents/{id}/revoke:
 *   post:
 *     summary: Revoke consent
 *     tags: [Customer Consents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Consent ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for revocation
 *     responses:
 *       200:
 *         description: Consent revoked successfully
 *       400:
 *         description: Consent already revoked
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Consent not found
 *       500:
 *         description: Server error
 */
router.post('/:id/grant', consentController.grantConsentById);

router.post('/:id/revoke', consentController.revokeConsent);

/**
 * @swagger
 * /api/v1/customer/consents/{id}/history:
 *   get:
 *     summary: Get consent history
 *     tags: [Customer Consents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Consent ID
 *     responses:
 *       200:
 *         description: Consent history retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Consent not found
 *       500:
 *         description: Server error
 */
router.get('/:id/history', consentController.getConsentHistory);

module.exports = router;
