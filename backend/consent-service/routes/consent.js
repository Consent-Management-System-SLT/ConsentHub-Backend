const express = require('express');
const router = express.Router();
const consentController = require('../controllers/consentController');
const { verifyFirebaseToken, checkRole } = require('../../shared/auth');
const Joi = require('joi');

// Validation schemas
const createConsentSchema = Joi.object({
  partyId: Joi.string().required(),
  privacyNoticeId: Joi.string().optional(),
  productId: Joi.string().optional(),
  purpose: Joi.string().required(),
  status: Joi.string().valid('granted', 'revoked', 'pending').optional(),
  geoLocation: Joi.string().optional(),
  validityPeriod: Joi.object({
    startDateTime: Joi.date().optional(),
    endDateTime: Joi.date().optional(),
  }).optional(),
  consentData: Joi.object().optional(),
});

const updateConsentSchema = Joi.object({
  status: Joi.string().valid('granted', 'revoked', 'pending').optional(),
  purpose: Joi.string().optional(),
  geoLocation: Joi.string().optional(),
  validityPeriod: Joi.object({
    startDateTime: Joi.date().optional(),
    endDateTime: Joi.date().optional(),
  }).optional(),
  consentData: Joi.object().optional(),
});

// Validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(d => d.message),
      });
    }
    next();
  };
};

/**
 * @swagger
 * components:
 *   schemas:
 *     PrivacyConsent:
 *       type: object
 *       required:
 *         - id
 *         - partyId
 *         - purpose
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the consent
 *         partyId:
 *           type: string
 *           description: ID of the party giving consent
 *         privacyNoticeId:
 *           type: string
 *           description: ID of the associated privacy notice
 *         productId:
 *           type: string
 *           description: ID of the associated product
 *         purpose:
 *           type: string
 *           description: Purpose of the consent
 *         status:
 *           type: string
 *           enum: [granted, revoked, pending]
 *           description: Current status of the consent
 *         geoLocation:
 *           type: string
 *           description: Geographic location restriction
 *         validityPeriod:
 *           type: object
 *           properties:
 *             startDateTime:
 *               type: string
 *               format: date-time
 *             endDateTime:
 *               type: string
 *               format: date-time
 *         consentData:
 *           type: object
 *           description: Additional consent data
 */

/**
 * @swagger
 * /privacyConsent:
 *   post:
 *     summary: Create a new privacy consent
 *     tags: [Privacy Consent]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PrivacyConsent'
 *     responses:
 *       201:
 *         description: Consent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PrivacyConsent'
 */
router.post('/privacyConsent', 
  verifyFirebaseToken,
  checkRole(['customer', 'csr', 'admin']),
  validateRequest(createConsentSchema),
  consentController.createConsent
);

/**
 * @swagger
 * /privacyConsent/party/{partyId}:
 *   get:
 *     summary: Get consents by party ID
 *     tags: [Privacy Consent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [granted, revoked, pending]
 *       - in: query
 *         name: purpose
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of consents
 */
router.get('/privacyConsent/party/:partyId',
  verifyFirebaseToken,
  checkRole(['customer', 'csr', 'admin']),
  consentController.getConsentsByParty
);

/**
 * @swagger
 * /privacyConsent/{id}:
 *   get:
 *     summary: Get consent by ID
 *     tags: [Privacy Consent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Consent details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PrivacyConsent'
 */
router.get('/privacyConsent/:id',
  verifyFirebaseToken,
  checkRole(['customer', 'csr', 'admin']),
  consentController.getConsentById
);

/**
 * @swagger
 * /privacyConsent/{id}:
 *   patch:
 *     summary: Update privacy consent
 *     tags: [Privacy Consent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [granted, revoked, pending]
 *     responses:
 *       200:
 *         description: Consent updated successfully
 */
router.patch('/privacyConsent/:id',
  verifyFirebaseToken,
  checkRole(['customer', 'csr', 'admin']),
  validateRequest(updateConsentSchema),
  consentController.updateConsent
);

/**
 * @swagger
 * /privacyConsent/{id}/revoke:
 *   patch:
 *     summary: Revoke privacy consent
 *     tags: [Privacy Consent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Consent revoked successfully
 */
router.patch('/privacyConsent/:id/revoke',
  verifyFirebaseToken,
  checkRole(['customer', 'csr', 'admin']),
  consentController.revokeConsent
);

/**
 * @swagger
 * /privacyConsent/expired:
 *   get:
 *     summary: Get expired consents
 *     tags: [Privacy Consent]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of expired consents
 */
router.get('/privacyConsent/expired',
  verifyFirebaseToken,
  checkRole(['csr', 'admin']),
  consentController.getExpiredConsents
);

module.exports = router;
