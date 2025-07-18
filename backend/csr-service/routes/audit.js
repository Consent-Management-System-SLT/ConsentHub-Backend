const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { logger } = require('../../shared/utils');

/**
 * @swagger
 * /api/v1/audit:
 *   get:
 *     summary: Get audit logs
 *     tags: [Audit]
 *     parameters:
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *         description: Filter by event type
 *       - in: query
 *         name: partyId
 *         schema:
 *           type: string
 *         description: Filter by party ID
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *         description: Filter by resource type (consent, party, preference, dsar)
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: actorType
 *         schema:
 *           type: string
 *         description: Filter by actor type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of results to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of results to skip
 *     responses:
 *       200:
 *         description: List of audit logs
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const { 
      eventType, 
      partyId, 
      resourceType, 
      action, 
      actorType, 
      startDate, 
      endDate, 
      limit = 100, 
      offset = 0 
    } = req.query;
    
    let query = {};
    
    // Add filters
    if (eventType) query.eventType = eventType;
    if (partyId) query.partyId = partyId;
    if (resourceType) query.resourceType = resourceType;
    if (action) query.action = action;
    if (actorType) query.actorType = actorType;
    
    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const logs = await AuditLog.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ timestamp: -1 });
    
    const total = await AuditLog.countDocuments(query);
    
    res.json({
      logs,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

/**
 * @swagger
 * /api/v1/audit/{id}:
 *   get:
 *     summary: Get audit log by ID
 *     tags: [Audit]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Audit log ID
 *     responses:
 *       200:
 *         description: Audit log details
 *       404:
 *         description: Audit log not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
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
});

/**
 * @swagger
 * /api/v1/audit/party/{partyId}:
 *   get:
 *     summary: Get audit logs by party ID
 *     tags: [Audit]
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Party ID
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *         description: Filter by event type
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *         description: Filter by resource type
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of results to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of results to skip
 *     responses:
 *       200:
 *         description: Audit logs for the party
 *       500:
 *         description: Server error
 */
router.get('/party/:partyId', async (req, res) => {
  try {
    const { 
      eventType, 
      resourceType, 
      action, 
      startDate, 
      endDate, 
      limit = 100, 
      offset = 0 
    } = req.query;
    
    let query = { partyId: req.params.partyId };
    
    // Add filters
    if (eventType) query.eventType = eventType;
    if (resourceType) query.resourceType = resourceType;
    if (action) query.action = action;
    
    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const logs = await AuditLog.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ timestamp: -1 });
    
    const total = await AuditLog.countDocuments(query);
    
    res.json({
      logs,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Error fetching party audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch party audit logs' });
  }
});

/**
 * @swagger
 * /api/v1/audit/events:
 *   get:
 *     summary: Get audit event types
 *     tags: [Audit]
 *     responses:
 *       200:
 *         description: List of available event types
 *       500:
 *         description: Server error
 */
router.get('/events', async (req, res) => {
  try {
    const eventTypes = await AuditLog.distinct('eventType');
    res.json({ eventTypes });
  } catch (error) {
    logger.error('Error fetching event types:', error);
    res.status(500).json({ error: 'Failed to fetch event types' });
  }
});

/**
 * @swagger
 * /api/v1/audit/statistics:
 *   get:
 *     summary: Get audit statistics
 *     tags: [Audit]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date
 *     responses:
 *       200:
 *         description: Audit statistics
 *       500:
 *         description: Server error
 */
router.get('/statistics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = {};
    
    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const [
      totalLogs,
      eventsByType,
      eventsByAction,
      eventsByResourceType,
      eventsByActorType,
      recentActivity
    ] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.aggregate([
        { $match: query },
        { $group: { _id: '$eventType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      AuditLog.aggregate([
        { $match: query },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      AuditLog.aggregate([
        { $match: query },
        { $group: { _id: '$resourceType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      AuditLog.aggregate([
        { $match: query },
        { $group: { _id: '$actorType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      AuditLog.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 30 }
      ])
    ]);
    
    res.json({
      totalLogs,
      eventsByType: eventsByType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      eventsByAction: eventsByAction.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      eventsByResourceType: eventsByResourceType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      eventsByActorType: eventsByActorType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentActivity: recentActivity.map(item => ({
        date: item._id,
        count: item.count
      }))
    });
  } catch (error) {
    logger.error('Error fetching audit statistics:', error);
    res.status(500).json({ error: 'Failed to fetch audit statistics' });
  }
});

/**
 * @swagger
 * /api/v1/audit/search:
 *   get:
 *     summary: Search audit logs
 *     tags: [Audit]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of results to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of results to skip
 *     responses:
 *       200:
 *         description: Search results
 *       500:
 *         description: Server error
 */
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 50, offset = 0 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const query = {
      $or: [
        { eventType: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { partyId: { $regex: q, $options: 'i' } },
        { resourceId: { $regex: q, $options: 'i' } },
        { resourceType: { $regex: q, $options: 'i' } }
      ]
    };
    
    const logs = await AuditLog.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ timestamp: -1 });
    
    const total = await AuditLog.countDocuments(query);
    
    res.json({
      logs,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      query: q
    });
  } catch (error) {
    logger.error('Error searching audit logs:', error);
    res.status(500).json({ error: 'Failed to search audit logs' });
  }
});

/**
 * @swagger
 * /api/v1/audit/export:
 *   get:
 *     summary: Export audit logs
 *     tags: [Audit]
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *         description: Export format
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *         description: Filter by event type
 *       - in: query
 *         name: partyId
 *         schema:
 *           type: string
 *         description: Filter by party ID
 *     responses:
 *       200:
 *         description: Exported audit logs
 *       500:
 *         description: Server error
 */
router.get('/export', async (req, res) => {
  try {
    const { format = 'json', startDate, endDate, eventType, partyId } = req.query;
    
    let query = {};
    
    // Add filters
    if (eventType) query.eventType = eventType;
    if (partyId) query.partyId = partyId;
    
    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(10000); // Limit to prevent memory issues
    
    if (format === 'csv') {
      const csvHeaders = [
        'ID',
        'Event Type',
        'Party ID',
        'Actor Type',
        'Resource Type',
        'Resource ID',
        'Action',
        'Description',
        'Timestamp',
        'IP Address',
        'User Agent'
      ];
      
      const csvRows = logs.map(log => [
        log.id,
        log.eventType,
        log.partyId || '',
        log.actorType || '',
        log.resourceType || '',
        log.resourceId || '',
        log.action || '',
        log.description || '',
        log.timestamp.toISOString(),
        log.ipAddress || '',
        log.userAgent || ''
      ]);
      
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.json"`);
      res.json(logs);
    }
  } catch (error) {
    logger.error('Error exporting audit logs:', error);
    res.status(500).json({ error: 'Failed to export audit logs' });
  }
});

module.exports = router;
