const express = require('express');
const router = express.Router();
const privacyNoticeController = require('../controllers/privacyNoticeController');
const { verifyFirebaseToken, checkRole } = require('../../shared/auth');
const Joi = require('joi');

// Validation schemas
const createPrivacyNoticeSchema = Joi.object({
  version: Joi.string().optional(),
  title: Joi.string().required(),
  description: Joi.string().optional(),
  content: Joi.string().required(),
  contentType: Joi.string().valid('text/plain', 'text/html', 'text/markdown').optional(),
  category: Joi.string().valid('general', 'marketing', 'analytics', 'cookies', 'third-party', 'location', 'children').required(),
  purposes: Joi.array().items(Joi.string()).optional(),
  legalBasis: Joi.string().valid('consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests').required(),
  dataCategories: Joi.array().items(Joi.string()).optional(),
  recipients: Joi.array().items(Joi.object()).optional(),
  retentionPeriod: Joi.object().optional(),
  rights: Joi.array().items(Joi.string()).optional(),
  contactInfo: Joi.object().optional(),
  effectiveDate: Joi.date().optional(),
  expirationDate: Joi.date().optional(),
  status: Joi.string().valid('draft', 'active', 'inactive', 'archived').optional(),
  language: Joi.string().valid('en', 'si', 'ta').optional(),
  geoScope: Joi.array().items(Joi.string()).optional(),
  productScope: Joi.array().items(Joi.string()).optional(),
  parentNoticeId: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
});

const createVersionSchema = Joi.object({
  version: Joi.string().required(),
  changes: Joi.string().required(),
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
 *     PrivacyNotice:
 *       type: object
 *       required:
 *         - id
 *         - version
 *         - title
 *         - content
 *         - category
 *         - legalBasis
 *         - effectiveDate
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the privacy notice
 *         version:
 *           type: string
 *           description: Version number (semantic versioning)
 *         title:
 *           type: string
 *           description: Title of the privacy notice
 *         description:
 *           type: string
 *           description: Brief description
 *         content:
 *           type: string
 *           description: Full content of the privacy notice
 *         category:
 *           type: string
 *           enum: [general, marketing, analytics, cookies, third-party, location, children]
 *           description: Category of the privacy notice
 *         status:
 *           type: string
 *           enum: [draft, active, inactive, archived]
 *           description: Current status
 *         effectiveDate:
 *           type: string
 *           format: date-time
 *           description: When the notice becomes effective
 *         expirationDate:
 *           type: string
 *           format: date-time
 *           description: When the notice expires
 */

/**
 * @swagger
 * /privacyNotice:
 *   post:
 *     summary: Create a new privacy notice
 *     tags: [Privacy Notice]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PrivacyNotice'
 *     responses:
 *       201:
 *         description: Privacy notice created successfully
 */
router.post('/privacyNotice',
  verifyFirebaseToken,
  checkRole(['admin', 'csr']),
  validateRequest(createPrivacyNoticeSchema),
  privacyNoticeController.createPrivacyNotice
);

/**
 * @swagger
 * /privacyNotice:
 *   get:
 *     summary: Get all privacy notices
 *     tags: [Privacy Notice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: language
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
 *         description: List of privacy notices
 */
router.get('/privacyNotice',
  verifyFirebaseToken,
  checkRole(['customer', 'csr', 'admin']),
  privacyNoticeController.getPrivacyNotices
);

/**
 * @swagger
 * /privacyNotice/{id}:
 *   get:
 *     summary: Get privacy notice by ID
 *     tags: [Privacy Notice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeContent
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Privacy notice details
 */
router.get('/privacyNotice/:id',
  verifyFirebaseToken,
  checkRole(['customer', 'csr', 'admin']),
  privacyNoticeController.getPrivacyNoticeById
);

/**
 * @swagger
 * /privacyNotice/active/{category}:
 *   get:
 *     summary: Get active privacy notice by category
 *     tags: [Privacy Notice]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           default: en
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *       - in: query
 *         name: geoLocation
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Active privacy notice
 */
router.get('/privacyNotice/active/:category',
  privacyNoticeController.getActiveNoticeByCategory
);

/**
 * @swagger
 * /privacyNotice/{id}:
 *   patch:
 *     summary: Update privacy notice
 *     tags: [Privacy Notice]
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
 *         description: Privacy notice updated successfully
 */
router.patch('/privacyNotice/:id',
  verifyFirebaseToken,
  checkRole(['admin', 'csr']),
  privacyNoticeController.updatePrivacyNotice
);

/**
 * @swagger
 * /privacyNotice/{id}/version:
 *   post:
 *     summary: Create new version of privacy notice
 *     tags: [Privacy Notice]
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
 *               version:
 *                 type: string
 *               changes:
 *                 type: string
 *     responses:
 *       201:
 *         description: New version created successfully
 */
router.post('/privacyNotice/:id/version',
  verifyFirebaseToken,
  checkRole(['admin', 'csr']),
  validateRequest(createVersionSchema),
  privacyNoticeController.createVersion
);

/**
 * @swagger
 * /privacyNotice/{id}/approve:
 *   patch:
 *     summary: Approve privacy notice
 *     tags: [Privacy Notice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: Privacy notice approved successfully
 */
router.patch('/privacyNotice/:id/approve',
  verifyFirebaseToken,
  checkRole(['admin']),
  privacyNoticeController.approvePrivacyNotice
);

/**
 * @swagger
 * /privacyNotice/{id}/activate:
 *   patch:
 *     summary: Activate privacy notice
 *     tags: [Privacy Notice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               effectiveDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Privacy notice activated successfully
 */
router.patch('/privacyNotice/:id/activate',
  verifyFirebaseToken,
  checkRole(['admin']),
  privacyNoticeController.activatePrivacyNotice
);

/**
 * @swagger
 * /privacyNotice/{id}/versions:
 *   get:
 *     summary: Get version history
 *     tags: [Privacy Notice]
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
 *         description: Version history
 */
router.get('/privacyNotice/:id/versions',
  verifyFirebaseToken,
  checkRole(['admin', 'csr']),
  privacyNoticeController.getVersionHistory
);

module.exports = router;
