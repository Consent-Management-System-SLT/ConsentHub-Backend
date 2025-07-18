const { logger } = require('../../shared/utils');
const DSAR = require('../../csr-service/models/DSAR');
const AuditLog = require('../../csr-service/models/AuditLog');
const { body, validationResult } = require('express-validator');

class CustomerDSARController {
  // Get customer's DSAR requests
  async getDSARRequests(req, res) {
    try {
      const customerId = req.customer.customerId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      
      // Mock DSAR requests data for demo
      const mockDSARRequests = [
        {
          id: '1',
          requestType: 'access',
          category: 'data_portability',
          status: 'completed',
          description: 'Request for personal data export',
          submittedDate: '2024-01-10T08:00:00Z',
          completedDate: '2024-01-15T16:30:00Z',
          expectedCompletionDate: '2024-01-25T23:59:59Z',
          priority: 'medium',
          dataCategories: ['personal_info', 'communication_preferences', 'transaction_history'],
          requestDetails: {
            reason: 'Data portability request',
            format: 'JSON',
            deliveryMethod: 'email'
          },
          responseFiles: [
            {
              fileName: 'personal_data_export.json',
              fileSize: '2.4 MB',
              downloadUrl: '/api/v1/customer/dsar/1/download/personal_data_export.json'
            }
          ],
          lastModified: '2024-01-15T16:30:00Z'
        },
        {
          id: '2',
          requestType: 'deletion',
          category: 'erasure',
          status: 'in_progress',
          description: 'Request to delete marketing data',
          submittedDate: '2024-02-01T14:20:00Z',
          expectedCompletionDate: '2024-02-15T23:59:59Z',
          priority: 'high',
          dataCategories: ['marketing_data', 'communication_preferences'],
          requestDetails: {
            reason: 'No longer wish to receive marketing communications',
            retentionOverride: false
          },
          progressNotes: [
            {
              date: '2024-02-01T14:20:00Z',
              note: 'Request received and validated'
            },
            {
              date: '2024-02-03T09:15:00Z',
              note: 'Marketing data identified and queued for deletion'
            }
          ],
          lastModified: '2024-02-03T09:15:00Z'
        },
        {
          id: '3',
          requestType: 'rectification',
          category: 'correction',
          status: 'pending',
          description: 'Request to correct personal information',
          submittedDate: '2024-02-10T11:45:00Z',
          expectedCompletionDate: '2024-02-20T23:59:59Z',
          priority: 'medium',
          dataCategories: ['personal_info', 'contact_details'],
          requestDetails: {
            reason: 'Incorrect contact information on file',
            corrections: [
              {
                field: 'phone_number',
                currentValue: '+94 77 1234567',
                requestedValue: '+94 77 7654321'
              },
              {
                field: 'address',
                currentValue: '123 Old Street, Colombo',
                requestedValue: '456 New Street, Colombo'
              }
            ]
          },
          lastModified: '2024-02-10T11:45:00Z'
        }
      ];

      // Filter by status if provided
      let filteredRequests = mockDSARRequests;
      if (req.query.status) {
        filteredRequests = mockDSARRequests.filter(request => request.status === req.query.status);
      }

      // Filter by request type if provided
      if (req.query.requestType) {
        filteredRequests = filteredRequests.filter(request => request.requestType === req.query.requestType);
      }

      // Filter by category if provided
      if (req.query.category) {
        filteredRequests = filteredRequests.filter(request => request.category === req.query.category);
      }

      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          requests: paginatedRequests,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(filteredRequests.length / limit),
            totalItems: filteredRequests.length,
            hasNextPage: endIndex < filteredRequests.length,
            hasPreviousPage: page > 1
          },
          summary: {
            total: mockDSARRequests.length,
            pending: mockDSARRequests.filter(r => r.status === 'pending').length,
            in_progress: mockDSARRequests.filter(r => r.status === 'in_progress').length,
            completed: mockDSARRequests.filter(r => r.status === 'completed').length,
            cancelled: mockDSARRequests.filter(r => r.status === 'cancelled').length,
            byType: {
              access: mockDSARRequests.filter(r => r.requestType === 'access').length,
              deletion: mockDSARRequests.filter(r => r.requestType === 'deletion').length,
              rectification: mockDSARRequests.filter(r => r.requestType === 'rectification').length,
              restriction: mockDSARRequests.filter(r => r.requestType === 'restriction').length
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching customer DSAR requests:', error);
      res.status(500).json({
        error: 'Failed to retrieve DSAR requests'
      });
    }
  }

  // Get specific DSAR request by ID
  async getDSARRequestById(req, res) {
    try {
      const customerId = req.customer.customerId;
      const dsarId = req.params.id;

      const dsarRequest = await DSAR.findOne({
        _id: dsarId,
        partyId: customerId
      }).select('-__v');

      if (!dsarRequest) {
        return res.status(404).json({
          error: 'DSAR request not found'
        });
      }

      res.json({
        success: true,
        data: dsarRequest
      });
    } catch (error) {
      logger.error('Error fetching DSAR request by ID:', error);
      res.status(500).json({
        error: 'Failed to retrieve DSAR request'
      });
    }
  }

  // Create new DSAR request
  async createDSARRequest(req, res) {
    try {
      const customerId = req.customer.id;
      const { requestType, category, description, details } = req.body;

      // Validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      // Check for existing pending request of same type
      const existingRequest = await DSAR.findOne({
        partyId: customerId,
        requestType: requestType,
        status: { $in: ['submitted', 'in_progress'] }
      });

      if (existingRequest) {
        return res.status(400).json({
          error: 'You already have a pending request of this type',
          existingRequest: {
            id: existingRequest._id,
            requestType: existingRequest.requestType,
            status: existingRequest.status,
            createdAt: existingRequest.createdAt
          }
        });
      }

      // Create new DSAR request
      const dsarRequest = new DSAR({
        partyId: customerId,
        requestType,
        category,
        description,
        details,
        status: 'submitted',
        submittedAt: new Date(),
        expectedCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      await dsarRequest.save();

      // Log the action
      await AuditLog.create({
        partyId: customerId,
        action: 'created',
        entityType: 'dsar_request',
        entityId: dsarRequest._id,
        details: `New DSAR request submitted: ${requestType}`,
        metadata: {
          requestType,
          category,
          description,
          timestamp: new Date()
        }
      });

      logger.info('New DSAR request created', { 
        customerId, 
        dsarId: dsarRequest._id,
        requestType,
        category
      });

      res.status(201).json({
        success: true,
        data: dsarRequest
      });
    } catch (error) {
      logger.error('Error creating DSAR request:', error);
      res.status(500).json({
        error: 'Failed to create DSAR request'
      });
    }
  }

  // Cancel DSAR request
  async cancelDSARRequest(req, res) {
    try {
      const customerId = req.customer.id;
      const dsarId = req.params.id;
      const { reason } = req.body;

      const dsarRequest = await DSAR.findOne({
        _id: dsarId,
        partyId: customerId
      });

      if (!dsarRequest) {
        return res.status(404).json({
          error: 'DSAR request not found'
        });
      }

      // Check if request can be cancelled
      if (!['submitted', 'in_progress'].includes(dsarRequest.status)) {
        return res.status(400).json({
          error: 'Cannot cancel request in current status',
          currentStatus: dsarRequest.status
        });
      }

      // Update request status
      dsarRequest.status = 'cancelled';
      dsarRequest.cancelledAt = new Date();
      dsarRequest.cancellationReason = reason;
      dsarRequest.updatedAt = new Date();

      await dsarRequest.save();

      // Log the action
      await AuditLog.create({
        partyId: customerId,
        action: 'cancelled',
        entityType: 'dsar_request',
        entityId: dsarRequest._id,
        details: `DSAR request cancelled: ${dsarRequest.requestType}`,
        metadata: {
          requestType: dsarRequest.requestType,
          category: dsarRequest.category,
          reason,
          previousStatus: 'submitted',
          timestamp: new Date()
        }
      });

      logger.info('DSAR request cancelled', { 
        customerId, 
        dsarId: dsarRequest._id,
        requestType: dsarRequest.requestType,
        reason
      });

      res.json({
        success: true,
        data: dsarRequest
      });
    } catch (error) {
      logger.error('Error cancelling DSAR request:', error);
      res.status(500).json({
        error: 'Failed to cancel DSAR request'
      });
    }
  }

  // Get DSAR request history
  async getDSARRequestHistory(req, res) {
    try {
      const customerId = req.customer.id;
      const dsarId = req.params.id;

      // Verify DSAR request belongs to customer
      const dsarRequest = await DSAR.findOne({
        _id: dsarId,
        partyId: customerId
      });

      if (!dsarRequest) {
        return res.status(404).json({
          error: 'DSAR request not found'
        });
      }

      // Get audit history for this DSAR request
      const history = await AuditLog.find({
        partyId: customerId,
        entityType: 'dsar_request',
        entityId: dsarId
      })
      .sort({ createdAt: -1 })
      .select('action details metadata createdAt');

      res.json({
        success: true,
        data: {
          dsarRequest: {
            id: dsarRequest._id,
            requestType: dsarRequest.requestType,
            category: dsarRequest.category,
            status: dsarRequest.status,
            submittedAt: dsarRequest.submittedAt,
            expectedCompletionDate: dsarRequest.expectedCompletionDate
          },
          history: history.map(entry => ({
            id: entry._id,
            action: entry.action,
            description: entry.details,
            timestamp: entry.createdAt,
            metadata: entry.metadata
          }))
        }
      });
    } catch (error) {
      logger.error('Error fetching DSAR request history:', error);
      res.status(500).json({
        error: 'Failed to retrieve DSAR request history'
      });
    }
  }

  // Get DSAR request summary
  async getDSARRequestSummary(req, res) {
    try {
      const customerId = req.customer.id;

      const summary = await DSAR.aggregate([
        { $match: { partyId: customerId } },
        {
          $group: {
            _id: {
              requestType: '$requestType',
              status: '$status'
            },
            count: { $sum: 1 },
            latestDate: { $max: '$updatedAt' }
          }
        },
        {
          $group: {
            _id: '$_id.requestType',
            statuses: {
              $push: {
                status: '$_id.status',
                count: '$count',
                latestDate: '$latestDate'
              }
            },
            totalCount: { $sum: '$count' }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      // Get overall statistics
      const overallStats = await DSAR.aggregate([
        { $match: { partyId: customerId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          byRequestType: summary.map(item => ({
            requestType: item._id,
            totalCount: item.totalCount,
            statuses: item.statuses,
            lastUpdated: Math.max(...item.statuses.map(s => s.latestDate))
          })),
          overallStats: {
            total: overallStats.reduce((sum, stat) => sum + stat.count, 0),
            submitted: overallStats.find(s => s._id === 'submitted')?.count || 0,
            inProgress: overallStats.find(s => s._id === 'in_progress')?.count || 0,
            completed: overallStats.find(s => s._id === 'completed')?.count || 0,
            cancelled: overallStats.find(s => s._id === 'cancelled')?.count || 0
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching DSAR request summary:', error);
      res.status(500).json({
        error: 'Failed to retrieve DSAR request summary'
      });
    }
  }

  // Get available DSAR request types
  async getDSARRequestTypes(req, res) {
    try {
      const requestTypes = [
        {
          type: 'access',
          name: 'Data Access Request',
          description: 'Request a copy of your personal data',
          estimatedDays: 30
        },
        {
          type: 'correction',
          name: 'Data Correction Request',
          description: 'Request correction of inaccurate personal data',
          estimatedDays: 30
        },
        {
          type: 'deletion',
          name: 'Data Deletion Request',
          description: 'Request deletion of your personal data',
          estimatedDays: 30
        },
        {
          type: 'portability',
          name: 'Data Portability Request',
          description: 'Request your data in a machine-readable format',
          estimatedDays: 30
        },
        {
          type: 'objection',
          name: 'Object to Processing',
          description: 'Object to processing of your personal data',
          estimatedDays: 30
        },
        {
          type: 'restriction',
          name: 'Restrict Processing',
          description: 'Request restriction of processing your personal data',
          estimatedDays: 30
        }
      ];

      res.json({
        success: true,
        data: requestTypes
      });
    } catch (error) {
      logger.error('Error fetching DSAR request types:', error);
      res.status(500).json({
        error: 'Failed to retrieve DSAR request types'
      });
    }
  }
}

// Validation middleware
const validateDSARRequest = [
  body('requestType').notEmpty().withMessage('Request type is required')
    .isIn(['access', 'correction', 'deletion', 'portability', 'objection', 'restriction'])
    .withMessage('Invalid request type'),
  body('category').notEmpty().withMessage('Category is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('details').optional().isString().withMessage('Details must be a string')
];

const validateCancelDSAR = [
  body('reason').notEmpty().withMessage('Cancellation reason is required')
];

module.exports = new CustomerDSARController();
