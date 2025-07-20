const { logger } = require('../../shared/utils');
const Preference = require('../../csr-service/models/Preference');
const AuditLog = require('../../csr-service/models/AuditLog');
const { body, validationResult } = require('express-validator');

class CustomerPreferenceController {
  // Get customer's preferences
  async getPreferences(req, res) {
    try {
      const customerId = req.customer.customerId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      
      // Mock preferences data for demo
      const mockPreferences = [
        {
          id: '1',
          preferenceType: 'communication',
          channelType: 'email',
          isAllowed: true,
          description: 'Email notifications for account updates',
          category: 'notifications',
          frequency: 'immediate',
          lastModified: '2024-01-15T10:30:00Z',
          version: '1.0'
        },
        {
          id: '2',
          preferenceType: 'communication',
          channelType: 'sms',
          isAllowed: true,
          description: 'SMS notifications for urgent updates',
          category: 'notifications',
          frequency: 'immediate',
          lastModified: '2024-01-15T10:30:00Z',
          version: '1.0'
        },
        {
          id: '3',
          preferenceType: 'marketing',
          channelType: 'email',
          isAllowed: false,
          description: 'Marketing emails and promotional content',
          category: 'marketing',
          frequency: 'weekly',
          lastModified: '2024-02-01T09:15:00Z',
          version: '1.0'
        },
        {
          id: '4',
          preferenceType: 'marketing',
          channelType: 'push',
          isAllowed: true,
          description: 'Push notifications for special offers',
          category: 'marketing',
          frequency: 'daily',
          lastModified: '2024-01-15T10:30:00Z',
          version: '1.0'
        },
        {
          id: '5',
          preferenceType: 'data_usage',
          channelType: 'web',
          isAllowed: true,
          description: 'Website personalization based on usage data',
          category: 'personalization',
          frequency: 'continuous',
          lastModified: '2024-01-15T10:30:00Z',
          version: '1.0'
        },
        {
          id: '6',
          preferenceType: 'data_usage',
          channelType: 'mobile',
          isAllowed: false,
          description: 'Mobile app analytics and usage tracking',
          category: 'analytics',
          frequency: 'continuous',
          lastModified: '2024-03-10T14:20:00Z',
          version: '1.0'
        }
      ];

      // Filter by preference type if provided
      let filteredPreferences = mockPreferences;
      if (req.query.preferenceType) {
        filteredPreferences = mockPreferences.filter(pref => pref.preferenceType === req.query.preferenceType);
      }

      // Filter by channel type if provided
      if (req.query.channelType) {
        filteredPreferences = filteredPreferences.filter(pref => pref.channelType === req.query.channelType);
      }

      // Filter by isAllowed if provided
      if (req.query.isAllowed !== undefined) {
        const isAllowed = req.query.isAllowed === 'true';
        filteredPreferences = filteredPreferences.filter(pref => pref.isAllowed === isAllowed);
      }

      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPreferences = filteredPreferences.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          preferences: paginatedPreferences,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(filteredPreferences.length / limit),
            totalItems: filteredPreferences.length,
            hasNextPage: endIndex < filteredPreferences.length,
            hasPreviousPage: page > 1
          },
          summary: {
            total: mockPreferences.length,
            allowed: mockPreferences.filter(p => p.isAllowed).length,
            denied: mockPreferences.filter(p => !p.isAllowed).length,
            byType: {
              communication: mockPreferences.filter(p => p.preferenceType === 'communication').length,
              marketing: mockPreferences.filter(p => p.preferenceType === 'marketing').length,
              data_usage: mockPreferences.filter(p => p.preferenceType === 'data_usage').length
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching customer preferences:', error);
      res.status(500).json({
        error: 'Failed to retrieve preferences'
      });
    }
  }

  // Get specific preference by ID
  async getPreferenceById(req, res) {
    try {
      const customerId = req.customer.customerId;
      
      // Filter preferences by customer ID
      const customerPreferences = mockPreferences.filter(pref => pref.customerId === customerId);
      
      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPreferences = customerPreferences.slice(startIndex, endIndex);
      
      res.json({
        success: true,
        data: paginatedPreferences,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(customerPreferences.length / limit),
          totalItems: customerPreferences.length,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      logger.error('Error fetching customer preferences:', error);
      res.status(500).json({
        error: 'Failed to retrieve preferences'
      });
    }
  }

  // Get specific preference by ID
  async getPreferenceById(req, res) {
    try {
      const customerId = req.customer.id;
      const preferenceId = req.params.id;

      const preference = await Preference.findOne({
        _id: preferenceId,
        partyId: customerId
      }).select('-__v');

      if (!preference) {
        return res.status(404).json({
          error: 'Preference not found'
        });
      }

      res.json({
        success: true,
        data: preference
      });
    } catch (error) {
      logger.error('Error fetching preference by ID:', error);
      res.status(500).json({
        error: 'Failed to retrieve preference'
      });
    }
  }

  // Create or update preference
  async createOrUpdatePreference(req, res) {
    try {
      const customerId = req.customer.id;
      const { preferenceType, channelType, isAllowed, description, validFor } = req.body;

      // Validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      // Check if preference already exists
      const existingPreference = await Preference.findOne({
        partyId: customerId,
        preferenceType: preferenceType,
        channelType: channelType
      });

      if (existingPreference) {
        // Update existing preference
        const previousAllowed = existingPreference.isAllowed;
        existingPreference.isAllowed = isAllowed;
        existingPreference.description = description || existingPreference.description;
        existingPreference.validFor = validFor || existingPreference.validFor;
        existingPreference.updatedAt = new Date();

        await existingPreference.save();

        // Log the action
        await AuditLog.create({
          partyId: customerId,
          action: 'updated',
          entityType: 'preference',
          entityId: existingPreference._id,
          details: `Preference updated for ${preferenceType} via ${channelType}`,
          metadata: {
            preferenceType,
            channelType,
            previousAllowed,
            newAllowed: isAllowed,
            timestamp: new Date()
          }
        });

        logger.info('Preference updated', { 
          customerId, 
          preferenceId: existingPreference._id,
          preferenceType,
          channelType,
          isAllowed 
        });

        return res.json({
          success: true,
          data: existingPreference
        });
      }

      // Create new preference
      const preference = new Preference({
        partyId: customerId,
        preferenceType,
        channelType,
        isAllowed,
        description,
        validFor: validFor || {
          startDateTime: new Date(),
          endDateTime: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        }
      });

      await preference.save();

      // Log the action
      await AuditLog.create({
        partyId: customerId,
        action: 'created',
        entityType: 'preference',
        entityId: preference._id,
        details: `New preference created for ${preferenceType} via ${channelType}`,
        metadata: {
          preferenceType,
          channelType,
          isAllowed,
          timestamp: new Date()
        }
      });

      logger.info('New preference created', { 
        customerId, 
        preferenceId: preference._id,
        preferenceType,
        channelType,
        isAllowed 
      });

      res.status(201).json({
        success: true,
        data: preference
      });
    } catch (error) {
      logger.error('Error creating/updating preference:', error);
      res.status(500).json({
        error: 'Failed to create/update preference'
      });
    }
  }

  // Update preference
  async updatePreference(req, res) {
    try {
      const customerId = req.customer.id;
      const preferenceId = req.params.id;
      const updates = req.body;

      // Validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const preference = await Preference.findOne({
        _id: preferenceId,
        partyId: customerId
      });

      if (!preference) {
        return res.status(404).json({
          error: 'Preference not found'
        });
      }

      // Store previous values for audit
      const previousValues = {
        isAllowed: preference.isAllowed,
        description: preference.description,
        validFor: preference.validFor
      };

      // Update fields
      Object.assign(preference, updates);
      preference.updatedAt = new Date();

      await preference.save();

      // Log the action
      await AuditLog.create({
        partyId: customerId,
        action: 'updated',
        entityType: 'preference',
        entityId: preference._id,
        details: `Preference updated for ${preference.preferenceType} via ${preference.channelType}`,
        metadata: {
          preferenceType: preference.preferenceType,
          channelType: preference.channelType,
          previousValues,
          newValues: updates,
          timestamp: new Date()
        }
      });

      logger.info('Preference updated', { 
        customerId, 
        preferenceId: preference._id,
        updates: Object.keys(updates)
      });

      res.json({
        success: true,
        data: preference
      });
    } catch (error) {
      logger.error('Error updating preference:', error);
      res.status(500).json({
        error: 'Failed to update preference'
      });
    }
  }

  // Delete preference
  async deletePreference(req, res) {
    try {
      const customerId = req.customer.id;
      const preferenceId = req.params.id;

      const preference = await Preference.findOne({
        _id: preferenceId,
        partyId: customerId
      });

      if (!preference) {
        return res.status(404).json({
          error: 'Preference not found'
        });
      }

      await Preference.findByIdAndDelete(preferenceId);

      // Log the action
      await AuditLog.create({
        partyId: customerId,
        action: 'deleted',
        entityType: 'preference',
        entityId: preferenceId,
        details: `Preference deleted for ${preference.preferenceType} via ${preference.channelType}`,
        metadata: {
          preferenceType: preference.preferenceType,
          channelType: preference.channelType,
          deletedPreference: preference.toObject(),
          timestamp: new Date()
        }
      });

      logger.info('Preference deleted', { 
        customerId, 
        preferenceId,
        preferenceType: preference.preferenceType,
        channelType: preference.channelType
      });

      res.json({
        success: true,
        message: 'Preference deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting preference:', error);
      res.status(500).json({
        error: 'Failed to delete preference'
      });
    }
  }

  // Get preference summary grouped by type
  async getPreferenceSummary(req, res) {
    try {
      const customerId = req.customer.id;

      const summary = await Preference.aggregate([
        { $match: { partyId: customerId } },
        {
          $group: {
            _id: {
              preferenceType: '$preferenceType',
              isAllowed: '$isAllowed'
            },
            count: { $sum: 1 },
            channels: { $addToSet: '$channelType' },
            latestDate: { $max: '$updatedAt' }
          }
        },
        {
          $group: {
            _id: '$_id.preferenceType',
            settings: {
              $push: {
                isAllowed: '$_id.isAllowed',
                count: '$count',
                channels: '$channels',
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

      res.json({
        success: true,
        data: summary.map(item => ({
          preferenceType: item._id,
          totalCount: item.totalCount,
          settings: item.settings,
          lastUpdated: Math.max(...item.settings.map(s => s.latestDate))
        }))
      });
    } catch (error) {
      logger.error('Error fetching preference summary:', error);
      res.status(500).json({
        error: 'Failed to retrieve preference summary'
      });
    }
  }

  // Get preferences organized by channel type
  async getPreferencesByChannel(req, res) {
    try {
      const customerId = req.customer.id;

      const preferences = await Preference.aggregate([
        { $match: { partyId: customerId } },
        {
          $group: {
            _id: '$channelType',
            preferences: {
              $push: {
                id: '$_id',
                preferenceType: '$preferenceType',
                isAllowed: '$isAllowed',
                description: '$description',
                validFor: '$validFor',
                updatedAt: '$updatedAt'
              }
            },
            totalCount: { $sum: 1 },
            allowedCount: {
              $sum: {
                $cond: ['$isAllowed', 1, 0]
              }
            }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      res.json({
        success: true,
        data: preferences.map(channel => ({
          channelType: channel._id,
          totalCount: channel.totalCount,
          allowedCount: channel.allowedCount,
          deniedCount: channel.totalCount - channel.allowedCount,
          preferences: channel.preferences
        }))
      });
    } catch (error) {
      logger.error('Error fetching preferences by channel:', error);
      res.status(500).json({
        error: 'Failed to retrieve preferences by channel'
      });
    }
  }
}

// Validation middleware
const validatePreference = [
  body('preferenceType').notEmpty().withMessage('Preference type is required'),
  body('channelType').notEmpty().withMessage('Channel type is required'),
  body('isAllowed').isBoolean().withMessage('isAllowed must be a boolean'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('validFor.startDateTime').optional().isISO8601().withMessage('Start date must be valid ISO date'),
  body('validFor.endDateTime').optional().isISO8601().withMessage('End date must be valid ISO date')
];

const validatePreferenceUpdate = [
  body('isAllowed').optional().isBoolean().withMessage('isAllowed must be a boolean'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('validFor.startDateTime').optional().isISO8601().withMessage('Start date must be valid ISO date'),
  body('validFor.endDateTime').optional().isISO8601().withMessage('End date must be valid ISO date')
];

module.exports = new CustomerPreferenceController();
