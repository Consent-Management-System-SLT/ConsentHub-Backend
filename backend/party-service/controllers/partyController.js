const { createAuditLog } = require('../../shared/utils/auditLogger');
const { publishEvent } = require('../../shared/utils/eventPublisher');

class PartyController {
  // Create a new party
  async createParty(req, res) {
    try {
      console.log('Mock creating new party');
      
      const mockParty = {
        id: `party-${Date.now()}`,
        partyType: req.body.partyType || 'individual',
        name: req.body.name,
        status: 'active',
        contactInformation: req.body.contactInformation || [],
        characteristics: req.body.characteristics || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create audit log
      try {
        await createAuditLog({
          action: 'CREATE_PARTY',
          userId: req.user?.uid || 'demo-user',
          service: 'party-service',
          details: {
            partyId: mockParty.id,
            partyType: mockParty.partyType
          }
        });
      } catch (auditError) {
        console.log('Audit log creation failed:', auditError.message);
      }

      res.status(201).json({
        id: mockParty.id,
        href: `/api/v1/party/party/${mockParty.id}`,
        ...mockParty
      });
    } catch (error) {
      console.error('Error creating party:', error);
      res.status(400).json({
        error: {
          code: 'PARTY_CREATION_FAILED',
          message: 'Failed to create party'
        }
      });
    }
  }

  // Get party by ID  
  async getPartyById(req, res) {
    try {
      const { id } = req.params;
      
      console.log(`Mock serving party for ID: ${id}`);
      
      const mockParty = {
        id: id,
        partyType: 'individual',
        name: 'Nimal Perera',
        status: 'active',
        contactInformation: [
          {
            contactType: 'phone',
            contactValue: '+94771234567',
            isPrimary: true
          },
          {
            contactType: 'email', 
            contactValue: 'nimal@example.com',
            isPrimary: true
          }
        ],
        characteristics: [
          {
            name: 'customerType',
            value: 'postpaid',
            valueType: 'string'
          },
          {
            name: 'accountStatus',
            value: 'active',
            valueType: 'string'
          }
        ],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-07-18')
      };

      res.json({
        id: mockParty.id,
        href: `/api/v1/party/party/${mockParty.id}`,
        ...mockParty
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

  // Get all parties
  async getParties(req, res) {
    try {
      console.log('Mock serving all parties');
      
      const mockParties = [
        {
          id: 'party-nimal-001',
          partyType: 'individual',
          name: 'Nimal Perera', 
          status: 'active',
          href: '/api/v1/party/party/party-nimal-001'
        },
        {
          id: 'party-customer-002',
          partyType: 'individual',
          name: 'Kamala Silva',
          status: 'active',
          href: '/api/v1/party/party/party-customer-002'
        }
      ];

      res.json(mockParties);
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

  // Update party
  async updateParty(req, res) {
    try {
      const { id } = req.params;
      console.log(`Mock updating party: ${id}`);
      
      const mockUpdatedParty = {
        id: id,
        partyType: 'individual',
        name: req.body.name || 'Updated Name',
        status: req.body.status || 'active',
        updatedAt: new Date()
      };

      res.json({
        id: mockUpdatedParty.id,
        href: `/api/v1/party/party/${mockUpdatedParty.id}`,
        ...mockUpdatedParty
      });
    } catch (error) {
      console.error('Error updating party:', error);
      res.status(500).json({
        error: {
          code: 'PARTY_UPDATE_FAILED',
          message: 'Failed to update party'
        }
      });
    }
  }

  // Delete party
  async deleteParty(req, res) {
    try {
      const { id } = req.params;
      console.log(`Mock deleting party: ${id}`);

      res.json({
        message: 'Party deleted successfully',
        id: id
      });
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
      console.log(`Mock adding contact information for party: ${id}`);
      
      const mockContactInfo = {
        contactType: req.body.contactType,
        contactValue: req.body.contactValue,
        isPrimary: req.body.isPrimary || false,
        validFor: {
          startDateTime: new Date(),
          endDateTime: req.body.validFor?.endDateTime
        }
      };

      res.status(201).json(mockContactInfo);
    } catch (error) {
      console.error('Error adding contact information:', error);
      res.status(500).json({
        error: {
          code: 'CONTACT_ADDITION_FAILED', 
          message: 'Failed to add contact information'
        }
      });
    }
  }

  // Get party characteristics
  async getPartyCharacteristics(req, res) {
    try {
      const { id } = req.params;
      console.log(`Mock serving characteristics for party: ${id}`);

      const mockCharacteristics = [
        {
          name: 'customerType',
          value: 'postpaid',
          valueType: 'string'
        },
        {
          name: 'accountStatus', 
          value: 'active',
          valueType: 'string'
        }
      ];

      res.json({
        partyId: id,
        characteristics: mockCharacteristics
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

  // CRITICAL: CSR Party Search (Tharushi's scenario)
  async searchParties(req, res) {
    try {
      const { phone, email, name, contact } = req.query;
      
      console.log(`CSR party search: phone=${phone}, email=${email}, name=${name}, contact=${contact}`);
      
      // Mock party data for SLTMobitel scenario
      const mockParties = [
        {
          id: 'party-nimal-001',
          partyType: 'individual',
          name: 'Nimal Perera',
          status: 'active',
          contactInformation: [
            {
              contactType: 'phone',
              contactValue: '+94771234567',
              isPrimary: true
            },
            {
              contactType: 'email',
              contactValue: 'nimal@example.com',
              isPrimary: true
            }
          ],
          characteristics: [
            {
              name: 'customerType',
              value: 'postpaid',
              valueType: 'string'
            },
            {
              name: 'accountStatus',
              value: 'active',
              valueType: 'string'
            }
          ],
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-07-18') // Recently updated by CSR
        },
        {
          id: 'party-customer-002',
          partyType: 'individual', 
          name: 'Kamala Silva',
          status: 'active',
          contactInformation: [
            {
              contactType: 'phone',
              contactValue: '+94771234568',
              isPrimary: true
            },
            {
              contactType: 'email',
              contactValue: 'kamala@example.com',
              isPrimary: true
            }
          ],
          characteristics: [
            {
              name: 'customerType',
              value: 'prepaid',
              valueType: 'string'
            }
          ],
          createdAt: new Date('2024-02-10'),
          updatedAt: new Date('2024-02-10')
        }
      ];

      // Filter based on search criteria
      let filteredParties = mockParties;

      if (phone) {
        filteredParties = filteredParties.filter(party => 
          party.contactInformation.some(contact => 
            contact.contactType === 'phone' && 
            contact.contactValue.includes(phone.replace(/\s+/g, ''))
          )
        );
      }

      if (email) {
        filteredParties = filteredParties.filter(party => 
          party.contactInformation.some(contact => 
            contact.contactType === 'email' && 
            contact.contactValue.toLowerCase().includes(email.toLowerCase())
          )
        );
      }

      if (name) {
        filteredParties = filteredParties.filter(party => 
          party.name.toLowerCase().includes(name.toLowerCase())
        );
      }

      // Generic contact search (phone or email)
      if (contact) {
        filteredParties = filteredParties.filter(party => 
          party.contactInformation.some(contactInfo => 
            contactInfo.contactValue.toLowerCase().includes(contact.toLowerCase()) ||
            contactInfo.contactValue.includes(contact.replace(/\s+/g, ''))
          )
        );
      }

      res.json({
        searchCriteria: { phone, email, name, contact },
        totalFound: filteredParties.length,
        parties: filteredParties.map(party => ({
          id: party.id,
          href: `/api/v1/party/party/${party.id}`,
          name: party.name,
          partyType: party.partyType,
          status: party.status,
          primaryPhone: party.contactInformation.find(c => c.contactType === 'phone' && c.isPrimary)?.contactValue,
          primaryEmail: party.contactInformation.find(c => c.contactType === 'email' && c.isPrimary)?.contactValue,
          customerType: party.characteristics.find(c => c.name === 'customerType')?.value,
          lastUpdated: party.updatedAt
        }))
      });

    } catch (error) {
      console.error('Error searching parties:', error);
      res.status(500).json({
        error: {
          code: 'PARTY_SEARCH_FAILED',
          message: 'Failed to search parties'
        }
      });
    }
  }
}

module.exports = new PartyController();
