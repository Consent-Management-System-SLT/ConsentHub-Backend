const express = require('express');
const router = express.Router();
const Preference = require('../models/Preference');
const Party = require('../models/Party');
const AuditLog = require('../models/AuditLog');
const { logger } = require('../../shared/utils');

/**
 * @swagger
 * /api/v1/preference:
 *   get:
 *     summary: Get all preferences
 *     tags: [Preference]
 *     parameters:
 *       - in: query
 *         name: partyId
 *         schema:
 *           type: string
 *         description: Filter by party ID
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
 *         description: List of preferences
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const { partyId, limit = 50, offset = 0 } = req.query;
    
    let query = {};
    
    // Add filters
    if (partyId) query.partyId = partyId;
    
    const preferences = await Preference.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ updatedAt: -1 });
    
    const total = await Preference.countDocuments(query);
    
    res.json({
      preferences,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

/**
 * @swagger
 * /api/v1/preference/{id}:
 *   get:
 *     summary: Get preference by ID
 *     tags: [Preference]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Preference ID
 *     responses:
 *       200:
 *         description: Preference details
 *       404:
 *         description: Preference not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const preference = await Preference.findOne({ id: req.params.id });
    
    if (!preference) {
      return res.status(404).json({ error: 'Preference not found' });
    }
    
    res.json(preference);
  } catch (error) {
    logger.error('Error fetching preference:', error);
    res.status(500).json({ error: 'Failed to fetch preference' });
  }
});

/**
 * @swagger
 * /api/v1/preference:
 *   post:
 *     summary: Create new preference
 *     tags: [Preference]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - partyId
 *             properties:
 *               partyId:
 *                 type: string
 *               preferredChannels:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: boolean
 *                   sms:
 *                     type: boolean
 *                   phone:
 *                     type: boolean
 *                   push:
 *                     type: boolean
 *                   mail:
 *                     type: boolean
 *               topicSubscriptions:
 *                 type: object
 *                 properties:
 *                   marketing:
 *                     type: boolean
 *                   promotions:
 *                     type: boolean
 *                   serviceUpdates:
 *                     type: boolean
 *                   billing:
 *                     type: boolean
 *                   security:
 *                     type: boolean
 *                   newsletter:
 *                     type: boolean
 *                   surveys:
 *                     type: boolean
 *               frequency:
 *                 type: string
 *                 enum: [immediate, daily, weekly, monthly, quarterly]
 *               timezone:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       201:
 *         description: Preference created successfully
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
    
    // Check if preference already exists for this party
    const existingPreference = await Preference.findOne({ partyId: req.body.partyId });
    if (existingPreference) {
      return res.status(400).json({ error: 'Preference already exists for this party' });
    }
    
    const preference = new Preference(req.body);
    await preference.save();
    
    // Log the creation
    await AuditLog.logEvent({
      eventType: 'preference_created',
      partyId: preference.partyId,
      actorType: 'csr',
      resourceId: preference.id,
      resourceType: 'preference',
      action: 'create',
      description: `Communication preferences created for party ${party.name}`,
      details: {
        preferenceId: preference.id,
        partyId: preference.partyId,
        frequency: preference.frequency,
        language: preference.language
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      source: 'csr'
    });
    
    res.status(201).json(preference);
  } catch (error) {
    logger.error('Error creating preference:', error);
    res.status(500).json({ error: 'Failed to create preference' });
  }
});

/**
 * @swagger
 * /api/v1/preference/{id}:
 *   put:
 *     summary: Update preference
 *     tags: [Preference]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Preference ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               preferredChannels:
 *                 type: object
 *               topicSubscriptions:
 *                 type: object
 *               frequency:
 *                 type: string
 *                 enum: [immediate, daily, weekly, monthly, quarterly]
 *               timezone:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       200:
 *         description: Preference updated successfully
 *       404:
 *         description: Preference not found
 *       500:
 *         description: Server error
 */
router.put('/:id', async (req, res) => {
  try {
    const oldPreference = await Preference.findOne({ id: req.params.id });
    
    if (!oldPreference) {
      return res.status(404).json({ error: 'Preference not found' });
    }
    
    const updatedPreference = await Preference.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    // Log the update
    await AuditLog.logEvent({
      eventType: 'preference_updated',
      partyId: updatedPreference.partyId,
      actorType: 'csr',
      resourceId: updatedPreference.id,
      resourceType: 'preference',
      action: 'update',
      description: `Communication preferences updated`,
      oldValues: oldPreference.toJSON(),
      newValues: updatedPreference.toJSON(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      source: 'csr'
    });
    
    res.json(updatedPreference);
  } catch (error) {
    logger.error('Error updating preference:', error);
    res.status(500).json({ error: 'Failed to update preference' });
  }
});

/**
 * @swagger
 * /api/v1/preference/{id}:
 *   delete:
 *     summary: Delete preference
 *     tags: [Preference]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Preference ID
 *     responses:
 *       204:
 *         description: Preference deleted successfully
 *       404:
 *         description: Preference not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req, res) => {
  try {
    const preference = await Preference.findOne({ id: req.params.id });
    
    if (!preference) {
      return res.status(404).json({ error: 'Preference not found' });
    }
    
    await Preference.findOneAndDelete({ id: req.params.id });
    
    // Log the deletion
    await AuditLog.logEvent({
      eventType: 'preference_deleted',
      partyId: preference.partyId,
      actorType: 'csr',
      resourceId: preference.id,
      resourceType: 'preference',
      action: 'delete',
      description: `Communication preferences deleted`,
      details: preference.toJSON(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      source: 'csr'
    });
    
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting preference:', error);
    res.status(500).json({ error: 'Failed to delete preference' });
  }
});

/**
 * @swagger
 * /api/v1/preference/party/{partyId}:
 *   get:
 *     summary: Get preferences by party ID
 *     tags: [Preference]
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Party ID
 *     responses:
 *       200:
 *         description: Preferences for the party
 *       404:
 *         description: Preferences not found
 *       500:
 *         description: Server error
 */
router.get('/party/:partyId', async (req, res) => {
  try {
    const preference = await Preference.findOne({ partyId: req.params.partyId });
    
    if (!preference) {
      return res.status(404).json({ error: 'Preferences not found for this party' });
    }
    
    res.json(preference);
  } catch (error) {
    logger.error('Error fetching party preferences:', error);
    res.status(500).json({ error: 'Failed to fetch party preferences' });
  }
});

/**
 * @swagger
 * /api/v1/preference/party/{partyId}:
 *   post:
 *     summary: Create or update preferences for a party
 *     tags: [Preference]
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Party ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               preferredChannels:
 *                 type: object
 *               topicSubscriptions:
 *                 type: object
 *               frequency:
 *                 type: string
 *               timezone:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       200:
 *         description: Preference created or updated successfully
 *       400:
 *         description: Invalid data
 *       500:
 *         description: Server error
 */
router.post('/party/:partyId', async (req, res) => {
  try {
    // Verify party exists
    const party = await Party.findOne({ id: req.params.partyId });
    if (!party) {
      return res.status(400).json({ error: 'Party not found' });
    }
    
    let preference = await Preference.findOne({ partyId: req.params.partyId });
    let isNew = false;
    
    if (preference) {
      // Update existing preference
      const oldPreference = preference.toJSON();
      preference = await Preference.findOneAndUpdate(
        { partyId: req.params.partyId },
        { ...req.body, partyId: req.params.partyId },
        { new: true, runValidators: true }
      );
      
      // Log the update
      await AuditLog.logEvent({
        eventType: 'preference_updated',
        partyId: preference.partyId,
        actorType: 'csr',
        resourceId: preference.id,
        resourceType: 'preference',
        action: 'update',
        description: `Communication preferences updated for party ${party.name}`,
        oldValues: oldPreference,
        newValues: preference.toJSON(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        source: 'csr'
      });
    } else {
      // Create new preference
      preference = new Preference({
        ...req.body,
        partyId: req.params.partyId
      });
      await preference.save();
      isNew = true;
      
      // Log the creation
      await AuditLog.logEvent({
        eventType: 'preference_created',
        partyId: preference.partyId,
        actorType: 'csr',
        resourceId: preference.id,
        resourceType: 'preference',
        action: 'create',
        description: `Communication preferences created for party ${party.name}`,
        details: preference.toJSON(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        source: 'csr'
      });
    }
    
    res.status(isNew ? 201 : 200).json(preference);
  } catch (error) {
    logger.error('Error creating/updating party preferences:', error);
    res.status(500).json({ error: 'Failed to create/update party preferences' });
  }
});

module.exports = router;
