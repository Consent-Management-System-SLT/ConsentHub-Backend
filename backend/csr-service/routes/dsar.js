const express = require('express');
const router = express.Router();
const DSAR = require('../models/DSAR');
const Party = require('../models/Party');
const AuditLog = require('../models/AuditLog');
const { logger } = require('../../shared/utils');

/**
 * @swagger
 * /api/v1/dsar:
 *   get:
 *     summary: Get all DSAR requests
 *     tags: [DSAR]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in-progress, completed, rejected]
 *         description: Filter by status
 *       - in: query
 *         name: requestType
 *         schema:
 *           type: string
 *           enum: [access, rectification, erasure, portability, restriction, objection]
 *         description: Filter by request type
 *       - in: query
 *         name: partyId
 *         schema:
 *           type: string
 *         description: Filter by party ID
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by priority
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
 *         description: List of DSAR requests
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const { status, requestType, partyId, priority, limit = 50, offset = 0 } = req.query;
    
    let query = {};
    
    // Add filters
    if (status) query.status = status;
    if (requestType) query.requestType = requestType;
    if (partyId) query.partyId = partyId;
    if (priority) query.priority = priority;
    
    const requests = await DSAR.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });
    
    const total = await DSAR.countDocuments(query);
    
    res.json({
      requests,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Error fetching DSAR requests:', error);
    res.status(500).json({ error: 'Failed to fetch DSAR requests' });
  }
});

/**
 * @swagger
 * /api/v1/dsar/{id}:
 *   get:
 *     summary: Get DSAR request by ID
 *     tags: [DSAR]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: DSAR request ID
 *     responses:
 *       200:
 *         description: DSAR request details
 *       404:
 *         description: DSAR request not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const request = await DSAR.findOne({ id: req.params.id });
    
    if (!request) {
      return res.status(404).json({ error: 'DSAR request not found' });
    }
    
    res.json(request);
  } catch (error) {
    logger.error('Error fetching DSAR request:', error);
    res.status(500).json({ error: 'Failed to fetch DSAR request' });
  }
});

/**
 * @swagger
 * /api/v1/dsar:
 *   post:
 *     summary: Create new DSAR request
 *     tags: [DSAR]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - partyId
 *               - requestType
 *               - description
 *             properties:
 *               partyId:
 *                 type: string
 *               requestType:
 *                 type: string
 *                 enum: [access, rectification, erasure, portability, restriction, objection]
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               specificData:
 *                 type: array
 *                 items:
 *                   type: string
 *               additionalInfo:
 *                 type: string
 *               requestorType:
 *                 type: string
 *                 enum: [data_subject, legal_guardian, authorized_representative]
 *               verificationMethod:
 *                 type: string
 *                 enum: [email, phone, document, in_person]
 *               legalBasis:
 *                 type: string
 *                 enum: [gdpr_art_15, gdpr_art_16, gdpr_art_17, gdpr_art_18, gdpr_art_20, gdpr_art_21, ccpa, other]
 *     responses:
 *       201:
 *         description: DSAR request created successfully
 *       400:
 *         description: Invalid data
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
  try {
    // Verify party exists
    const party = await Party.findOne({ id: req.body.partyId });
    if (!party) {
      return res.status(400).json({ error: 'Party not found' });
    }
    
    const request = new DSAR(req.body);
    await request.save();
    
    // Log the creation
    await AuditLog.logEvent({
      eventType: 'dsar_created',
      partyId: request.partyId,
      actorType: 'csr',
      resourceId: request.id,
      resourceType: 'dsar',
      action: 'create',
      description: `DSAR request created: ${request.requestType} for party ${party.name}`,
      details: {
        requestId: request.id,
        partyId: request.partyId,
        requestType: request.requestType,
        priority: request.priority,
        status: request.status
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      source: 'csr'
    });
    
    res.status(201).json(request);
  } catch (error) {
    logger.error('Error creating DSAR request:', error);
    res.status(500).json({ error: 'Failed to create DSAR request' });
  }
});

/**
 * @swagger
 * /api/v1/dsar/{id}:
 *   put:
 *     summary: Update DSAR request
 *     tags: [DSAR]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: DSAR request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in-progress, completed, rejected]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               description:
 *                 type: string
 *               assignedTo:
 *                 type: string
 *               notes:
 *                 type: string
 *               resolutionNotes:
 *                 type: string
 *               estimatedCompletionDate:
 *                 type: string
 *                 format: date-time
 *               actualCompletionDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: DSAR request updated successfully
 *       404:
 *         description: DSAR request not found
 *       500:
 *         description: Server error
 */
router.put('/:id', async (req, res) => {
  try {
    const oldRequest = await DSAR.findOne({ id: req.params.id });
    
    if (!oldRequest) {
      return res.status(404).json({ error: 'DSAR request not found' });
    }
    
    const updatedRequest = await DSAR.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    // Log the update
    await AuditLog.logEvent({
      eventType: 'dsar_updated',
      partyId: updatedRequest.partyId,
      actorType: 'csr',
      resourceId: updatedRequest.id,
      resourceType: 'dsar',
      action: 'update',
      description: `DSAR request updated: ${updatedRequest.requestType}`,
      oldValues: oldRequest.toJSON(),
      newValues: updatedRequest.toJSON(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      source: 'csr'
    });
    
    res.json(updatedRequest);
  } catch (error) {
    logger.error('Error updating DSAR request:', error);
    res.status(500).json({ error: 'Failed to update DSAR request' });
  }
});

/**
 * @swagger
 * /api/v1/dsar/{id}:
 *   delete:
 *     summary: Delete DSAR request
 *     tags: [DSAR]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: DSAR request ID
 *     responses:
 *       204:
 *         description: DSAR request deleted successfully
 *       404:
 *         description: DSAR request not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req, res) => {
  try {
    const request = await DSAR.findOne({ id: req.params.id });
    
    if (!request) {
      return res.status(404).json({ error: 'DSAR request not found' });
    }
    
    await DSAR.findOneAndDelete({ id: req.params.id });
    
    // Log the deletion
    await AuditLog.logEvent({
      eventType: 'dsar_deleted',
      partyId: request.partyId,
      actorType: 'csr',
      resourceId: request.id,
      resourceType: 'dsar',
      action: 'delete',
      description: `DSAR request deleted: ${request.requestType}`,
      details: request.toJSON(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      source: 'csr'
    });
    
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting DSAR request:', error);
    res.status(500).json({ error: 'Failed to delete DSAR request' });
  }
});

/**
 * @swagger
 * /api/v1/dsar/{id}/status:
 *   patch:
 *     summary: Update DSAR request status
 *     tags: [DSAR]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: DSAR request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in-progress, completed, rejected]
 *               notes:
 *                 type: string
 *               resolutionNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: DSAR request status updated successfully
 *       404:
 *         description: DSAR request not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, notes, resolutionNotes } = req.body;
    
    const oldRequest = await DSAR.findOne({ id: req.params.id });
    
    if (!oldRequest) {
      return res.status(404).json({ error: 'DSAR request not found' });
    }
    
    const updateData = { status };
    if (notes) updateData.notes = notes;
    if (resolutionNotes) updateData.resolutionNotes = resolutionNotes;
    
    // If status is completed, set completion date
    if (status === 'completed') {
      updateData.actualCompletionDate = new Date();
    }
    
    const updatedRequest = await DSAR.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true, runValidators: true }
    );
    
    // Log the status change
    await AuditLog.logEvent({
      eventType: 'dsar_status_changed',
      partyId: updatedRequest.partyId,
      actorType: 'csr',
      resourceId: updatedRequest.id,
      resourceType: 'dsar',
      action: 'status_change',
      description: `DSAR request status changed from ${oldRequest.status} to ${status}`,
      details: {
        requestId: updatedRequest.id,
        oldStatus: oldRequest.status,
        newStatus: status,
        notes: notes,
        resolutionNotes: resolutionNotes
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      source: 'csr'
    });
    
    res.json(updatedRequest);
  } catch (error) {
    logger.error('Error updating DSAR request status:', error);
    res.status(500).json({ error: 'Failed to update DSAR request status' });
  }
});

/**
 * @swagger
 * /api/v1/dsar/party/{partyId}:
 *   get:
 *     summary: Get DSAR requests by party ID
 *     tags: [DSAR]
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Party ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in-progress, completed, rejected]
 *         description: Filter by status
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
 *         description: DSAR requests for the party
 *       500:
 *         description: Server error
 */
router.get('/party/:partyId', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    let query = { partyId: req.params.partyId };
    if (status) query.status = status;
    
    const requests = await DSAR.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });
    
    const total = await DSAR.countDocuments(query);
    
    res.json({
      requests,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Error fetching party DSAR requests:', error);
    res.status(500).json({ error: 'Failed to fetch party DSAR requests' });
  }
});

/**
 * @swagger
 * /api/v1/dsar/statistics:
 *   get:
 *     summary: Get DSAR statistics
 *     tags: [DSAR]
 *     responses:
 *       200:
 *         description: DSAR statistics
 *       500:
 *         description: Server error
 */
router.get('/statistics', async (req, res) => {
  try {
    const [
      totalRequests,
      pendingRequests,
      inProgressRequests,
      completedRequests,
      rejectedRequests,
      requestsByType,
      requestsByPriority
    ] = await Promise.all([
      DSAR.countDocuments(),
      DSAR.countDocuments({ status: 'pending' }),
      DSAR.countDocuments({ status: 'in-progress' }),
      DSAR.countDocuments({ status: 'completed' }),
      DSAR.countDocuments({ status: 'rejected' }),
      DSAR.aggregate([
        { $group: { _id: '$requestType', count: { $sum: 1 } } }
      ]),
      DSAR.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ])
    ]);
    
    res.json({
      totalRequests,
      statusBreakdown: {
        pending: pendingRequests,
        inProgress: inProgressRequests,
        completed: completedRequests,
        rejected: rejectedRequests
      },
      requestsByType: requestsByType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      requestsByPriority: requestsByPriority.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    logger.error('Error fetching DSAR statistics:', error);
    res.status(500).json({ error: 'Failed to fetch DSAR statistics' });
  }
});

module.exports = router;
