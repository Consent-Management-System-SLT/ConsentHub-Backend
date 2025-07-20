const Agreement = require('../models/Agreement');
const { generateUUID, logger, createAuditLog } = require('../../shared/utils');
const axios = require('axios');

class AgreementController {
  // Create new agreement
  async createAgreement(req, res) {
    try {
      const agreementData = {
        id: generateUUID(),
        name: req.body.name,
        description: req.body.description,
        agreementType: req.body.agreementType,
        status: req.body.status || 'pending',
        version: req.body.version || '1.0.0',
        partyId: req.body.partyId,
        partyRole: req.body.partyRole || 'customer',
        agreementSpecification: req.body.agreementSpecification,
        agreementItems: req.body.agreementItems || [],
        validityPeriod: req.body.validityPeriod || {
          startDateTime: new Date(),
          endDateTime: req.body.validityPeriod?.endDateTime,
        },
        billingAccountId: req.body.billingAccountId,
        paymentMethod: req.body.paymentMethod,
        billingCycle: req.body.billingCycle || 'monthly',
        cancellationPolicy: req.body.cancellationPolicy || {},
        renewalType: req.body.renewalType || 'none',
        renewalPeriod: req.body.renewalPeriod,
        characteristics: req.body.characteristics || [],
        attachments: req.body.attachments || [],
        signature: req.body.signature,
        relatedAgreements: req.body.relatedAgreements || [],
        metadata: {
          createdBy: req.user.uid,
          source: req.body.source || 'web',
          tags: req.body.tags || [],
          externalReferences: req.body.externalReferences || [],
        },
      };

      const agreement = new Agreement(agreementData);
      await agreement.save();

      // Create audit log
      await createAuditLog(
        'CREATE_AGREEMENT',
        req.user.uid,
        'agreement-service',
        { agreementId: agreement.id, partyId: agreement.partyId, type: agreement.agreementType }
      );

      // Emit event
      await this.emitAgreementEvent('AgreementCreated', agreement);

      logger.info(`Agreement created: ${agreement.id}`);
      res.status(201).json(agreement);
    } catch (error) {
      logger.error('Error creating agreement:', error);
      res.status(500).json({ error: 'Failed to create agreement' });
    }
  }

  // Get agreements by partyId
  async getAgreementsByParty(req, res) {
    try {
      const { partyId } = req.params;
      const { 
        status, 
        agreementType, 
        limit = 10, 
        offset = 0,
        includeExpired = false
      } = req.query;

      // Check if user has permission to access this party's agreements
      if (req.user.role === 'customer' && partyId !== req.user.uid) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const filter = { partyId };
      if (status) filter.status = status;
      if (agreementType) filter.agreementType = agreementType;
      
      // Filter out expired agreements unless explicitly requested
      if (!includeExpired) {
        filter.$or = [
          { 'validityPeriod.endDateTime': { $exists: false } },
          { 'validityPeriod.endDateTime': { $gt: new Date() } }
        ];
      }

      const agreements = await Agreement.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset));

      const total = await Agreement.countDocuments(filter);

      res.json({
        agreements,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total,
        },
      });
    } catch (error) {
      logger.error('Error fetching agreements:', error);
      res.status(500).json({ error: 'Failed to fetch agreements' });
    }
  }

  // Get agreement by ID
  async getAgreementById(req, res) {
    try {
      const { id } = req.params;
      const agreement = await Agreement.findOne({ id });

      if (!agreement) {
        return res.status(404).json({ error: 'Agreement not found' });
      }

      // Check if user has permission to access this agreement
      if (req.user.role === 'customer' && agreement.partyId !== req.user.uid) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      res.json(agreement);
    } catch (error) {
      logger.error('Error fetching agreement:', error);
      res.status(500).json({ error: 'Failed to fetch agreement' });
    }
  }

  // Update agreement
  async updateAgreement(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const agreement = await Agreement.findOne({ id });
      if (!agreement) {
        return res.status(404).json({ error: 'Agreement not found' });
      }

      // Check if user has permission to update this agreement
      if (req.user.role === 'customer' && agreement.partyId !== req.user.uid) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const previousStatus = agreement.status;
      Object.assign(agreement, updateData);
      agreement.metadata.lastModifiedBy = req.user.uid;
      await agreement.save();

      // Create audit log
      await createAuditLog(
        'UPDATE_AGREEMENT',
        req.user.uid,
        'agreement-service',
        { 
          agreementId: agreement.id, 
          partyId: agreement.partyId,
          previousStatus,
          newStatus: agreement.status
        }
      );

      // Emit event if status changed
      if (previousStatus !== agreement.status) {
        await this.emitAgreementEvent('AgreementStatusChanged', agreement);
      }

      logger.info(`Agreement updated: ${agreement.id}`);
      res.json(agreement);
    } catch (error) {
      logger.error('Error updating agreement:', error);
      res.status(500).json({ error: 'Failed to update agreement' });
    }
  }

  // Sign agreement
  async signAgreement(req, res) {
    try {
      const { id } = req.params;
      const { signatureMethod = 'digital' } = req.body;

      const agreement = await Agreement.findOne({ id });
      if (!agreement) {
        return res.status(404).json({ error: 'Agreement not found' });
      }

      // Check if user has permission to sign this agreement
      if (req.user.role === 'customer' && agreement.partyId !== req.user.uid) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      if (agreement.signature && agreement.signature.signedBy) {
        return res.status(400).json({ error: 'Agreement already signed' });
      }

      agreement.signature = {
        signedBy: req.user.uid,
        signedAt: new Date(),
        signatureMethod,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      };

      // Update status to active if pending
      if (agreement.status === 'pending') {
        agreement.status = 'active';
      }

      await agreement.save();

      // Create audit log
      await createAuditLog(
        'SIGN_AGREEMENT',
        req.user.uid,
        'agreement-service',
        { agreementId: agreement.id, partyId: agreement.partyId }
      );

      // Emit event
      await this.emitAgreementEvent('AgreementSigned', agreement);

      logger.info(`Agreement signed: ${agreement.id}`);
      res.json(agreement);
    } catch (error) {
      logger.error('Error signing agreement:', error);
      res.status(500).json({ error: 'Failed to sign agreement' });
    }
  }

  // Terminate agreement
  async terminateAgreement(req, res) {
    try {
      const { id } = req.params;
      const { terminationReason, terminationDate } = req.body;

      const agreement = await Agreement.findOne({ id });
      if (!agreement) {
        return res.status(404).json({ error: 'Agreement not found' });
      }

      // Check if user has permission to terminate this agreement
      if (req.user.role === 'customer' && agreement.partyId !== req.user.uid) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      if (agreement.status === 'terminated') {
        return res.status(400).json({ error: 'Agreement already terminated' });
      }

      agreement.status = 'terminated';
      agreement.validityPeriod.endDateTime = terminationDate ? new Date(terminationDate) : new Date();
      
      // Add termination reason to characteristics
      if (terminationReason) {
        agreement.characteristics.push({
          name: 'terminationReason',
          value: terminationReason,
          valueType: 'string',
        });
      }

      await agreement.save();

      // Create audit log
      await createAuditLog(
        'TERMINATE_AGREEMENT',
        req.user.uid,
        'agreement-service',
        { agreementId: agreement.id, partyId: agreement.partyId, reason: terminationReason }
      );

      // Emit event
      await this.emitAgreementEvent('AgreementTerminated', agreement);

      logger.info(`Agreement terminated: ${agreement.id}`);
      res.json(agreement);
    } catch (error) {
      logger.error('Error terminating agreement:', error);
      res.status(500).json({ error: 'Failed to terminate agreement' });
    }
  }

  // Approve agreement
  async approveAgreement(req, res) {
    try {
      const { id } = req.params;
      const { comments } = req.body;

      const agreement = await Agreement.findOne({ id });
      if (!agreement) {
        return res.status(404).json({ error: 'Agreement not found' });
      }

      agreement.approvalStatus = {
        status: 'approved',
        approvedBy: req.user.uid,
        approvedAt: new Date(),
        comments,
      };

      // Update status to active if pending
      if (agreement.status === 'pending') {
        agreement.status = 'active';
      }

      await agreement.save();

      // Create audit log
      await createAuditLog(
        'APPROVE_AGREEMENT',
        req.user.uid,
        'agreement-service',
        { agreementId: agreement.id, partyId: agreement.partyId }
      );

      // Emit event
      await this.emitAgreementEvent('AgreementApproved', agreement);

      logger.info(`Agreement approved: ${agreement.id}`);
      res.json(agreement);
    } catch (error) {
      logger.error('Error approving agreement:', error);
      res.status(500).json({ error: 'Failed to approve agreement' });
    }
  }

  // Get expired agreements
  async getExpiredAgreements(req, res) {
    try {
      const { limit = 10, offset = 0 } = req.query;

      const filter = {
        'validityPeriod.endDateTime': { $lt: new Date() },
        status: { $in: ['active', 'pending'] },
      };

      const agreements = await Agreement.find(filter)
        .sort({ 'validityPeriod.endDateTime': -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset));

      const total = await Agreement.countDocuments(filter);

      res.json({
        agreements,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total,
        },
      });
    } catch (error) {
      logger.error('Error fetching expired agreements:', error);
      res.status(500).json({ error: 'Failed to fetch expired agreements' });
    }
  }

  // Get agreements expiring soon
  async getExpiringAgreements(req, res) {
    try {
      const { days = 30, limit = 10, offset = 0 } = req.query;
      
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + parseInt(days));

      const filter = {
        'validityPeriod.endDateTime': { 
          $gte: now,
          $lte: futureDate 
        },
        status: 'active',
      };

      const agreements = await Agreement.find(filter)
        .sort({ 'validityPeriod.endDateTime': 1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset));

      const total = await Agreement.countDocuments(filter);

      res.json({
        agreements,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total,
        },
      });
    } catch (error) {
      logger.error('Error fetching expiring agreements:', error);
      res.status(500).json({ error: 'Failed to fetch expiring agreements' });
    }
  }

  // Helper method to emit events
  async emitAgreementEvent(eventType, agreement) {
    try {
      const eventServiceUrl = process.env.EVENT_SERVICE_URL || 'http://localhost:3005';
      await axios.post(`${eventServiceUrl}/events`, {
        eventType,
        source: 'agreement-service',
        data: agreement,
      });
    } catch (error) {
      logger.error('Failed to emit event:', error);
    }
  }
}

module.exports = new AgreementController();
