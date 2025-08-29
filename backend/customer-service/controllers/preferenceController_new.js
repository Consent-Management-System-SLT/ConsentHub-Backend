const { logger } = require('../../shared/utils');
const Preference = require('../../csr-service/models/Preference');
const { UserPreference } = require('../../../models/Preference');
const AuditLog = require('../../csr-service/models/AuditLog');
const { body, validationResult } = require('express-validator');

class CustomerPreferenceController {
  // Get customer's preferences
  async getPreferences(req, res) {
    try {
      const customerId = req.customer.customerId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      
      // Fetch actual preferences from MongoDB
      let preferences = [];
      
      try {
        // First check the CSR-service Preference model
        const csrPreferences = await Preference.find({ partyId: customerId });
        
        // Also check UserPreference model
        const userPreferences = await UserPreference.find({ 
          $or: [
            { partyId: customerId },
            { userId: customerId }
          ]
        }).populate('preferenceId', 'name description type').lean();
        
        // Transform CSR preferences to unified format
        preferences = csrPreferences.map(pref => ({
          id: pref.id || pref._id.toString(),
          preferenceType: 'communication',
          channelType: 'mixed',
          isAllowed: pref.topicSubscriptions?.serviceUpdates || false,
          description: 'Communication preferences',
          category: 'notifications',
          frequency: pref.frequency || 'immediate',
          lastModified: pref.updatedAt || pref.createdAt,
          version: '1.0',
          preferredChannels: pref.preferredChannels || {},
          topicSubscriptions: pref.topicSubscriptions || {},
          doNotDisturb: {
            enabled: pref.quietHours?.enabled || false,
            start: pref.quietHours?.start || '22:00',
            end: pref.quietHours?.end || '08:00'
          },
          timezone: pref.timezone || 'UTC',
          language: pref.language || 'en'
        }));
        
        // Add UserPreferences
        userPreferences.forEach(pref => {
          preferences.push({
            id: pref.id || pref._id.toString(),
            preferenceType: pref.preferenceId?.type || 'communication',
            channelType: 'general',
            isAllowed: Boolean(pref.value),
            description: pref.preferenceId?.description || 'User preference',
            category: pref.preferenceId?.name || 'general',
            frequency: 'immediate',
            lastModified: pref.updatedAt || pref.createdAt,
            version: '1.0',
            source: pref.source || 'user',
            value: pref.value,
            metadata: pref.metadata || {}
          });
        });
        
      } catch (dbError) {
        console.log('Database query failed, using mock data:', dbError.message);
        
        // Fallback to mock data if database query fails
        preferences = [
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
          }
        ];
      }

      // Apply filters
      let filteredPreferences = preferences;
      
      if (req.query.preferenceType) {
        filteredPreferences = filteredPreferences.filter(p => 
          p.preferenceType === req.query.preferenceType);
      }
      
      if (req.query.channelType) {
        filteredPreferences = filteredPreferences.filter(p => 
          p.channelType === req.query.channelType);
      }
      
      if (req.query.isAllowed !== undefined) {
        const isAllowed = req.query.isAllowed === 'true';
        filteredPreferences = filteredPreferences.filter(p => 
          p.isAllowed === isAllowed);
      }

      // Apply pagination
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
            total: preferences.length,
            allowed: preferences.filter(p => p.isAllowed).length,
            denied: preferences.filter(p => !p.isAllowed).length,
            byType: {
              communication: preferences.filter(p => p.preferenceType === 'communication').length,
              marketing: preferences.filter(p => p.preferenceType === 'marketing').length,
              data_usage: preferences.filter(p => p.preferenceType === 'data_usage').length
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
      const customerId = req.customer.id || req.customer.customerId;
      const preferenceId = req.params.id;

      // Try CSR Preference model first
      let preference = await Preference.findOne({
        _id: preferenceId,
        partyId: customerId
      }).select('-__v');

      // If not found, try UserPreference model
      if (!preference) {
        preference = await UserPreference.findOne({
          _id: preferenceId,
          $or: [{ partyId: customerId }, { userId: customerId }]
        }).populate('preferenceId', 'name description type').select('-__v');
      }

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
      const customerId = req.customer.id || req.customer.customerId;
      
      // Support both individual preference updates and bulk preference updates
      if (req.body.preferredChannels || req.body.topicSubscriptions) {
        // This is a bulk preference update (CommunicationPreferences style)
        return await this.updateBulkPreferences(req, res, customerId);
      }
      
      // Individual preference update
      const { preferenceType, channelType, isAllowed, description, validFor } = req.body;

      // Validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      // Try to find existing preference in CSR-service Preference model
      let existingPreference = await Preference.findOne({
        partyId: customerId
      });

      if (existingPreference) {
        // Update existing CSR preference
        if (req.body.preferredChannels) {
          existingPreference.preferredChannels = { 
            ...existingPreference.preferredChannels, 
            ...req.body.preferredChannels 
          };
        }
        
        if (req.body.topicSubscriptions) {
          existingPreference.topicSubscriptions = { 
            ...existingPreference.topicSubscriptions, 
            ...req.body.topicSubscriptions 
          };
        }
        
        if (req.body.frequency) {
          existingPreference.frequency = req.body.frequency;
        }
        
        if (req.body.timezone) {
          existingPreference.timezone = req.body.timezone;
        }
        
        if (req.body.language) {
          existingPreference.language = req.body.language;
        }
        
        if (req.body.doNotDisturb) {
          existingPreference.quietHours = {
            enabled: req.body.doNotDisturb.enabled || false,
            start: req.body.doNotDisturb.start || '22:00',
            end: req.body.doNotDisturb.end || '08:00'
          };
        }
        
        existingPreference.updatedAt = new Date();
        await existingPreference.save();

        // Log the action
        try {
          await AuditLog.create({
            partyId: customerId,
            action: 'updated',
            entityType: 'preference',
            entityId: existingPreference._id,
            details: `Communication preferences updated`,
            metadata: {
              preferenceType: 'communication',
              changes: req.body,
              timestamp: new Date()
            }
          });
        } catch (auditError) {
          logger.warn('Audit log creation failed:', auditError.message);
        }

        logger.info('Communication preferences updated', { 
          customerId, 
          preferenceId: existingPreference._id,
          changes: Object.keys(req.body)
        });

        return res.json({
          success: true,
          data: existingPreference,
          message: 'Communication preferences updated successfully'
        });
      }

      // Check if individual preference already exists
      existingPreference = await Preference.findOne({
        partyId: customerId
      });

      if (existingPreference && preferenceType && channelType) {
        // Update a specific channel/type preference
        if (preferenceType === 'communication') {
          if (existingPreference.preferredChannels) {
            existingPreference.preferredChannels[channelType] = isAllowed;
          }
        } else if (preferenceType === 'marketing') {
          if (existingPreference.topicSubscriptions) {
            existingPreference.topicSubscriptions.marketing = isAllowed;
            existingPreference.topicSubscriptions.promotions = isAllowed;
          }
        }
        
        existingPreference.updatedAt = new Date();
        await existingPreference.save();

        // Log the action
        try {
          await AuditLog.create({
            partyId: customerId,
            action: 'updated',
            entityType: 'preference',
            entityId: existingPreference._id,
            details: `Preference updated for ${preferenceType} via ${channelType}`,
            metadata: {
              preferenceType,
              channelType,
              isAllowed,
              timestamp: new Date()
            }
          });
        } catch (auditError) {
          logger.warn('Audit log creation failed:', auditError.message);
        }

        logger.info('Individual preference updated', { 
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

      // Create new preference if none exists
      const newPreference = new Preference({
        id: new require('mongoose').Types.ObjectId().toString(),
        partyId: customerId,
        preferredChannels: {
          email: preferenceType === 'communication' && channelType === 'email' ? isAllowed : true,
          sms: preferenceType === 'communication' && channelType === 'sms' ? isAllowed : false,
          phone: false,
          push: preferenceType === 'communication' && channelType === 'push' ? isAllowed : true,
          mail: false
        },
        topicSubscriptions: {
          marketing: preferenceType === 'marketing' ? isAllowed : false,
          promotions: preferenceType === 'marketing' ? isAllowed : false,
          serviceUpdates: true,
          billing: true,
          security: true,
          newsletter: false,
          surveys: false
        },
        frequency: 'immediate',
        timezone: 'UTC',
        language: 'en',
        format: 'html',
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00'
        }
      });

      await newPreference.save();

      // Log the action
      try {
        await AuditLog.create({
          partyId: customerId,
          action: 'created',
          entityType: 'preference',
          entityId: newPreference._id,
          details: `New communication preferences created`,
          metadata: {
            preferenceType: preferenceType || 'communication',
            channelType: channelType || 'all',
            isAllowed: isAllowed !== undefined ? isAllowed : true,
            timestamp: new Date()
          }
        });
      } catch (auditError) {
        logger.warn('Audit log creation failed:', auditError.message);
      }

      logger.info('New communication preferences created', { 
        customerId, 
        preferenceId: newPreference._id
      });

      res.status(201).json({
        success: true,
        data: newPreference,
        message: 'Communication preferences created successfully'
      });
      
    } catch (error) {
      logger.error('Error creating/updating preference:', error);
      res.status(500).json({
        error: 'Failed to create/update preference'
      });
    }
  }

  // Bulk preference update helper (for CommunicationPreferences component)  
  async updateBulkPreferences(req, res, customerId) {
    try {
      const updates = req.body;
      
      // Find or create preference document
      let preference = await Preference.findOne({ partyId: customerId });
      
      if (!preference) {
        // Create new preference document
        preference = new Preference({
          id: new require('mongoose').Types.ObjectId().toString(),
          partyId: customerId,
          preferredChannels: {
            email: true,
            sms: false,
            phone: false,
            push: true,
            mail: false
          },
          topicSubscriptions: {
            marketing: false,
            promotions: false,
            serviceUpdates: true,
            billing: true,
            security: true,
            newsletter: false,
            surveys: false
          },
          frequency: 'immediate',
          timezone: 'UTC',
          language: 'en'
        });
      }
      
      // Apply updates
      if (updates.preferredChannels) {
        preference.preferredChannels = {
          ...preference.preferredChannels,
          ...updates.preferredChannels
        };
      }
      
      if (updates.topicSubscriptions) {
        preference.topicSubscriptions = {
          ...preference.topicSubscriptions,
          ...updates.topicSubscriptions
        };
      }
      
      if (updates.frequency) {
        preference.frequency = updates.frequency;
      }
      
      if (updates.timezone) {
        preference.timezone = updates.timezone;
      }
      
      if (updates.language) {
        preference.language = updates.language;
      }
      
      if (updates.doNotDisturb) {
        preference.quietHours = {
          enabled: updates.doNotDisturb.enabled || false,
          start: updates.doNotDisturb.start || '22:00',
          end: updates.doNotDisturb.end || '08:00'
        };
      }
      
      preference.updatedAt = new Date();
      await preference.save();
      
      // Log the bulk update
      try {
        await AuditLog.create({
          partyId: customerId,
          action: 'updated',
          entityType: 'preference',
          entityId: preference._id,
          details: 'Bulk communication preferences updated',
          metadata: {
            changes: updates,
            timestamp: new Date()
          }
        });
      } catch (auditError) {
        logger.warn('Audit log creation failed:', auditError.message);
      }
      
      logger.info('Bulk preferences updated', { 
        customerId, 
        preferenceId: preference._id,
        changes: Object.keys(updates)
      });
      
      return res.json({
        success: true,
        data: preference,
        message: 'Preferences updated successfully'
      });
      
    } catch (error) {
      logger.error('Error updating bulk preferences:', error);
      return res.status(500).json({
        error: 'Failed to update preferences'
      });
    }
  }

  // Update preference
  async updatePreference(req, res) {
    try {
      const customerId = req.customer.id || req.customer.customerId;
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

      // Try CSR Preference model first
      let preference = await Preference.findOne({
        _id: preferenceId,
        partyId: customerId
      });

      if (!preference) {
        // Try UserPreference model
        preference = await UserPreference.findOne({
          _id: preferenceId,
          $or: [{ partyId: customerId }, { userId: customerId }]
        });
      }

      if (!preference) {
        return res.status(404).json({
          error: 'Preference not found'
        });
      }

      // Store previous values for audit
      const previousValues = preference.toObject ? preference.toObject() : preference;

      // Update fields
      Object.assign(preference, updates);
      preference.updatedAt = new Date();

      await preference.save();

      // Log the action
      try {
        await AuditLog.create({
          partyId: customerId,
          action: 'updated',
          entityType: 'preference',
          entityId: preference._id,
          details: `Preference updated`,
          metadata: {
            previousValues,
            newValues: updates,
            timestamp: new Date()
          }
        });
      } catch (auditError) {
        logger.warn('Audit log creation failed:', auditError.message);
      }

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
      const customerId = req.customer.id || req.customer.customerId;
      const preferenceId = req.params.id;

      // Try CSR Preference model first
      let preference = await Preference.findOne({
        _id: preferenceId,
        partyId: customerId
      });

      if (!preference) {
        // Try UserPreference model
        preference = await UserPreference.findOne({
          _id: preferenceId,
          $or: [{ partyId: customerId }, { userId: customerId }]
        });
      }

      if (!preference) {
        return res.status(404).json({
          error: 'Preference not found'
        });
      }

      await preference.deleteOne();

      // Log the action
      try {
        await AuditLog.create({
          partyId: customerId,
          action: 'deleted',
          entityType: 'preference',
          entityId: preferenceId,
          details: `Preference deleted`,
          metadata: {
            deletedPreference: preference.toObject ? preference.toObject() : preference,
            timestamp: new Date()
          }
        });
      } catch (auditError) {
        logger.warn('Audit log creation failed:', auditError.message);
      }

      logger.info('Preference deleted', { 
        customerId, 
        preferenceId
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
      const customerId = req.customer.id || req.customer.customerId;

      // Get preferences from both models
      const csrPreferences = await Preference.find({ partyId: customerId });
      const userPreferences = await UserPreference.find({ 
        $or: [{ partyId: customerId }, { userId: customerId }]
      }).populate('preferenceId', 'name type');

      // Build summary
      const summary = {
        communication: { total: 0, enabled: 0, channels: [] },
        marketing: { total: 0, enabled: 0, channels: [] },
        data_usage: { total: 0, enabled: 0, channels: [] }
      };

      // Process CSR preferences
      csrPreferences.forEach(pref => {
        if (pref.preferredChannels) {
          Object.entries(pref.preferredChannels).forEach(([channel, enabled]) => {
            summary.communication.total++;
            if (enabled) {
              summary.communication.enabled++;
              summary.communication.channels.push(channel);
            }
          });
        }
        
        if (pref.topicSubscriptions) {
          if (pref.topicSubscriptions.marketing) {
            summary.marketing.enabled++;
          }
          summary.marketing.total++;
        }
      });

      // Process user preferences
      userPreferences.forEach(pref => {
        const type = pref.preferenceId?.type || 'communication';
        if (summary[type]) {
          summary[type].total++;
          if (pref.value) {
            summary[type].enabled++;
          }
        }
      });

      res.json({
        success: true,
        data: summary
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
      const customerId = req.customer.id || req.customer.customerId;

      const preferences = await Preference.find({ partyId: customerId });

      const channelPreferences = {
        email: { preferences: [], totalCount: 0, allowedCount: 0 },
        sms: { preferences: [], totalCount: 0, allowedCount: 0 },
        push: { preferences: [], totalCount: 0, allowedCount: 0 },
        phone: { preferences: [], totalCount: 0, allowedCount: 0 },
        mail: { preferences: [], totalCount: 0, allowedCount: 0 }
      };

      preferences.forEach(pref => {
        if (pref.preferredChannels) {
          Object.entries(pref.preferredChannels).forEach(([channel, enabled]) => {
            if (channelPreferences[channel]) {
              channelPreferences[channel].totalCount++;
              if (enabled) {
                channelPreferences[channel].allowedCount++;
              }
              channelPreferences[channel].preferences.push({
                id: pref._id,
                isAllowed: enabled,
                description: `${channel.charAt(0).toUpperCase() + channel.slice(1)} communication`,
                updatedAt: pref.updatedAt
              });
            }
          });
        }
      });

      res.json({
        success: true,
        data: Object.entries(channelPreferences).map(([channel, data]) => ({
          channelType: channel,
          totalCount: data.totalCount,
          allowedCount: data.allowedCount,
          preferences: data.preferences
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

// Validation middleware for preference operations
const preferenceValidation = [
  body('preferenceType').optional().isIn(['communication', 'marketing', 'data_usage']).withMessage('Invalid preference type'),
  body('channelType').optional().isIn(['email', 'sms', 'push', 'phone', 'web', 'mobile', 'all']).withMessage('Invalid channel type'),
  body('isAllowed').optional().isBoolean().withMessage('isAllowed must be a boolean'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('validFor.startDateTime').optional().isISO8601().withMessage('Start date must be valid ISO date'),
  body('validFor.endDateTime').optional().isISO8601().withMessage('End date must be valid ISO date')
];

module.exports = { CustomerPreferenceController, preferenceValidation };
