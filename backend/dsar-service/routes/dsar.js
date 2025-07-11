const express = require('express');
const router = express.Router();
const dsarController = require('../controllers/dsarController');
const { verifyFirebaseToken, checkRole } = require('../../shared/auth');
const Joi = require('joi');

// Validation schemas
const createDSARRequestSchema = Joi.object({
  partyId: Joi.string().required(),
  requestType: Joi.string().valid('access', 'rectification', 'erasure', 'portability', 'objection', 'restriction', 'withdraw_consent').required(),
  requestDetails: Joi.object({
    description: Joi.string().required(),
    dataCategories: Joi.array().items(Joi.string().valid('personal_data', 'sensitive_data', 'behavioral_data', 'location_data', 'communication_data', 'device_data', 'consent_data', 'preference_data')).optional(),
    specificFields: Joi.array().items(Joi.string()).optional(),
    dateRange: Joi.object({
      startDate: Joi.date().optional(),
      endDate: Joi.date().optional(),
    }).optional(),
    format: Joi.string().valid('json', 'csv', 'pdf', 'xml').optional(),
  }).required(),
  submissionMethod: Joi.string().valid('web_portal', 'email', 'phone', 'csr_assisted').optional(),
  contactPreference: Joi.string().valid('email', 'phone', 'postal', 'in_app').optional(),
  urgentRequest: Joi.boolean().optional(),
  geoLocation: Joi.string().optional(),
  language: Joi.string().valid('en', 'si', 'ta').optional(),
  jurisdiction: Joi.string().valid('EU', 'LK', 'US', 'GLOBAL').optional(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'in_progress', 'completed', 'rejected', 'cancelled').required(),
  processingNotes: Joi.string().optional(),
  assignedTo: Joi.string().optional(),
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
 *     DSARRequest:
 *       type: object
 *       required:
 *         - id
 *         - partyId
 *         - requestType
 *         - requestDetails
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the DSAR request
 *         partyId:
 *           type: string
 *           description: ID of the party requesting data
 *         requestType:
 *           type: string
 *           enum: [access, rectification, erasure, portability, objection, restriction, withdraw_consent]
 *           description: Type of DSAR request
 *         status:
 *           type: string
 *           enum: [pending, in_progress, completed, rejected, cancelled]
 *           description: Current status of the request
 *         requestDetails:
 *           type: object
 *           properties:
 *             description:
 *               type: string
 *               description: Description of the request
 *             dataCategories:
 *               type: array
 *               items:
 *                 type: string
 *                 enum: [personal_data, sensitive_data, behavioral_data, location_data, communication_data, device_data, consent_data, preference_data]
 *             format:
 *               type: string
 *               enum: [json, csv, pdf, xml]
 *               description: Preferred format for data export
 *         submissionDetails:
 *           type: object
 *           properties:
 *             submittedBy:
 *               type: string
 *               description: User ID who submitted the request
 *             submissionDate:
 *               type: string
 *               format: date-time
 *             contactPreference:
 *               type: string
 *               enum: [email, phone, postal, in_app]
 *         processingDetails:
 *           type: object
 *           properties:
 *             assignedTo:
 *               type: string
 *               description: CSR or admin assigned to process the request
 *             estimatedCompletion:
 *               type: string
 *               format: date-time
 *             actualCompletion:
 *               type: string
 *               format: date-time
 *         compliance:
 *           type: object
 *           properties:
 *             legalBasis:
 *               type: string
 *               description: Legal basis for the request
 *             responseTimeLimit:
 *               type: number
 *               description: Response time limit in days
 */

/**
 * @swagger
 * /dsarRequest:
 *   post:
 *     summary: Create a new DSAR request
 *     tags: [DSAR Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - partyId
 *               - requestType
 *               - requestDetails
 *             properties:
 *               partyId:
 *                 type: string
 *               requestType:
 *                 type: string
 *                 enum: [access, rectification, erasure, portability, objection, restriction, withdraw_consent]
 *               requestDetails:
 *                 type: object
 *                 properties:
 *                   description:
 *                     type: string
 *                   dataCategories:
 *                     type: array
 *                     items:
 *                       type: string
 *                   format:
 *                     type: string
 *                     enum: [json, csv, pdf, xml]
 *     responses:
 *       201:
 *         description: DSAR request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DSARRequest'
 */
router.post('/dsarRequest',
  verifyFirebaseToken,
  checkRole(['customer', 'csr', 'admin']),
  validateRequest(createDSARRequestSchema),
  dsarController.createDSARRequest
);

/**
 * @swagger
 * /dsarRequest/party/{partyId}:
 *   get:
 *     summary: Get DSAR requests by party ID
 *     tags: [DSAR Management]
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
 *           enum: [pending, in_progress, completed, rejected, cancelled]
 *       - in: query
 *         name: requestType
 *         schema:
 *           type: string
 *           enum: [access, rectification, erasure, portability, objection, restriction, withdraw_consent]
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
 *         description: List of DSAR requests
 */
router.get('/dsarRequest/party/:partyId',
  verifyFirebaseToken,
  checkRole(['customer', 'csr', 'admin']),
  dsarController.getDSARRequestsByParty
);

/**
 * @swagger
 * /dsarRequest/{id}:
 *   get:
 *     summary: Get DSAR request by ID
 *     tags: [DSAR Management]
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
 *         description: DSAR request details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DSARRequest'
 */
router.get('/dsarRequest/:id',
  verifyFirebaseToken,
  checkRole(['customer', 'csr', 'admin']),
  dsarController.getDSARRequestById
);

/**
 * @swagger
 * /dsarRequest/{id}/status:
 *   patch:
 *     summary: Update DSAR request status
 *     tags: [DSAR Management]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed, rejected, cancelled]
 *               processingNotes:
 *                 type: string
 *               assignedTo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.patch('/dsarRequest/:id/status',
  verifyFirebaseToken,
  checkRole(['csr', 'admin']),
  validateRequest(updateStatusSchema),
  dsarController.updateDSARRequestStatus
);

/**
 * @swagger
 * /dsarRequest/{id}/process-access:
 *   post:
 *     summary: Process data access request
 *     tags: [DSAR Management]
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
 *         description: Data access request processed successfully
 */
router.post('/dsarRequest/:id/process-access',
  verifyFirebaseToken,
  checkRole(['csr', 'admin']),
  dsarController.processDataAccessRequest
);

/**
 * @swagger
 * /dsarRequest/{id}/process-erasure:
 *   post:
 *     summary: Process data erasure request
 *     tags: [DSAR Management]
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
 *             required:
 *               - confirmation
 *             properties:
 *               confirmation:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Data erasure request processed successfully
 */
router.post('/dsarRequest/:id/process-erasure',
  verifyFirebaseToken,
  checkRole(['admin']), // Only admins can process erasure requests
  dsarController.processDataErasureRequest
);

/**
 * @swagger
 * /dsarRequest:
 *   get:
 *     summary: Get all DSAR requests (admin/CSR only)
 *     tags: [DSAR Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, rejected, cancelled]
 *       - in: query
 *         name: requestType
 *         schema:
 *           type: string
 *           enum: [access, rectification, erasure, portability, objection, restriction, withdraw_consent]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, normal, high, urgent]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of all DSAR requests
 */
router.get('/dsarRequest',
  verifyFirebaseToken,
  checkRole(['csr', 'admin']),
  dsarController.getAllDSARRequests
);

/**
 * @swagger
 * /dsarRequest/reports/compliance:
 *   get:
 *     summary: Get DSAR compliance report
 *     tags: [DSAR Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: jurisdiction
 *         schema:
 *           type: string
 *           enum: [EU, LK, US, GLOBAL]
 *     responses:
 *       200:
 *         description: DSAR compliance report
 */
router.get('/dsarRequest/reports/compliance',
  verifyFirebaseToken,
  checkRole(['admin']),
  dsarController.getComplianceReport
);

module.exports = router;
