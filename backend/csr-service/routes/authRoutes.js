const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Verify Firebase ID token and sync user profile
router.post('/verify-token', authController.verifyToken);

// Create new user account
router.post('/users', authController.createUser);

// Update user profile
router.patch('/users/:uid', authController.updateUserProfile);

// Get user profile
router.get('/users/:uid', authController.getUserProfile);

// Revoke user sessions
router.post('/users/:uid/revoke-sessions', authController.revokeUserSessions);

// Delete user account
router.delete('/users/:uid', authController.deleteUser);

// List users (admin only)
router.get('/users', authController.listUsers);

module.exports = router;
