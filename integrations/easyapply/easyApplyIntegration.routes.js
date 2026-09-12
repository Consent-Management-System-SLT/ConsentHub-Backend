const express = require('express');
const router = express.Router();
const controller = require('./easyApplyIntegration.controller');
const { authenticateIntegration } = require('./easyApplyIntegration.middleware');

// Apply authentication middleware to all routes in this integration
router.use(authenticateIntegration);

// Health check specific to integration
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'consenthub-easyapply-integration'
  });
});

// Party resolution
router.post('/parties/resolve', controller.resolveParty);

// Active privacy notices
router.get('/privacy-notices/active', controller.getActivePrivacyNotice);

// Capture consent
router.post('/consents', controller.captureConsents);

// Get customer consents
router.get('/parties/:externalCustomerId/consents', controller.getCustomerConsents);

// Update/Revoke consent
router.patch('/consents/:consentId', controller.updateConsent);
router.patch('/consents/:consentId/revoke', controller.revokeConsent);

module.exports = router;
