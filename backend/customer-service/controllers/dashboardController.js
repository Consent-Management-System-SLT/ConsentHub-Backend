const { logger } = require('../../shared/utils');
const Party = require('../../csr-service/models/Party');
const Consent = require('../../csr-service/models/Consent');
const Preference = require('../../csr-service/models/Preference');
const DSAR = require('../../csr-service/models/DSAR');
const AuditLog = require('../../csr-service/models/AuditLog');

class CustomerDashboardController {
  // Get customer dashboard overview
  async getDashboardOverview(req, res) {
    try {
      const customerId = req.customer.customerId;
      
      // For demo purposes, return mock data instead of querying database
      const mockDashboardData = {
        customer: {
          id: customerId,
          name: req.customer.name || 'Robert Johnson',
          email: req.customer.email || 'customer@sltmobitel.lk',
          accountStatus: 'active',
          joinDate: '2024-01-15',
          lastLogin: new Date().toISOString()
        },
        consentStats: {
          total: 12,
          granted: 8,
          revoked: 2,
          expired: 1,
          pending: 1
        },
        preferenceStats: {
          total: 6,
          enabled: 4,
          disabled: 2
        },
        dsarStats: {
          total: 3,
          pending: 1,
          completed: 2,
          inProgress: 0
        },
        recentActivity: [
          {
            id: '1',
            type: 'consent',
            action: 'granted',
            description: 'Marketing communications consent granted',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
          },
          {
            id: '2',
            type: 'preference',
            action: 'updated',
            description: 'Email notification preferences updated',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
          }
        ],
        notifications: [
          {
            id: '1',
            type: 'info',
            message: 'Your consent preferences have been updated successfully',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            read: false
          }
        ]
      };

      res.json({
        success: true,
        data: mockDashboardData
      });
    } catch (error) {
      logger.error('Error fetching dashboard overview:', error);
      res.status(500).json({
        error: 'Failed to retrieve dashboard overview'
      });
    }
  }

  // Get customer profile
  async getCustomerProfile(req, res) {
    try {
      const customerId = req.customer.customerId;
      
      const customer = await Party.findById(customerId)
        .select('-__v -createdAt -updatedAt');
      
      if (!customer) {
        return res.status(404).json({
          error: 'Customer not found'
        });
      }

      // Format the response
      const profile = {
        id: customer._id,
        name: customer.name,
        type: customer.type,
        status: customer.status,
        contactMedium: customer.contactMedium,
        characteristic: customer.characteristic,
        relatedParty: customer.relatedParty,
        account: customer.account,
        paymentMethod: customer.paymentMethod,
        contactable: customer.contactable,
        creditRating: customer.creditRating,
        engagedParty: customer.engagedParty,
        externalReference: customer.externalReference,
        partyCharacteristic: customer.partyCharacteristic,
        taxExemptionCertificate: customer.taxExemptionCertificate,
        lastLoginAt: customer.lastLoginAt
      };

      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      logger.error('Error fetching customer profile:', error);
      res.status(500).json({
        error: 'Failed to retrieve customer profile'
      });
    }
  }

  // Update customer profile
  async updateCustomerProfile(req, res) {
    try {
      const customerId = req.customer.id;
      const updates = req.body;

      // Remove sensitive fields that shouldn't be updated by customer
      delete updates._id;
      delete updates.createdAt;
      delete updates.updatedAt;
      delete updates.lastLoginAt;

      const customer = await Party.findByIdAndUpdate(
        customerId,
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).select('-__v');

      if (!customer) {
        return res.status(404).json({
          error: 'Customer not found'
        });
      }

      // Log the update
      await AuditLog.create({
        partyId: customerId,
        action: 'updated',
        entityType: 'customer_profile',
        entityId: customerId,
        details: `Customer profile updated`,
        metadata: {
          updatedFields: Object.keys(updates),
          timestamp: new Date()
        }
      });

      logger.info('Customer profile updated', { 
        customerId, 
        updatedFields: Object.keys(updates)
      });

      res.json({
        success: true,
        data: customer
      });
    } catch (error) {
      logger.error('Error updating customer profile:', error);
      res.status(500).json({
        error: 'Failed to update customer profile'
      });
    }
  }

  // Get customer activity history
  async getActivityHistory(req, res) {
    try {
      const customerId = req.customer.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const activities = await AuditLog.find({ partyId: customerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('action entityType entityId createdAt details metadata');

      const total = await AuditLog.countDocuments({ partyId: customerId });

      res.json({
        success: true,
        data: {
          activities: activities.map(activity => ({
            id: activity._id,
            action: activity.action,
            type: activity.entityType,
            entityId: activity.entityId,
            timestamp: activity.createdAt,
            description: activity.details || `${activity.action} ${activity.entityType}`,
            metadata: activity.metadata
          })),
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching activity history:', error);
      res.status(500).json({
        error: 'Failed to retrieve activity history'
      });
    }
  }

  // Get customer summary for quick overview
  async getCustomerSummary(req, res) {
    try {
      const customerId = req.customer.id;
      
      // Get counts in parallel
      const [consentsCount, preferencesCount, dsarCount, customer] = await Promise.all([
        Consent.countDocuments({ partyId: customerId }),
        Preference.countDocuments({ partyId: customerId }),
        DSAR.countDocuments({ partyId: customerId }),
        Party.findById(customerId).select('name contactMedium createdAt')
      ]);

      if (!customer) {
        return res.status(404).json({
          error: 'Customer not found'
        });
      }

      const summary = {
        id: customerId,
        name: customer.name,
        email: customer.contactMedium?.find(c => c.type === 'email')?.value,
        memberSince: customer.createdAt,
        counters: {
          consents: consentsCount,
          preferences: preferencesCount,
          dsarRequests: dsarCount
        }
      };

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Error fetching customer summary:', error);
      res.status(500).json({
        error: 'Failed to retrieve customer summary'
      });
    }
  }
}

module.exports = new CustomerDashboardController();
