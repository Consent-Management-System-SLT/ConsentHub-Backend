const { logger } = require('../../shared/utils');
const { body, validationResult } = require('express-validator');

class CustomerConsentController {
  // Get customer's consents
  async getConsents(req, res) {
    try {
      const customerId = req.customer.customerId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      
      // Mock consent data for demo
      const mockConsents = [
        {
          id: '1',
          purpose: 'Marketing Communications',
          status: 'granted',
          consentType: 'explicit',
          description: 'Permission to send marketing emails and promotional content',
          grantedDate: '2024-01-15T10:30:00Z',
          expiryDate: '2025-01-15T10:30:00Z',
          channel: 'email',
          jurisdiction: 'LK',
          legalBasis: 'consent',
          categories: ['marketing', 'communications'],
          lastModified: '2024-01-15T10:30:00Z',
          version: '1.0'
        },
        {
          id: '2',
          purpose: 'Data Analytics',
          status: 'granted',
          consentType: 'explicit',
          description: 'Permission to use personal data for analytics and insights',
          grantedDate: '2024-01-15T10:30:00Z',
          expiryDate: '2025-01-15T10:30:00Z',
          channel: 'web',
          jurisdiction: 'LK',
          legalBasis: 'consent',
          categories: ['analytics', 'insights'],
          lastModified: '2024-01-15T10:30:00Z',
          version: '1.0'
        },
        {
          id: '3',
          purpose: 'Third-party Sharing',
          status: 'revoked',
          consentType: 'explicit',
          description: 'Permission to share data with trusted third-party partners',
          grantedDate: '2024-01-15T10:30:00Z',
          revokedDate: '2024-03-10T14:20:00Z',
          channel: 'mobile',
          jurisdiction: 'LK',
          legalBasis: 'consent',
          categories: ['sharing', 'partners'],
          lastModified: '2024-03-10T14:20:00Z',
          version: '1.0'
        },
        {
          id: '4',
          purpose: 'Location Services',
          status: 'granted',
          consentType: 'explicit',
          description: 'Permission to access location data for location-based services',
          grantedDate: '2024-02-01T09:15:00Z',
          expiryDate: '2025-02-01T09:15:00Z',
          channel: 'mobile',
          jurisdiction: 'LK',
          legalBasis: 'consent',
          categories: ['location', 'services'],
          lastModified: '2024-02-01T09:15:00Z',
          version: '1.0'
        },
        {
          id: '5',
          purpose: 'Cookies and Tracking',
          status: 'expired',
          consentType: 'explicit',
          description: 'Permission to use cookies and tracking technologies',
          grantedDate: '2023-12-01T12:00:00Z',
          expiryDate: '2024-12-01T12:00:00Z',
          channel: 'web',
          jurisdiction: 'LK',
          legalBasis: 'consent',
          categories: ['cookies', 'tracking'],
          lastModified: '2023-12-01T12:00:00Z',
          version: '1.0'
        }
      ];

      // Filter by status if provided
      let filteredConsents = mockConsents;
      if (req.query.status) {
        filteredConsents = mockConsents.filter(consent => consent.status === req.query.status);
      }

      // Filter by purpose if provided
      if (req.query.purpose) {
        filteredConsents = filteredConsents.filter(consent => 
          consent.purpose.toLowerCase().includes(req.query.purpose.toLowerCase())
        );
      }

      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedConsents = filteredConsents.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          consents: paginatedConsents,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(filteredConsents.length / limit),
            totalItems: filteredConsents.length,
            hasNextPage: endIndex < filteredConsents.length,
            hasPreviousPage: page > 1
          },
          summary: {
            total: mockConsents.length,
            granted: mockConsents.filter(c => c.status === 'granted').length,
            revoked: mockConsents.filter(c => c.status === 'revoked').length,
            expired: mockConsents.filter(c => c.status === 'expired').length,
            pending: mockConsents.filter(c => c.status === 'pending').length
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching customer consents:', error);
      res.status(500).json({
        error: 'Failed to retrieve consents'
      });
    }
  }

  // Get consent summary
  async getConsentSummary(req, res) {
    try {
      const mockSummary = {
        total: 5,
        granted: 3,
        revoked: 1,
        expired: 1,
        pending: 0,
        byCategory: {
          marketing: 2,
          analytics: 1,
          sharing: 1,
          location: 1,
          cookies: 1
        },
        recentChanges: [
          {
            id: '3',
            purpose: 'Third-party Sharing',
            action: 'revoked',
            date: '2024-03-10T14:20:00Z'
          }
        ]
      };

      res.json({
        success: true,
        data: mockSummary
      });
    } catch (error) {
      logger.error('Error fetching consent summary:', error);
      res.status(500).json({
        error: 'Failed to retrieve consent summary'
      });
    }
  }

  // Grant consent
  async grantConsent(req, res) {
    try {
      const { purpose, consentType, description } = req.body;
      
      // Mock response for granting consent
      const mockResponse = {
        id: Date.now().toString(),
        purpose,
        consentType,
        description,
        status: 'granted',
        grantedDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        channel: 'web',
        jurisdiction: 'LK',
        legalBasis: 'consent',
        lastModified: new Date().toISOString(),
        version: '1.0'
      };

      res.json({
        success: true,
        data: mockResponse,
        message: 'Consent granted successfully'
      });
    } catch (error) {
      logger.error('Error granting consent:', error);
      res.status(500).json({
        error: 'Failed to grant consent'
      });
    }
  }

  // Get specific consent by ID
  async getConsentById(req, res) {
    try {
      const consentId = req.params.id;
      
      // Mock consent data
      const mockConsent = {
        id: consentId,
        purpose: 'Marketing Communications',
        status: 'granted',
        consentType: 'explicit',
        description: 'Permission to send marketing emails and promotional content',
        grantedDate: '2024-01-15T10:30:00Z',
        expiryDate: '2025-01-15T10:30:00Z',
        channel: 'email',
        jurisdiction: 'LK',
        legalBasis: 'consent',
        categories: ['marketing', 'communications'],
        lastModified: '2024-01-15T10:30:00Z',
        version: '1.0'
      };

      res.json({
        success: true,
        data: mockConsent
      });
    } catch (error) {
      logger.error('Error fetching consent by ID:', error);
      res.status(500).json({
        error: 'Failed to retrieve consent'
      });
    }
  }

  // Revoke consent
  async revokeConsent(req, res) {
    try {
      const consentId = req.params.id;
      
      // Mock response for revoking consent
      const mockResponse = {
        id: consentId,
        status: 'revoked',
        revokedDate: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };

      res.json({
        success: true,
        data: mockResponse,
        message: 'Consent revoked successfully'
      });
    } catch (error) {
      logger.error('Error revoking consent:', error);
      res.status(500).json({
        error: 'Failed to revoke consent'
      });
    }
  }

  // Get consent history
  async getConsentHistory(req, res) {
    try {
      const consentId = req.params.id;
      
      const mockHistory = [
        {
          id: '1',
          action: 'granted',
          date: '2024-01-15T10:30:00Z',
          details: 'Initial consent granted via web portal',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0...'
        },
        {
          id: '2',
          action: 'renewed',
          date: '2024-06-15T10:30:00Z',
          details: 'Consent renewed for another year',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0...'
        }
      ];

      res.json({
        success: true,
        data: {
          consentId,
          history: mockHistory
        }
      });
    } catch (error) {
      logger.error('Error fetching consent history:', error);
      res.status(500).json({
        error: 'Failed to retrieve consent history'
      });
    }
  }
}

module.exports = new CustomerConsentController();
