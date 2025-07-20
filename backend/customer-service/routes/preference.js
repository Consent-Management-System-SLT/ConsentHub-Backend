const express = require('express');
const router = express.Router();
const preferenceController = require('../controllers/preferenceController');
const { authenticateCustomer, customerRateLimit } = require('../middleware/auth');

// Apply rate limiting to all preference routes
router.use(customerRateLimit);

// Apply authentication to all routes
router.use(authenticateCustomer);

/**
 * @swagger
 * /api/v1/customer/preferences:
 *   get:
 *     summary: Get customer's preferences
 *     tags: [Customer Preferences]
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
 *         name: preferenceType
 *         schema:
 *           type: string
 *         description: Filter by preference type
 *       - in: query
 *         name: channelType
 *         schema:
 *           type: string
 *         description: Filter by channel type
 *       - in: query
 *         name: isAllowed
 *         schema:
 *           type: boolean
 *         description: Filter by allowed status
 *     responses:
 *       200:
 *         description: Preferences retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', preferenceController.getPreferences);

/**
 * @swagger
 * /api/v1/customer/preferences/summary:
 *   get:
 *     summary: Get customer's preference summary
 *     tags: [Customer Preferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Preference summary retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/summary', preferenceController.getPreferenceSummary);

/**
 * @swagger
 * /api/v1/customer/preferences/by-channel:
 *   get:
 *     summary: Get preferences organized by channel
 *     tags: [Customer Preferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Preferences by channel retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/by-channel', preferenceController.getPreferencesByChannel);

/**
 * @swagger
 * /api/v1/customer/preferences:
 *   post:
 *     summary: Create or update preference
 *     tags: [Customer Preferences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - preferenceType
 *               - channelType
 *               - isAllowed
 *             properties:
 *               preferenceType:
 *                 type: string
 *                 description: Type of preference
 *               channelType:
 *                 type: string
 *                 description: Communication channel
 *               isAllowed:
 *                 type: boolean
 *                 description: Whether the preference is allowed
 *               description:
 *                 type: string
 *                 description: Description of the preference
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
 *         description: Preference created successfully
 *       200:
 *         description: Preference updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', preferenceController.createOrUpdatePreference);

/**
 * @swagger
 * /api/v1/customer/preferences/{id}:
 *   get:
 *     summary: Get specific preference by ID
 *     tags: [Customer Preferences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Preference ID
 *     responses:
 *       200:
 *         description: Preference retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Preference not found
 *       500:
 *         description: Server error
 */
router.get('/:id', preferenceController.getPreferenceById);

/**
 * @swagger
 * /api/v1/customer/preferences/{id}:
 *   put:
 *     summary: Update preference
 *     tags: [Customer Preferences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Preference ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isAllowed:
 *                 type: boolean
 *                 description: Whether the preference is allowed
 *               description:
 *                 type: string
 *                 description: Description of the preference
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
 *       200:
 *         description: Preference updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Preference not found
 *       500:
 *         description: Server error
 */
router.put('/:id', preferenceController.updatePreference);

/**
 * @swagger
 * /api/v1/customer/preferences/{id}:
 *   delete:
 *     summary: Delete preference
 *     tags: [Customer Preferences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Preference ID
 *     responses:
 *       200:
 *         description: Preference deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Preference not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', preferenceController.deletePreference);

module.exports = router;
