const express = require('express');
const router = express.Router();
const preferenceController = require('../controllers/preferenceController');
const { verifyFirebaseToken, checkRole } = require('../../shared/auth');
const Joi = require('joi');

// Validation schemas
const createPreferenceSchema = Joi.object({
  partyId: Joi.string().required(),
  notificationPreferences: Joi.object().optional(),
  communicationPreferences: Joi.object().optional(),
  dataProcessingPreferences: Joi.object().optional(),
  geoLocation: Joi.string().optional(),
  validityPeriod: Joi.object({
    startDateTime: Joi.date().optional(),
    endDateTime: Joi.date().optional(),
  }).optional(),
});

const updateNotificationSchema = Joi.object({
  channel: Joi.string().valid('sms', 'email', 'push', 'inApp').optional(),
  preferences: Joi.object().required(),
});

const deviceTokenSchema = Joi.object({
  token: Joi.string().required(),
  platform: Joi.string().valid('ios', 'android', 'web').required(),
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
 *     PrivacyPreference:
 *       type: object
 *       required:
 *         - id
 *         - partyId
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the preference
 *         partyId:
 *           type: string
 *           description: ID of the party
 *         notificationPreferences:
 *           type: object
 *           description: Notification channel preferences
 *         communicationPreferences:
 *           type: object
 *           description: Communication preferences
 *         dataProcessingPreferences:
 *           type: object
 *           description: Data processing preferences
 */

/**
 * @swagger
 * /privacyPreference:
 *   post:
 *     summary: Create new privacy preference
 *     tags: [Privacy Preference]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PrivacyPreference'
 *     responses:
 *       201:
 *         description: Preference created successfully
 */
router.post('/privacyPreference',
  verifyFirebaseToken,
  checkRole(['customer', 'csr', 'admin']),
  validateRequest(createPreferenceSchema),
  preferenceController.createPreference
);

/**
 * @swagger
 * /privacyPreference:
 *   get:
 *     summary: Get all privacy preferences
 *     tags: [Privacy Preference]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: partyId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of preferences
 */
router.get('/privacyPreference',
  verifyFirebaseToken,
  checkRole(['csr', 'admin']),
  preferenceController.getAllPreferences
);

/**
 * @swagger
 * /privacyPreference/party/{partyId}:
 *   get:
 *     summary: Get preferences by party ID
 *     tags: [Privacy Preference]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Party preferences
 */
router.get('/privacyPreference/party/:partyId',
  verifyFirebaseToken,
  checkRole(['customer', 'csr', 'admin']),
  preferenceController.getPreferencesByParty
);

/**
 * @swagger
 * /privacyPreference/{id}:
 *   patch:
 *     summary: Update privacy preference
 *     tags: [Privacy Preference]
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
 *     responses:
 *       200:
 *         description: Preference updated successfully
 */
router.patch('/privacyPreference/:id',
  verifyFirebaseToken,
  checkRole(['customer', 'csr', 'admin']),
  preferenceController.updatePreference
);

/**
 * @swagger
 * /privacyPreference/party/{partyId}/notifications:
 *   patch:
 *     summary: Update notification preferences
 *     tags: [Privacy Preference]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partyId
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
 *               channel:
 *                 type: string
 *                 enum: [sms, email, push, inApp]
 *               preferences:
 *                 type: object
 *     responses:
 *       200:
 *         description: Notification preferences updated successfully
 */
router.patch('/privacyPreference/party/:partyId/notifications',
  verifyFirebaseToken,
  checkRole(['customer', 'csr', 'admin']),
  validateRequest(updateNotificationSchema),
  preferenceController.updateNotificationPreferences
);

/**
 * @swagger
 * /privacyPreference/party/{partyId}/device-token:
 *   post:
 *     summary: Register device token for push notifications
 *     tags: [Privacy Preference]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partyId
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
 *               token:
 *                 type: string
 *               platform:
 *                 type: string
 *                 enum: [ios, android, web]
 *     responses:
 *       200:
 *         description: Device token registered successfully
 */
router.post('/privacyPreference/party/:partyId/device-token',
  verifyFirebaseToken,
  checkRole(['customer', 'csr', 'admin']),
  validateRequest(deviceTokenSchema),
  preferenceController.registerDeviceToken
);

/**
 * @swagger
 * /privacyPreference/party/{partyId}/communication:
 *   get:
 *     summary: Get communication preferences
 *     tags: [Privacy Preference]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Communication preferences
 */
router.get('/privacyPreference/party/:partyId/communication',
  verifyFirebaseToken,
  checkRole(['customer', 'csr', 'admin']),
  preferenceController.getCommunicationPreferences
);

module.exports = router;
