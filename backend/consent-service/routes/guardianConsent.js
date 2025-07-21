const express = require('express');
const router = express.Router();
const guardianConsentController = require('../controllers/guardianConsentController');
const { verifyFirebaseToken, checkRole } = require('../../shared/auth');
const Joi = require('joi');

// Validation schemas
const grantGuardianConsentSchema = Joi.object({
  minorPartyId: Joi.string().required(),
  guardianPartyId: Joi.string().required(),
  purpose: Joi.string().valid('marketing', 'analytics', 'thirdPartySharing', 'dataProcessing', 'location', 'research', 'personalization').required(),
  channel: Joi.string().optional(),
  privacyNoticeId: Joi.string().optional(),
  geoLocation: Joi.string().optional(),
  endDateTime: Joi.date().optional(),
  consentData: Joi.object().optional(),
});

const revokeGuardianConsentSchema = Joi.object({
  guardianPartyId: Joi.string().required(),
  reason: Joi.string().optional(),
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
 * /api/v1/guardian-consent:
 *   post:
 *     summary: Grant consent on behalf of a minor
 *     description: Allows a verified guardian to grant consent for a minor under their authority
 *     tags: [Guardian Consent]
 *     security:
 *       - FirebaseAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - minorPartyId
 *               - guardianPartyId
 *               - purpose
 *             properties:
 *               minorPartyId:
 *                 type: string
 *                 description: ID of the minor party
 *               guardianPartyId:
 *                 type: string
 *                 description: ID of the guardian party
 *               purpose:
 *                 type: string
 *                 enum: [marketing, analytics, thirdPartySharing, dataProcessing, location, research, personalization]
 *               channel:
 *                 type: string
 *               privacyNoticeId:
 *                 type: string
 *               geoLocation:
 *                 type: string
 *               endDateTime:
 *                 type: string
 *                 format: date-time
 *               consentData:
 *                 type: object
 *     responses:
 *       201:
 *         description: Guardian consent granted successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Insufficient authority
 *       404:
 *         description: Guardian or minor not found
 */
router.post('/',
  verifyFirebaseToken,
  checkRole(['guardian', 'admin', 'csr']),
  validateRequest(grantGuardianConsentSchema),
  guardianConsentController.grantConsentForMinor
);

/**
 * @swagger
 * /api/v1/guardian-consent/{consentId}:
 *   patch:
 *     summary: Revoke consent on behalf of a minor
 *     description: Allows a verified guardian to revoke consent for a minor under their authority
 *     tags: [Guardian Consent]
 *     security:
 *       - FirebaseAuth: []
 *     parameters:
 *       - in: path
 *         name: consentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the consent to revoke
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - guardianPartyId
 *             properties:
 *               guardianPartyId:
 *                 type: string
 *                 description: ID of the guardian party
 *               reason:
 *                 type: string
 *                 description: Reason for revocation
 *     responses:
 *       200:
 *         description: Guardian consent revoked successfully
 *       403:
 *         description: Insufficient authority
 *       404:
 *         description: Consent not found
 */
router.patch('/:consentId',
  verifyFirebaseToken,
  checkRole(['guardian', 'admin', 'csr']),
  validateRequest(revokeGuardianConsentSchema),
  guardianConsentController.revokeConsentForMinor
);

/**
 * @swagger
 * /api/v1/guardian-consent/guardian/{guardianPartyId}:
 *   get:
 *     summary: Get all consents managed by a guardian
 *     description: Retrieve all consents for minors under a guardian's authority
 *     tags: [Guardian Consent]
 *     security:
 *       - FirebaseAuth: []
 *     parameters:
 *       - in: path
 *         name: guardianPartyId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the guardian party
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Guardian managed consents retrieved successfully
 *       404:
 *         description: Guardian not found
 */
router.get('/guardian/:guardianPartyId',
  verifyFirebaseToken,
  checkRole(['guardian', 'admin', 'csr']),
  guardianConsentController.getGuardianManagedConsents
);

/**
 * @swagger
 * /api/v1/guardian-consent/validate-authority:
 *   get:
 *     summary: Validate guardian authority
 *     description: Check if a guardian has authority to grant consent for a minor
 *     tags: [Guardian Consent]
 *     security:
 *       - FirebaseAuth: []
 *     parameters:
 *       - in: query
 *         name: guardianPartyId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the guardian party
 *       - in: query
 *         name: minorPartyId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the minor party
 *       - in: query
 *         name: purpose
 *         schema:
 *           type: string
 *         description: Consent purpose to validate
 *     responses:
 *       200:
 *         description: Authority validation result
 *       404:
 *         description: Guardian not found
 */
router.get('/validate-authority',
  verifyFirebaseToken,
  checkRole(['guardian', 'admin', 'csr']),
  guardianConsentController.validateGuardianAuthority
);

module.exports = router;
