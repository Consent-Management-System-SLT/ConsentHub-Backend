const express = require('express');
const router = express.Router();
const dsarController = require('../controllers/dsarController');

// Get all DSAR requests with filters, pagination, sorting
router.get('/', dsarController.listDSARRequests);

// Get a DSAR request by ID
router.get('/:id', dsarController.getDSARRequestById);

// Create a new DSAR request
router.post('/', dsarController.createDSARRequest);

// Update a DSAR request by ID
router.patch('/:id', dsarController.updateDSARRequest);

// Delete a DSAR request by ID
router.delete('/:id', dsarController.deleteDSARRequest);

// Get DSAR requests by partyId
router.get('/party/:partyId', dsarController.listDSARRequestsByParty);

module.exports = router;
