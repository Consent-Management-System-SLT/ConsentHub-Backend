const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');

// Get list of audit logs with filters, pagination, sorting
router.get('/', auditLogController.listAuditLogs);

// Get a single audit log by ID
router.get('/:id', auditLogController.getAuditLogById);

// Get audit logs filtered by partyId with filters, pagination, sorting
router.get('/party/:partyId', auditLogController.listAuditLogsByParty);

// Get distinct event types
router.get('/events', auditLogController.getEventTypes);

// Get audit logs statistics
router.get('/statistics', auditLogController.getAuditStatistics);

// Search audit logs with query string
router.get('/search', auditLogController.searchAuditLogs);

// Export audit logs as JSON or CSV
router.get('/export', auditLogController.exportAuditLogs);

module.exports = router;
