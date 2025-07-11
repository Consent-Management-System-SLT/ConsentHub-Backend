const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../../shared/middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         uid:
 *           type: string
 *           description: Firebase UID
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         emailVerified:
 *           type: boolean
 *           description: Whether email is verified
 *         phoneNumber:
 *           type: string
 *           description: User phone number
 *         phoneVerified:
 *           type: boolean
 *           description: Whether phone is verified
 *         displayName:
 *           type: string
 *           description: User display name
 *         photoURL:
 *           type: string
 *           description: User profile photo URL
 *         partyId:
 *           type: string
 *           description: Reference to party in party-service
 *         role:
 *           type: string
 *           enum: [customer, csr, admin]
 *           description: User role
 *         status:
 *           type: string
 *           enum: [active, inactive, suspended, pending_verification]
 *           description: Account status
 *         preferences:
 *           type: object
 *           properties:
 *             language:
 *               type: string
 *               default: en
 *             timezone:
 *               type: string
 *               default: Asia/Colombo
 *             notificationChannels:
 *               type: object
 *               properties:
 *                 email:
 *                   type: boolean
 *                 sms:
 *                   type: boolean
 *                 push:
 *                   type: boolean
 *         lastLoginAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *     TokenVerificationRequest:
 *       type: object
 *       required:
 *         - idToken
 *       properties:
 *         idToken:
 *           type: string
 *           description: Firebase ID token
 *     CreateUserRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *         displayName:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         role:
 *           type: string
 *           enum: [customer, csr, admin]
 *           default: customer
 */

/**
 * @swagger
 * /api/v1/auth/verify-token:
 *   post:
 *     summary: Verify Firebase ID token
 *     description: Verifies a Firebase ID token and returns user information
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TokenVerificationRequest'
 *           example:
 *             idToken: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Token verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/UserProfile'
 *                 customClaims:
 *                   type: object
 *       400:
 *         description: Missing token
 *       401:
 *         description: Invalid or expired token
 */
router.post('/verify-token', authController.verifyToken);

/**
 * @swagger
 * /api/v1/auth/users:
 *   post:
 *     summary: Create new user account
 *     description: Creates a new user account (admin only for CSR/admin roles)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *           example:
 *             email: "john@example.com"
 *             password: "securePassword123"
 *             displayName: "John Doe"
 *             phoneNumber: "+94771234567"
 *             role: "customer"
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Insufficient permissions
 *       409:
 *         description: Email already exists
 */
router.post('/users', authenticateToken, authController.createUser);

/**
 * @swagger
 * /api/v1/auth/users/{uid}:
 *   get:
 *     summary: Get user profile
 *     description: Retrieves user profile information
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: Firebase UID
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
router.get('/users/:uid', authenticateToken, authController.getUserProfile);

/**
 * @swagger
 * /api/v1/auth/users/{uid}:
 *   patch:
 *     summary: Update user profile
 *     description: Updates user profile information
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: Firebase UID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [customer, csr, admin]
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended, pending_verification]
 *               preferences:
 *                 type: object
 *           example:
 *             displayName: "John Smith"
 *             preferences:
 *               language: "en"
 *               notificationChannels:
 *                 email: true
 *                 sms: false
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
router.patch('/users/:uid', authenticateToken, authController.updateUserProfile);

/**
 * @swagger
 * /api/v1/auth/users/{uid}:
 *   delete:
 *     summary: Delete user account
 *     description: Deletes a user account (admin only)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: Firebase UID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
router.delete('/users/:uid', authenticateToken, authController.deleteUser);

/**
 * @swagger
 * /api/v1/auth/users:
 *   get:
 *     summary: List users
 *     description: Retrieves a list of users (admin only)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of items to skip
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of items to return
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [customer, csr, admin]
 *         description: Filter by role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended, pending_verification]
 *         description: Filter by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by email or display name
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalCount:
 *                   type: integer
 *                 rangeStart:
 *                   type: integer
 *                 rangeEnd:
 *                   type: integer
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserProfile'
 *       403:
 *         description: Insufficient permissions
 */
router.get('/users', authenticateToken, authController.listUsers);

/**
 * @swagger
 * /api/v1/auth/users/{uid}/revoke-sessions:
 *   post:
 *     summary: Revoke user sessions
 *     description: Revokes all refresh tokens for a user
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: Firebase UID
 *     responses:
 *       200:
 *         description: Sessions revoked successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
router.post('/users/:uid/revoke-sessions', authenticateToken, authController.revokeUserSessions);

// Initialize Firebase (should be called on startup)
router.post('/initialize', async (req, res) => {
  const result = await authController.initializeFirebase();
  if (result.success) {
    res.json({ success: true, message: 'Firebase initialized successfully' });
  } else {
    res.status(500).json({ success: false, error: result.error });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    firebase: {
      initialized: require('firebase-admin').apps.length > 0
    }
  });
});

module.exports = router;
