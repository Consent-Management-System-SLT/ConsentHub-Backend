const express = require('express');
const router = express.Router();
const partyController = require('../controllers/partyController');

// Get all parties with filters, pagination, sorting
router.get('/', partyController.getAllParties);

// 🔍 Search parties by id, name, email, phone, or mobile
router.get('/search', partyController.searchParties);

// Get a party by ID
router.get('/:id', partyController.getPartyById);

// Create a new party
router.post('/', partyController.createParty);

// Update a party by ID
router.patch('/:id', partyController.updateParty);

// Delete a party by ID
router.delete('/:id', partyController.deleteParty);

module.exports = router;
