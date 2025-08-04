const express = require('express');
const router = express.Router();
const consentController = require('../controllers/consentController');

// Get all consents with filters, pagination, sorting
router.get('/', consentController.listConsents);

// Get a consent by ID
router.get('/:id', consentController.getConsentById);

// Create a new consent
router.post('/', consentController.createConsent);

// Update an existing consent by ID
router.patch('/:id', consentController.updateConsent);

// Delete a consent by ID
router.delete('/:id', consentController.deleteConsent);

// Get consents by partyId
router.get('/party/:partyId', consentController.listConsentsByParty);

module.exports = router;
