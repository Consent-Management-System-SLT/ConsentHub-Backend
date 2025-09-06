const express = require('express');
const router = express.Router();
const vasController = require('../controllers/vasController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth.authenticateCustomer);

// GET /api/customer/vas/services - Get all VAS services
router.get('/services', vasController.getVASServices);

// POST /api/customer/vas/services/:serviceId/toggle - Toggle service subscription
router.post('/services/:serviceId/toggle', vasController.toggleVASSubscription);

// GET /api/customer/vas/history - Get subscription history
router.get('/history', vasController.getVASSubscriptionHistory);

// GET /api/customer/vas/services/:serviceId - Get service details
router.get('/services/:serviceId', vasController.getVASServiceDetails);

module.exports = router;
