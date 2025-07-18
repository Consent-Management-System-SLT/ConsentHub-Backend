const express = require('express');
const router = express.Router();
const Party = require('../models/Party');
const AuditLog = require('../models/AuditLog');
const { logger } = require('../../shared/utils');

/**
 * @swagger
 * /api/v1/party:
 *   get:
 *     summary: Get all parties
 *     tags: [Party]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by party type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
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
 *         description: List of parties
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const { type, status, search, limit = 50, offset = 0 } = req.query;
    
    let query = {};
    
    // Add filters
    if (type) query.type = type;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const parties = await Party.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });
    
    const total = await Party.countDocuments(query);
    
    res.json({
      parties,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Error fetching parties:', error);
    res.status(500).json({ error: 'Failed to fetch parties' });
  }
});

/**
 * @swagger
 * /api/v1/party/{id}:
 *   get:
 *     summary: Get party by ID
 *     tags: [Party]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Party ID
 *     responses:
 *       200:
 *         description: Party details
 *       404:
 *         description: Party not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const party = await Party.findOne({ id: req.params.id });
    
    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }
    
    res.json(party);
  } catch (error) {
    logger.error('Error fetching party:', error);
    res.status(500).json({ error: 'Failed to fetch party' });
  }
});

/**
 * @swagger
 * /api/v1/party:
 *   post:
 *     summary: Create new party
 *     tags: [Party]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               mobile:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               type:
 *                 type: string
 *                 enum: [individual, organization, minor, guardian]
 *     responses:
 *       201:
 *         description: Party created successfully
 *       400:
 *         description: Invalid data
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
  try {
    const party = new Party(req.body);
    await party.save();
    
    // Log the creation
    await AuditLog.logEvent({
      eventType: 'party_created',
      partyId: party.id,
      actorType: 'csr',
      action: 'create',
      description: `Party ${party.name} created`,
      details: { partyId: party.id, name: party.name, email: party.email },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      source: 'csr'
    });
    
    res.status(201).json(party);
  } catch (error) {
    logger.error('Error creating party:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create party' });
  }
});

/**
 * @swagger
 * /api/v1/party/{id}:
 *   put:
 *     summary: Update party
 *     tags: [Party]
 *     parameters:
 *       - in: path
 *         name: id
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
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               mobile:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               type:
 *                 type: string
 *                 enum: [individual, organization, minor, guardian]
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *     responses:
 *       200:
 *         description: Party updated successfully
 *       404:
 *         description: Party not found
 *       500:
 *         description: Server error
 */
router.put('/:id', async (req, res) => {
  try {
    const oldParty = await Party.findOne({ id: req.params.id });
    
    if (!oldParty) {
      return res.status(404).json({ error: 'Party not found' });
    }
    
    const updatedParty = await Party.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    // Log the update
    await AuditLog.logEvent({
      eventType: 'party_updated',
      partyId: updatedParty.id,
      actorType: 'csr',
      action: 'update',
      description: `Party ${updatedParty.name} updated`,
      oldValues: oldParty.toJSON(),
      newValues: updatedParty.toJSON(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      source: 'csr'
    });
    
    res.json(updatedParty);
  } catch (error) {
    logger.error('Error updating party:', error);
    res.status(500).json({ error: 'Failed to update party' });
  }
});

/**
 * @swagger
 * /api/v1/party/{id}:
 *   delete:
 *     summary: Delete party
 *     tags: [Party]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Party ID
 *     responses:
 *       204:
 *         description: Party deleted successfully
 *       404:
 *         description: Party not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req, res) => {
  try {
    const party = await Party.findOne({ id: req.params.id });
    
    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }
    
    await Party.findOneAndDelete({ id: req.params.id });
    
    // Log the deletion
    await AuditLog.logEvent({
      eventType: 'party_deleted',
      partyId: party.id,
      actorType: 'csr',
      action: 'delete',
      description: `Party ${party.name} deleted`,
      details: party.toJSON(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      source: 'csr'
    });
    
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting party:', error);
    res.status(500).json({ error: 'Failed to delete party' });
  }
});

/**
 * @swagger
 * /api/v1/party/search:
 *   get:
 *     summary: Search parties
 *     tags: [Party]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by party type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of results to return
 *     responses:
 *       200:
 *         description: Search results
 *       500:
 *         description: Server error
 */
router.get('/search', async (req, res) => {
  try {
    const { q, type, limit = 20 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }
    
    let query = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { mobile: { $regex: q, $options: 'i' } }
      ]
    };
    
    if (type) query.type = type;
    
    const parties = await Party.find(query)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    res.json(parties);
  } catch (error) {
    logger.error('Error searching parties:', error);
    res.status(500).json({ error: 'Failed to search parties' });
  }
});

module.exports = router;
