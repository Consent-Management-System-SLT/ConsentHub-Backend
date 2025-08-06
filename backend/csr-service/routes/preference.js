// routes/preferenceRoutes.js
const express = require('express');
const router = express.Router();
const preferenceController = require('../controllers/preferenceController');

// ✅ Get preferences by partyId (important: place above /:id to avoid conflict)
router.get('/party/:partyId', preferenceController.getPreferenceByPartyId);

// ✅ Create or update preference by partyId
router.post('/party/:partyId', preferenceController.createOrUpdatePreferenceByPartyId);

// ✅ Get all preferences with filters, pagination, etc.
router.get('/', preferenceController.getAllPreferences);

// ✅ Get a preference by ID
router.get('/:id', preferenceController.getPreferenceById);

// ✅ Create a new preference
router.post('/', preferenceController.createPreference);

// ✅ Update a preference by ID (PUT or PATCH based on your logic)
router.put('/:id', preferenceController.updatePreference); // or use .patch()

// ✅ Delete a preference by ID
router.delete('/:id', preferenceController.deletePreference);

module.exports = router;
