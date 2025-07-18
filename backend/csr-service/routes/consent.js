const express = require('express');
const router = express.Router();
const Consent = require('../models/Consent');
const Party = require('../models/Party');
const AuditLog = require('../models/AuditLog');
const { logger } = require('../../shared/utils');

/**
 * @swagger
 * /api/v1/consent:
 *   get:
 *     summary: Get all consents
 *     tags: [Consent]
 *     parameters:
 *       - in: query
 *         name: partyId
 *         schema:
 *           type: string
 *         description: Filter by party ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: consentType
 *         schema:
 *           type: string
 *         description: Filter by consent type
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
 *         description: List of consents
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const { partyId, status, consentType, limit = 50, offset = 0 } = req.query;
    
    let query = {};
    
    // Add filters
    if (partyId) query.partyId = partyId;
    if (status) query.status = status;
    if (consentType) query.consentType = consentType;
    
    const consents = await Consent.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });
    
    const total = await Consent.countDocuments(query);
    
    res.json({
      consents,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Error fetching consents:', error);
    res.status(500).json({ error: 'Failed to fetch consents' });
  }
});

/**
 * @swagger
 * /api/v1/consent/{id}:
 *   get:
 *     summary: Get consent by ID
 *     tags: [Consent]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Consent ID
 *     responses:
 *       200:
 *         description: Consent details
 *       404:
 *         description: Consent not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const consent = await Consent.findOne({ id: req.params.id });
    
    if (!consent) {
      return res.status(404).json({ error: 'Consent not found' });
    }
    
    res.json(consent);
  } catch (error) {
    logger.error('Error fetching consent:', error);
    res.status(500).json({ error: 'Failed to fetch consent' });
  }
});

/**
 * @swagger
 * /api/v1/consent:
 *   post:
 *     summary: Create new consent
 *     tags: [Consent]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - partyId
 *               - consentType
 *               - purpose
 *             properties:
 *               partyId:
 *                 type: string
 *               consentType:
 *                 type: string
 *                 enum: [data_processing, marketing, analytics, third_party_sharing, service_improvement, research, profiling, automated_decision_making]
 *               purpose:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, granted, revoked, expired]
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               guardianId:
 *                 type: string
 *               guardianConsent:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Consent created successfully
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
    
    // Check if guardian consent is required for minors
    if (party.type === 'minor' && !req.body.guardianId) {
      return res.status(400).json({ error: 'Guardian consent required for minors' });
    }
    
    const consent = new Consent({
      ...req.body,
      source: 'csr',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    await consent.save();
    
    // Log the creation
    await AuditLog.logEvent({
      eventType: 'consent_granted',
      partyId: consent.partyId,
      actorType: 'csr',
      resourceId: consent.id,
      resourceType: 'consent',
      action: 'create',
      description: `Consent ${consent.consentType} created for party ${party.name}`,
      details: {
        consentId: consent.id,
        consentType: consent.consentType,
        status: consent.status,
        purpose: consent.purpose
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      source: 'csr'
    });
    
    res.status(201).json(consent);
  } catch (error) {
    logger.error('Error creating consent:', error);
    res.status(500).json({ error: 'Failed to create consent' });
  }
});

/**
 * @swagger
 * /api/v1/consent/{id}:
 *   put:
 *     summary: Update consent
 *     tags: [Consent]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Consent ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, granted, revoked, expired]
 *               purpose:
 *                 type: string
 *               description:
 *                 type: string
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Consent updated successfully
 *       404:
 *         description: Consent not found
 *       500:
 *         description: Server error
 */
router.put('/:id', async (req, res) => {
  try {
    const oldConsent = await Consent.findOne({ id: req.params.id });
    
    if (!oldConsent) {
      return res.status(404).json({ error: 'Consent not found' });
    }
    
    const updatedConsent = await Consent.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    // Determine event type based on status change
    let eventType = 'consent_updated';
    if (oldConsent.status !== updatedConsent.status) {
      if (updatedConsent.status === 'granted') {
        eventType = 'consent_granted';
      } else if (updatedConsent.status === 'revoked') {
        eventType = 'consent_revoked';
      }
    }
    
    // Log the update
    await AuditLog.logEvent({
      eventType,
      partyId: updatedConsent.partyId,
      actorType: 'csr',
      resourceId: updatedConsent.id,
      resourceType: 'consent',
      action: 'update',
      description: `Consent ${updatedConsent.consentType} updated to ${updatedConsent.status}`,
      oldValues: oldConsent.toJSON(),
      newValues: updatedConsent.toJSON(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      source: 'csr'
    });
    
    res.json(updatedConsent);
  } catch (error) {
    logger.error('Error updating consent:', error);
    res.status(500).json({ error: 'Failed to update consent' });
  }
});

/**
 * @swagger
 * /api/v1/consent/{id}:
 *   delete:
 *     summary: Delete consent
 *     tags: [Consent]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Consent ID
 *     responses:
 *       204:
 *         description: Consent deleted successfully
 *       404:
 *         description: Consent not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req, res) => {
  try {
    const consent = await Consent.findOne({ id: req.params.id });
    
    if (!consent) {
      return res.status(404).json({ error: 'Consent not found' });
    }
    
    await Consent.findOneAndDelete({ id: req.params.id });
    
    // Log the deletion
    await AuditLog.logEvent({
      eventType: 'consent_deleted',
      partyId: consent.partyId,
      actorType: 'csr',
      resourceId: consent.id,
      resourceType: 'consent',
      action: 'delete',
      description: `Consent ${consent.consentType} deleted`,
      details: consent.toJSON(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      source: 'csr'
    });
    
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting consent:', error);
    res.status(500).json({ error: 'Failed to delete consent' });
  }
});

/**
 * @swagger
 * /api/v1/consent/party/{partyId}:
 *   get:
 *     summary: Get consents by party ID
 *     tags: [Consent]
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Party ID
 *     responses:
 *       200:
 *         description: List of consents for the party
 *       500:
 *         description: Server error
 */
router.get('/party/:partyId', async (req, res) => {
  try {
    const consents = await Consent.find({ partyId: req.params.partyId })
      .sort({ createdAt: -1 });
    
    res.json(consents);
  } catch (error) {
    logger.error('Error fetching party consents:', error);
    res.status(500).json({ error: 'Failed to fetch party consents' });
  }
});

/**
 * @swagger
 * /api/v1/consent/stats:
 *   get:
 *     summary: Get consent statistics
 *     tags: [Consent]
 *     responses:
 *       200:
 *         description: Consent statistics
 *       500:
 *         description: Server error
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await Consent.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const typeStats = await Consent.aggregate([
      {
        $group: {
          _id: '$consentType',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const total = await Consent.countDocuments();
    
    res.json({
      total,
      byStatus: stats,
      byType: typeStats
    });
  } catch (error) {
    logger.error('Error fetching consent stats:', error);
    res.status(500).json({ error: 'Failed to fetch consent stats' });
  }
});

module.exports = router;
