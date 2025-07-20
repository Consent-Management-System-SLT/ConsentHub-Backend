const express = require('express');
const router = express.Router();
const dsarController = require('../controllers/dsarController');
const { authenticateCustomer, customerRateLimit } = require('../middleware/auth');

// Apply rate limiting to all DSAR routes
router.use(customerRateLimit);

// Apply authentication to all routes
router.use(authenticateCustomer);

/**
 * @swagger
 * /api/v1/customer/dsar:
 *   get:
 *     summary: Get customer's DSAR requests
 *     tags: [Customer DSAR]
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
 *           enum: [submitted, in_progress, completed, cancelled]
 *         description: Filter by request status
 *       - in: query
 *         name: requestType
 *         schema:
 *           type: string
 *           enum: [access, correction, deletion, portability, objection, restriction]
 *         description: Filter by request type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: DSAR requests retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', dsarController.getDSARRequests);

/**
 * @swagger
 * /api/v1/customer/dsar/summary:
 *   get:
 *     summary: Get customer's DSAR request summary
 *     tags: [Customer DSAR]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: DSAR request summary retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/summary', dsarController.getDSARRequestSummary);

/**
 * @swagger
 * /api/v1/customer/dsar/types:
 *   get:
 *     summary: Get available DSAR request types
 *     tags: [Customer DSAR]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: DSAR request types retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/types', dsarController.getDSARRequestTypes);

/**
 * @swagger
 * /api/v1/customer/dsar:
 *   post:
 *     summary: Create new DSAR request
 *     tags: [Customer DSAR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requestType
 *               - category
 *               - description
 *             properties:
 *               requestType:
 *                 type: string
 *                 enum: [access, correction, deletion, portability, objection, restriction]
 *                 description: Type of DSAR request
 *               category:
 *                 type: string
 *                 description: Category of the request
 *               description:
 *                 type: string
 *                 description: Description of the request
 *               details:
 *                 type: string
 *                 description: Additional details
 *     responses:
 *       201:
 *         description: DSAR request created successfully
 *       400:
 *         description: Validation error or existing pending request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', dsarController.createDSARRequest);

/**
 * @swagger
 * /api/v1/customer/dsar/{id}:
 *   get:
 *     summary: Get specific DSAR request by ID
 *     tags: [Customer DSAR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: DSAR request ID
 *     responses:
 *       200:
 *         description: DSAR request retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: DSAR request not found
 *       500:
 *         description: Server error
 */
router.get('/:id', dsarController.getDSARRequestById);

/**
 * @swagger
 * /api/v1/customer/dsar/{id}/cancel:
 *   post:
 *     summary: Cancel DSAR request
 *     tags: [Customer DSAR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: DSAR request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
 *     responses:
 *       200:
 *         description: DSAR request cancelled successfully
 *       400:
 *         description: Cannot cancel request in current status
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: DSAR request not found
 *       500:
 *         description: Server error
 */
router.post('/:id/cancel', dsarController.cancelDSARRequest);

/**
 * @swagger
 * /api/v1/customer/dsar/{id}/history:
 *   get:
 *     summary: Get DSAR request history
 *     tags: [Customer DSAR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: DSAR request ID
 *     responses:
 *       200:
 *         description: DSAR request history retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: DSAR request not found
 *       500:
 *         description: Server error
 */
router.get('/:id/history', dsarController.getDSARRequestHistory);

module.exports = router;
