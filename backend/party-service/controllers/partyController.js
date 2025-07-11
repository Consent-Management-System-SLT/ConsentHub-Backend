const Party = require('../models/Party');
const { createAuditLog } = require('../../shared/utils/auditLogger');
const { publishEvent } = require('../../shared/utils/eventPublisher');

class PartyController {
  // Create a new party
  async createParty(req, res) {
    try {
      const partyData = {
        ...req.body,
        createdBy: req.user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const party = new Party(partyData);
      await party.save();

      // Create audit log
      await createAuditLog({
        action: 'CREATE_PARTY',
        userId: req.user.uid,
        service: 'party-service',
        details: {
          partyId: party.id,
          partyType: party.partyType
        }
      });

      // Publish event
      await publishEvent({
        eventType: 'PartyCreated',
        source: 'party-service',
        correlationId: req.headers['x-correlation-id'],
        data: {
          partyId: party.id,
          partyType: party.partyType,
          name: party.name
        }
      });

      res.status(201).json({
        id: party.id,
        href: `/api/v1/party/party/${party.id}`,
        ...party.toObject()
      });
    } catch (error) {
      console.error('Error creating party:', error);
      res.status(400).json({
        error: {
          code: 'PARTY_CREATION_FAILED',
          message: error.message,
          details: error.errors
        }
      });
    }
  }

  // Get party by ID
  async getPartyById(req, res) {
    try {
      const { id } = req.params;

      const party = await Party.findById(id);
      if (!party) {
        return res.status(404).json({
          error: {
            code: 'PARTY_NOT_FOUND',
            message: `Party with ID ${id} not found`
          }
        });
      }

      // Check authorization - customers can only view their own data
      if (req.user.role === 'customer' && party.id !== req.user.partyId) {
        return res.status(403).json({
          error: {
            code: 'ACCESS_DENIED',
            message: 'You can only view your own party information'
          }
        });
      }

      res.json({
        id: party.id,
        href: `/api/v1/party/party/${party.id}`,
        ...party.toObject()
      });
    } catch (error) {
      console.error('Error retrieving party:', error);
      res.status(500).json({
        error: {
          code: 'PARTY_RETRIEVAL_FAILED',
          message: 'Failed to retrieve party information'
        }
      });
    }
  }

  // Get parties with filtering and pagination
  async getParties(req, res) {
    try {
      // Only CSR and admin can list parties
      if (req.user.role === 'customer') {
        return res.status(403).json({
          error: {
            code: 'ACCESS_DENIED',
            message: 'Insufficient permissions to list parties'
          }
        });
      }

      const {
        offset = 0,
        limit = 20,
        partyType,
        status,
        'characteristic.name': characteristicName,
        'characteristic.value': characteristicValue
      } = req.query;

      // Build filter query
      const filter = {};
      if (partyType) filter.partyType = partyType;
      if (status) filter.status = status;
      
      // Filter by characteristics
      if (characteristicName || characteristicValue) {
        filter.characteristic = { $elemMatch: {} };
        if (characteristicName) filter.characteristic.$elemMatch.name = characteristicName;
        if (characteristicValue) filter.characteristic.$elemMatch.value = characteristicValue;
      }

      const parties = await Party.find(filter)
        .skip(parseInt(offset))
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

      const totalCount = await Party.countDocuments(filter);

      res.json({
        totalCount,
        rangeStart: parseInt(offset) + 1,
        rangeEnd: Math.min(parseInt(offset) + parseInt(limit), totalCount),
        parties: parties.map(party => ({
          id: party.id,
          href: `/api/v1/party/party/${party.id}`,
          ...party.toObject()
        }))
      });
    } catch (error) {
      console.error('Error retrieving parties:', error);
      res.status(500).json({
        error: {
          code: 'PARTIES_RETRIEVAL_FAILED',
          message: 'Failed to retrieve parties'
        }
      });
    }
  }

  // Update party information
  async updateParty(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const party = await Party.findById(id);
      if (!party) {
        return res.status(404).json({
          error: {
            code: 'PARTY_NOT_FOUND',
            message: `Party with ID ${id} not found`
          }
        });
      }

      // Check authorization
      if (req.user.role === 'customer' && party.id !== req.user.partyId) {
        return res.status(403).json({
          error: {
            code: 'ACCESS_DENIED',
            message: 'You can only update your own party information'
          }
        });
      }

      // Customers have limited update permissions
      if (req.user.role === 'customer') {
        const allowedFields = ['contactInformation', 'characteristic', 'relatedParty'];
        const providedFields = Object.keys(updateData);
        const unauthorizedFields = providedFields.filter(field => !allowedFields.includes(field));
        
        if (unauthorizedFields.length > 0) {
          return res.status(403).json({
            error: {
              code: 'UNAUTHORIZED_FIELDS',
              message: `Customers cannot update these fields: ${unauthorizedFields.join(', ')}`
            }
          });
        }
      }

      // Update party
      Object.assign(party, updateData);
      party.updatedAt = new Date();
      await party.save();

      // Create audit log
      await createAuditLog({
        action: 'UPDATE_PARTY',
        userId: req.user.uid,
        service: 'party-service',
        details: {
          partyId: party.id,
          updatedFields: Object.keys(updateData)
        }
      });

      // Publish event
      await publishEvent({
        eventType: 'PartyUpdated',
        source: 'party-service',
        correlationId: req.headers['x-correlation-id'],
        data: {
          partyId: party.id,
          updatedFields: Object.keys(updateData)
        }
      });

      res.json({
        id: party.id,
        href: `/api/v1/party/party/${party.id}`,
        ...party.toObject()
      });
    } catch (error) {
      console.error('Error updating party:', error);
      res.status(400).json({
        error: {
          code: 'PARTY_UPDATE_FAILED',
          message: error.message,
          details: error.errors
        }
      });
    }
  }

  // Delete/deactivate party
  async deleteParty(req, res) {
    try {
      const { id } = req.params;

      // Only admin can delete parties
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          error: {
            code: 'ACCESS_DENIED',
            message: 'Only administrators can delete parties'
          }
        });
      }

      const party = await Party.findById(id);
      if (!party) {
        return res.status(404).json({
          error: {
            code: 'PARTY_NOT_FOUND',
            message: `Party with ID ${id} not found`
          }
        });
      }

      // Soft delete - set status to inactive
      party.status = 'inactive';
      party.updatedAt = new Date();
      await party.save();

      // Create audit log
      await createAuditLog({
        action: 'DELETE_PARTY',
        userId: req.user.uid,
        service: 'party-service',
        details: {
          partyId: party.id
        }
      });

      // Publish event
      await publishEvent({
        eventType: 'PartyDeactivated',
        source: 'party-service',
        correlationId: req.headers['x-correlation-id'],
        data: {
          partyId: party.id
        }
      });

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting party:', error);
      res.status(500).json({
        error: {
          code: 'PARTY_DELETION_FAILED',
          message: 'Failed to delete party'
        }
      });
    }
  }

  // Add contact information
  async addContactInformation(req, res) {
    try {
      const { id } = req.params;
      const contactInfo = req.body;

      const party = await Party.findById(id);
      if (!party) {
        return res.status(404).json({
          error: {
            code: 'PARTY_NOT_FOUND',
            message: `Party with ID ${id} not found`
          }
        });
      }

      // Check authorization
      if (req.user.role === 'customer' && party.id !== req.user.partyId) {
        return res.status(403).json({
          error: {
            code: 'ACCESS_DENIED',
            message: 'You can only add contact information to your own party'
          }
        });
      }

      // Add contact information
      party.contactInformation.push(contactInfo);
      party.updatedAt = new Date();
      await party.save();

      // Create audit log
      await createAuditLog({
        action: 'ADD_CONTACT_INFO',
        userId: req.user.uid,
        service: 'party-service',
        details: {
          partyId: party.id,
          contactType: contactInfo.contactType
        }
      });

      res.status(201).json({
        id: party.id,
        href: `/api/v1/party/party/${party.id}`,
        contactInformation: party.contactInformation
      });
    } catch (error) {
      console.error('Error adding contact information:', error);
      res.status(400).json({
        error: {
          code: 'CONTACT_INFO_ADDITION_FAILED',
          message: error.message
        }
      });
    }
  }

  // Get party characteristics
  async getPartyCharacteristics(req, res) {
    try {
      const { id } = req.params;

      const party = await Party.findById(id);
      if (!party) {
        return res.status(404).json({
          error: {
            code: 'PARTY_NOT_FOUND',
            message: `Party with ID ${id} not found`
          }
        });
      }

      // Check authorization
      if (req.user.role === 'customer' && party.id !== req.user.partyId) {
        return res.status(403).json({
          error: {
            code: 'ACCESS_DENIED',
            message: 'You can only view your own party characteristics'
          }
        });
      }

      res.json({
        partyId: party.id,
        characteristics: party.characteristic || []
      });
    } catch (error) {
      console.error('Error retrieving party characteristics:', error);
      res.status(500).json({
        error: {
          code: 'CHARACTERISTICS_RETRIEVAL_FAILED',
          message: 'Failed to retrieve party characteristics'
        }
      });
    }
  }
}

module.exports = new PartyController();
