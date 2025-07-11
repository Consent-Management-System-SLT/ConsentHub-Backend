const PrivacyPreference = require('../models/PrivacyPreference');
const { generateUUID, logger, createAuditLog } = require('../../shared/utils');
const axios = require('axios');

class PreferenceController {
  // Create new privacy preference
  async createPreference(req, res) {
    try {
      const preferenceData = {
        id: generateUUID(),
        partyId: req.body.partyId,
        notificationPreferences: req.body.notificationPreferences || {},
        communicationPreferences: req.body.communicationPreferences || {},
        dataProcessingPreferences: req.body.dataProcessingPreferences || {},
        geoLocation: req.body.geoLocation,
        validityPeriod: req.body.validityPeriod,
      };

      const preference = new PrivacyPreference(preferenceData);
      await preference.save();

      // Create audit log
      await createAuditLog(
        'CREATE_PREFERENCE',
        req.user.uid,
        'preference-service',
        { preferenceId: preference.id, partyId: preference.partyId }
      );

      // Emit event
      await this.emitPreferenceEvent('PrivacyPreferenceCreated', preference);

      logger.info(`Privacy preference created: ${preference.id}`);
      res.status(201).json(preference);
    } catch (error) {
      logger.error('Error creating preference:', error);
      res.status(500).json({ error: 'Failed to create preference' });
    }
  }

  // Get preferences by partyId
  async getPreferencesByParty(req, res) {
    try {
      const { partyId } = req.params;
      
      // Check if user has permission to access this party's preferences
      if (req.user.role === 'customer' && partyId !== req.user.uid) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const preferences = await PrivacyPreference.findOne({ partyId });

      if (!preferences) {
        return res.status(404).json({ error: 'Preferences not found' });
      }

      res.json(preferences);
    } catch (error) {
      logger.error('Error fetching preferences:', error);
      res.status(500).json({ error: 'Failed to fetch preferences' });
    }
  }

  // Update preferences
  async updatePreference(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const preference = await PrivacyPreference.findOne({ id });
      if (!preference) {
        return res.status(404).json({ error: 'Preference not found' });
      }

      // Check if user has permission to update this preference
      if (req.user.role === 'customer' && preference.partyId !== req.user.uid) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      Object.assign(preference, updateData);
      await preference.save();

      // Create audit log
      await createAuditLog(
        'UPDATE_PREFERENCE',
        req.user.uid,
        'preference-service',
        { preferenceId: preference.id, partyId: preference.partyId }
      );

      // Emit event
      await this.emitPreferenceEvent('PrivacyPreferenceUpdated', preference);

      logger.info(`Privacy preference updated: ${preference.id}`);
      res.json(preference);
    } catch (error) {
      logger.error('Error updating preference:', error);
      res.status(500).json({ error: 'Failed to update preference' });
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(req, res) {
    try {
      const { partyId } = req.params;
      const { channel, preferences } = req.body;

      // Check if user has permission to update this party's preferences
      if (req.user.role === 'customer' && partyId !== req.user.uid) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const preference = await PrivacyPreference.findOne({ partyId });
      if (!preference) {
        return res.status(404).json({ error: 'Preference not found' });
      }

      if (channel && preference.notificationPreferences[channel]) {
        Object.assign(preference.notificationPreferences[channel], preferences);
      } else {
        Object.assign(preference.notificationPreferences, preferences);
      }

      await preference.save();

      // Create audit log
      await createAuditLog(
        'UPDATE_NOTIFICATION_PREFERENCE',
        req.user.uid,
        'preference-service',
        { preferenceId: preference.id, partyId: preference.partyId, channel }
      );

      // Emit event
      await this.emitPreferenceEvent('NotificationPreferenceUpdated', preference);

      logger.info(`Notification preference updated: ${preference.id}`);
      res.json(preference);
    } catch (error) {
      logger.error('Error updating notification preferences:', error);
      res.status(500).json({ error: 'Failed to update notification preferences' });
    }
  }

  // Register device token for push notifications
  async registerDeviceToken(req, res) {
    try {
      const { partyId } = req.params;
      const { token, platform } = req.body;

      // Check if user has permission to register token for this party
      if (req.user.role === 'customer' && partyId !== req.user.uid) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const preference = await PrivacyPreference.findOne({ partyId });
      if (!preference) {
        return res.status(404).json({ error: 'Preference not found' });
      }

      // Remove existing token if it exists
      preference.notificationPreferences.push.deviceTokens = 
        preference.notificationPreferences.push.deviceTokens.filter(
          dt => dt.token !== token
        );

      // Add new token
      preference.notificationPreferences.push.deviceTokens.push({
        token,
        platform,
        registeredAt: new Date(),
      });

      await preference.save();

      // Create audit log
      await createAuditLog(
        'REGISTER_DEVICE_TOKEN',
        req.user.uid,
        'preference-service',
        { preferenceId: preference.id, partyId: preference.partyId, platform }
      );

      logger.info(`Device token registered for party: ${partyId}`);
      res.json({ message: 'Device token registered successfully' });
    } catch (error) {
      logger.error('Error registering device token:', error);
      res.status(500).json({ error: 'Failed to register device token' });
    }
  }

  // Get communication preferences for a party
  async getCommunicationPreferences(req, res) {
    try {
      const { partyId } = req.params;
      const { category } = req.query;

      // Check if user has permission to access this party's preferences
      if (req.user.role === 'customer' && partyId !== req.user.uid) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const preference = await PrivacyPreference.findOne({ partyId });
      if (!preference) {
        return res.status(404).json({ error: 'Preference not found' });
      }

      let result = {
        partyId,
        communicationPreferences: preference.communicationPreferences,
      };

      if (category) {
        result.notificationSettings = {
          sms: preference.notificationPreferences.sms.categories[category] || false,
          email: preference.notificationPreferences.email.categories[category] || false,
          push: preference.notificationPreferences.push.categories[category] || false,
          inApp: preference.notificationPreferences.inApp.categories[category] || false,
        };
      }

      res.json(result);
    } catch (error) {
      logger.error('Error fetching communication preferences:', error);
      res.status(500).json({ error: 'Failed to fetch communication preferences' });
    }
  }

  // Get all preferences with pagination
  async getAllPreferences(req, res) {
    try {
      const { limit = 10, offset = 0, partyId } = req.query;

      const filter = {};
      if (partyId) filter.partyId = partyId;

      const preferences = await PrivacyPreference.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset));

      const total = await PrivacyPreference.countDocuments(filter);

      res.json({
        preferences,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total,
        },
      });
    } catch (error) {
      logger.error('Error fetching preferences:', error);
      res.status(500).json({ error: 'Failed to fetch preferences' });
    }
  }

  // Helper method to emit events
  async emitPreferenceEvent(eventType, preference) {
    try {
      const eventServiceUrl = process.env.EVENT_SERVICE_URL || 'http://localhost:3005';
      await axios.post(`${eventServiceUrl}/events`, {
        eventType,
        source: 'preference-service',
        data: preference,
      });
    } catch (error) {
      logger.error('Failed to emit event:', error);
    }
  }
}

module.exports = new PreferenceController();
