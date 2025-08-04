const Preference = require('../models/Preference');
const Party = require('../models/Party');
const AuditLog = require('../models/AuditLog');
const { logger } = require('../../shared/utils');

// Create new preference
exports.createPreference = async (req, res) => {
  try {
    const { partyId, ...rest } = req.body;
    const preference = new Preference({ partyId, ...rest });
    await preference.save();

    console.log('New Preference:', preference);

    await AuditLog.create({
      action: 'CREATE',
      entity: 'Preference',
      entityId: preference.id,
      newValue: preference,
    });

    res.status(201).json(preference);
  } catch (error) {
    logger.error('Error creating preference:', error);
    res.status(500).json({ error: 'Failed to create preference' });
  }
};

// Get all preferences with filters
exports.getAllPreferences = async (req, res) => {
  try {
    const {
      customerId,
      page = 1,
      limit = 50,
      preferenceType,
      channelType,
      isAllowed,
    } = req.query;

    let query = {};

    if (customerId) {
      const party = await Party.findOne({ customerId });
      if (!party) {
        return res.status(404).json({ error: 'No party found for this customer' });
      }
      query.partyId = party._id;
    }

    if (preferenceType) query.preferenceType = preferenceType;
    if (channelType) query.channelType = channelType;
    if (isAllowed !== undefined) query.isAllowed = isAllowed === 'true';

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const preferences = await Preference.find(query)
      .limit(parseInt(limit))
      .skip(offset)
      .sort({ updatedAt: -1 });

    const total = await Preference.countDocuments(query);

    res.json({
      preferences,
      total,
      limit: parseInt(limit),
      offset,
      page: parseInt(page),
    });
  } catch (error) {
    logger.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
};

// Get preference by ID
exports.getPreferenceById = async (req, res) => {
  try {
    const preference = await Preference.findOne({ id: req.params.id });

    if (!preference) {
      return res.status(404).json({ error: 'Preference not found' });
    }

    console.log('Fetched Preference by ID:', preference);

    res.json(preference);
  } catch (error) {
    logger.error('Error retrieving preference:', error);
    res.status(500).json({ error: 'Failed to retrieve preference' });
  }
};

// Update preference
exports.updatePreference = async (req, res) => {
  try {
    const existing = await Preference.findOne({ id: req.params.id });
    if (!existing) return res.status(404).json({ error: 'Preference not found' });

    const updated = await Preference.findOneAndUpdate({ id: req.params.id }, req.body, {
      new: true,
    });

    console.log('Updated Preference:', updated);

    await AuditLog.create({
      action: 'UPDATE',
      entity: 'Preference',
      entityId: updated.id,
      oldValue: existing,
      newValue: updated,
    });

    res.json(updated);
  } catch (error) {
    logger.error('Error updating preference:', error);
    res.status(500).json({ error: 'Failed to update preference' });
  }
};

// Delete preference
exports.deletePreference = async (req, res) => {
  try {
    const deleted = await Preference.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Preference not found' });

    console.log('Deleted Preference:', deleted);

    await AuditLog.create({
      action: 'DELETE',
      entity: 'Preference',
      entityId: deleted.id,
      oldValue: deleted,
    });

    res.status(204).end();
  } catch (error) {
    logger.error('Error deleting preference:', error);
    res.status(500).json({ error: 'Failed to delete preference' });
  }
};

// Get preferences by party ID
exports.getPreferenceByPartyId = async (req, res) => {
  try {
    const { partyId } = req.params;

    const preferences = await Preference.find({ partyId }).sort({ updatedAt: -1 });

    if (!preferences || preferences.length === 0) {
      return res.status(404).json({ error: 'No preferences found for this party' });
    }

    console.log(`Preferences for party ${partyId}:`, preferences);

    res.json(preferences);
  } catch (error) {
    logger.error('Error fetching preferences by partyId:', error);
    res.status(500).json({ error: 'Failed to fetch preferences by partyId' });
  }
};

// Create or update preference by party ID
exports.createOrUpdatePreferenceByPartyId = async (req, res) => {
  try {
    const { partyId } = req.params;
    const updatedFields = req.body;

    let preference = await Preference.findOne({ partyId });

    if (preference) {
      const oldValue = { ...preference.toObject() };

      preference = await Preference.findOneAndUpdate({ partyId }, updatedFields, {
        new: true,
      });

      await AuditLog.create({
        action: 'UPDATE',
        entity: 'Preference',
        entityId: preference.id,
        oldValue,
        newValue: preference,
      });
    } else {
      preference = new Preference({ partyId, ...updatedFields });
      await preference.save();

      await AuditLog.create({
        action: 'CREATE',
        entity: 'Preference',
        entityId: preference.id,
        newValue: preference,
      });
    }

    console.log('Created or Updated Preference by partyId:', preference);

    res.status(200).json(preference);
  } catch (error) {
    logger.error('Error creating or updating preference by partyId:', error);
    res.status(500).json({ error: 'Failed to process preference by partyId' });
  }
};
