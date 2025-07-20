const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateCustomer, customerRateLimit } = require('../middleware/auth');

// Apply rate limiting to all dashboard routes
router.use(customerRateLimit);

// Apply authentication to all routes
router.use(authenticateCustomer);

/**
 * @swagger
 * /api/v1/customer/dashboard/overview:
 *   get:
 *     summary: Get customer dashboard overview
 *     tags: [Customer Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard overview retrieved successfully
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
 *                     customer:
 *                       type: object
 *                     statistics:
 *                       type: object
 *                     recentActivity:
 *                       type: array
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/overview', dashboardController.getDashboardOverview);

/**
 * @swagger
 * /api/v1/customer/dashboard/profile:
 *   get:
 *     summary: Get customer profile
 *     tags: [Customer Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.get('/profile', dashboardController.getCustomerProfile);

/**
 * @swagger
 * /api/v1/customer/dashboard/profile:
 *   put:
 *     summary: Update customer profile
 *     tags: [Customer Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               contactMedium:
 *                 type: array
 *               characteristic:
 *                 type: array
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.put('/profile', dashboardController.updateCustomerProfile);

/**
 * @swagger
 * /api/v1/customer/dashboard/activity:
 *   get:
 *     summary: Get customer activity history
 *     tags: [Customer Dashboard]
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
 *     responses:
 *       200:
 *         description: Activity history retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/activity', dashboardController.getActivityHistory);

/**
 * @swagger
 * /api/v1/customer/dashboard/summary:
 *   get:
 *     summary: Get customer summary
 *     tags: [Customer Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer summary retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.get('/summary', dashboardController.getCustomerSummary);

module.exports = router;
