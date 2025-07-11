const express = require('express');
const router = express.Router();
const agreementController = require('../controllers/agreementController');
const { verifyFirebaseToken, checkRole } = require('../../shared/auth');
const Joi = require('joi');

// Validation schemas
const createAgreementSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  agreementType: Joi.string().valid('product', 'service', 'legal', 'consent', 'privacy', 'marketing', 'subsidy').required(),
  status: Joi.string().valid('active', 'terminated', 'suspended', 'pending', 'cancelled').optional(),
  version: Joi.string().optional(),
  partyId: Joi.string().required(),
  partyRole: Joi.string().valid('customer', 'subscriber', 'beneficiary', 'guardian').optional(),
  agreementSpecification: Joi.object().required(),
  agreementItems: Joi.array().items(Joi.object()).optional(),
  validityPeriod: Joi.object().optional(),
  billingAccountId: Joi.string().optional(),
  paymentMethod: Joi.string().valid('credit_card', 'bank_account', 'digital_wallet', 'cash', 'invoice').optional(),
  billingCycle: Joi.string().valid('monthly', 'quarterly', 'annually', 'one_time').optional(),
  cancellationPolicy: Joi.object().optional(),
  renewalType: Joi.string().valid('automatic', 'manual', 'none').optional(),
  renewalPeriod: Joi.object().optional(),
  characteristics: Joi.array().items(Joi.object()).optional(),
  attachments: Joi.array().items(Joi.object()).optional(),
  signature: Joi.object().optional(),
  relatedAgreements: Joi.array().items(Joi.object()).optional(),
  source: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  externalReferences: Joi.array().items(Joi.object()).optional(),
});

const signAgreementSchema = Joi.object({
  signatureMethod: Joi.string().valid('digital', 'electronic', 'physical').optional(),
});

const terminateAgreementSchema = Joi.object({
  terminationReason: Joi.string().optional(),
  terminationDate: Joi.date().optional(),
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
 *     Agreement:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - agreementType
 *         - partyId
 *         - agreementSpecification
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the agreement
 *         name:
 *           type: string
 *           description: Name of the agreement
 *         agreementType:
 *           type: string
 *           enum: [product, service, legal, consent, privacy, marketing, subsidy]
 *           description: Type of agreement
 *         status:
 *           type: string
 *           enum: [active, terminated, suspended, pending, cancelled]
 *           description: Current status
 *         partyId:
 *           type: string
 *           description: ID of the party in the agreement
 *         validityPeriod:
 *           type: object
 *           properties:
 *             startDateTime:
 *               type: string
 *               format: date-time
 *             endDateTime:
 *               type: string
 *               format: date-time
 */

/**
 * @swagger
 * /agreement:
 *   post:
 *     summary: Create a new agreement
 *     tags: [Agreement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Agreement'
 *     responses:
 *       201:
 *         description: Agreement created successfully
 */
router.post('/agreement',
  verifyFirebaseToken,
  checkRole(['customer', 'csr', 'admin']),
  validateRequest(createAgreementSchema),
  agreementController.createAgreement
);

/**
 * @swagger
 * /agreement/party/{partyId}:
 *   get:
 *     summary: Get agreements by party ID
 *     tags: [Agreement]
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
 *       - in: query
 *         name: agreementType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of agreements
 */
router.get('/agreement/party/:partyId',
  verifyFirebaseToken,
  checkRole(['customer', 'csr', 'admin']),
  agreementController.getAgreementsByParty
);

/**
 * @swagger
 * /agreement/{id}:
 *   get:
 *     summary: Get agreement by ID
 *     tags: [Agreement]
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
 *         description: Agreement details
 */
router.get('/agreement/:id',
  verifyFirebaseToken,
  checkRole(['customer', 'csr', 'admin']),
  agreementController.getAgreementById
);

/**
 * @swagger
 * /agreement/{id}:
 *   patch:
 *     summary: Update agreement
 *     tags: [Agreement]
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
 *         description: Agreement updated successfully
 */
router.patch('/agreement/:id',
  verifyFirebaseToken,
  checkRole(['customer', 'csr', 'admin']),
  agreementController.updateAgreement
);

/**
 * @swagger
 * /agreement/{id}/sign:
 *   patch:
 *     summary: Sign agreement
 *     tags: [Agreement]
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
 *         description: Agreement signed successfully
 */
router.patch('/agreement/:id/sign',
  verifyFirebaseToken,
  checkRole(['customer', 'csr', 'admin']),
  validateRequest(signAgreementSchema),
  agreementController.signAgreement
);

/**
 * @swagger
 * /agreement/{id}/terminate:
 *   patch:
 *     summary: Terminate agreement
 *     tags: [Agreement]
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
 *         description: Agreement terminated successfully
 */
router.patch('/agreement/:id/terminate',
  verifyFirebaseToken,
  checkRole(['customer', 'csr', 'admin']),
  validateRequest(terminateAgreementSchema),
  agreementController.terminateAgreement
);

/**
 * @swagger
 * /agreement/{id}/approve:
 *   patch:
 *     summary: Approve agreement
 *     tags: [Agreement]
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
 *         description: Agreement approved successfully
 */
router.patch('/agreement/:id/approve',
  verifyFirebaseToken,
  checkRole(['csr', 'admin']),
  agreementController.approveAgreement
);

/**
 * @swagger
 * /agreement/expired:
 *   get:
 *     summary: Get expired agreements
 *     tags: [Agreement]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of expired agreements
 */
router.get('/agreement/expired',
  verifyFirebaseToken,
  checkRole(['csr', 'admin']),
  agreementController.getExpiredAgreements
);

/**
 * @swagger
 * /agreement/expiring:
 *   get:
 *     summary: Get agreements expiring soon
 *     tags: [Agreement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: List of expiring agreements
 */
router.get('/agreement/expiring',
  verifyFirebaseToken,
  checkRole(['csr', 'admin']),
  agreementController.getExpiringAgreements
);

module.exports = router;
