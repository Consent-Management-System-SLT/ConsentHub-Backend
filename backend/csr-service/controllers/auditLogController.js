const AuditLog = require('../models/AuditLog');
const { logger } = require('../../shared/utils');

exports.getAuditLogs = async (req, res) => {
  try {
    const { partyId, eventType, action, resourceType, limit = 50, offset = 0 } = req.query;

    let query = {};
    if (partyId) query.partyId = partyId;
    if (eventType) query.eventType = eventType;
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;

    const logs = await AuditLog.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });

    const total = await AuditLog.countDocuments(query);

    res.json({ logs, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    logger.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

exports.getAuditLogById = async (req, res) => {
  try {
    const log = await AuditLog.findOne({ id: req.params.id });
    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' });
    }
    res.json(log);
  } catch (error) {
    logger.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
};
