const { logger } = require('../../shared/utils');
const VASSubscription = require('../../../../models/VASSubscription');
const VASService = require('../../../../models/VASService');

class VASController {
  // Get all available VAS services
  async getVASServices(req, res) {
    try {
      const customerId = req.customer.customerId;
      const customerEmail = req.customer.email;
      
      console.log(`🔍 VAS: Fetching services for customer ${customerId} (${customerEmail})`);
      
      // Fetch all VAS services from MongoDB (same as admin sees)
      const allVASServices = await VASService.find({ status: 'active' }).sort({ popularity: -1 });
      console.log(`📋 VAS: Found ${allVASServices.length} active VAS services in database`);
      
      // Fetch customer's current subscriptions from MongoDB
      const customerSubscriptions = await VASSubscription.getCustomerSubscriptions(customerId, customerEmail);
      
      // Create a map of subscribed services for quick lookup
      const subscriptionMap = {};
      
      console.log(`🔍 VAS: Found ${customerSubscriptions.length} subscription records for customer ${customerId}`);
      
      customerSubscriptions.forEach(sub => {
        // Only set to true if explicitly subscribed in database
        const isSubscribedValue = sub.isSubscribed === true;
        subscriptionMap[sub.serviceId] = isSubscribedValue;
        console.log(`🔍 VAS: Service ${sub.serviceId} -> ${isSubscribedValue}`);
      });
      
      // Map database services to customer format with subscription status
      const servicesWithSubscriptionStatus = allVASServices.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        category: service.category,
        provider: service.provider,
        price: service.price,
        features: service.features || [],
        benefits: service.benefits || [],
        popularity: service.popularity || 0,
        isSubscribed: subscriptionMap[service.id] === true, // Check if customer is subscribed
      }));
      
      console.log(`✅ VAS: Returning ${servicesWithSubscriptionStatus.length} services to customer`);
      console.log(`📊 VAS: Subscribed services: ${servicesWithSubscriptionStatus.filter(s => s.isSubscribed).length}`);
      
      res.json({
        success: true,
        data: servicesWithSubscriptionStatus,
        message: 'VAS services retrieved successfully'
      });

    } catch (error) {
      logger.error('Error retrieving VAS services:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve VAS services',
        error: error.message
      });
    }
  }

  // Toggle VAS service subscription
  async toggleVASSubscription(req, res) {
    try {
      const customerId = req.customer.customerId;
      const customerEmail = req.customer.email;
      const { serviceId } = req.params;
      const { action } = req.body; // 'subscribe' or 'unsubscribe'

      // Enhanced console logging for VAS subscription operations
      console.log('\n========== VAS SUBSCRIPTION REQUEST ==========');
      console.log(`Customer ID: ${customerId}`);
      console.log(`Customer Email: ${customerEmail}`);
      console.log(`Service ID: ${serviceId}`);
      console.log(`Action: ${action.toUpperCase()}`);
      console.log(`Request Time: ${new Date().toISOString()}`);
      console.log(`Request IP: ${req.ip || req.connection.remoteAddress}`);
      console.log(`User Agent: ${req.headers['user-agent']}`);

      // Validate action
      if (!['subscribe', 'unsubscribe'].includes(action)) {
        console.log(`Invalid action: ${action}`);
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Must be "subscribe" or "unsubscribe"'
        });
      }

      // Validate serviceId by checking if it exists in the database
      console.log(`🔍 VAS Debug: Validating service ID: ${serviceId}`);
      console.log(`🔍 VAS Debug: Service ID type: ${typeof serviceId}`);
      console.log(`🔍 VAS Debug: Service ID length: ${serviceId.length}`);
      
      let serviceExists;
      try {
        // First try to find by MongoDB _id (ObjectId)
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(serviceId)) {
          console.log(`🔍 VAS Debug: Searching by ObjectId: ${serviceId}`);
          try {
            serviceExists = await VASService.findOne({ _id: serviceId, status: 'active' });
            console.log(`🔍 VAS Debug: ObjectId search result:`, serviceExists ? `Found: ${serviceExists.name}` : 'Not found');
          } catch (objectIdError) {
            console.log(`🔍 VAS Debug: ObjectId search failed: ${objectIdError.message}`);
            serviceExists = null;
          }
        }
        
        // If not found by ObjectId, try custom ID field
        if (!serviceExists) {
          console.log(`🔍 VAS Debug: Searching by custom ID field: ${serviceId}`);
          serviceExists = await VASService.findOne({ id: serviceId, status: 'active' });
          console.log(`🔍 VAS Debug: Custom ID search result:`, serviceExists ? `Found: ${serviceExists.name}` : 'Not found');
        }
        
        console.log(`🔍 VAS Debug: Database query result:`, serviceExists ? 'FOUND' : 'NOT FOUND');
        
        if (serviceExists) {
          console.log(`🔍 VAS Debug: Found service: ${serviceExists.name} (Status: ${serviceExists.status})`);
          console.log(`🔍 VAS Debug: Service _id: ${serviceExists._id}`);
          console.log(`🔍 VAS Debug: Service custom id: ${serviceExists.id}`);
        } else {
          console.log(`🔍 VAS Debug: Service ID "${serviceId}" not found in database`);
          console.log(`🔍 VAS Debug: Tried both ObjectId and custom ID field searches`);
        }
      } catch (error) {
        console.log(`🔍 VAS Debug: Error validating service ID: ${error.message}`);
        serviceExists = null;
      }
      
      if (!serviceExists) {
        console.log(`❌ VAS Debug: Invalid or inactive service ID: ${serviceId}`);
        console.log(`❌ VAS Debug [v2.0]: Service not found in database using flexible ID matching`);
        return res.status(400).json({
          success: false,
          message: `Invalid or inactive service ID: ${serviceId}. Service not found in database using flexible ID matching.`
        });
      }

      // Get service name from the database
      const serviceName = serviceExists.name;

      console.log(`Processing ${action} request for service ${serviceName}...`);

      // Update subscription in MongoDB
      const requestInfo = {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      };

      const subscription = await VASSubscription.updateSubscription(
        customerId,
        customerEmail,
        serviceId,
        serviceName,
        action,
        requestInfo
      );

      const isSubscribed = subscription.isSubscribed;

      console.log(`VAS service ${action} successful!`);
      console.log(`New subscription status: ${isSubscribed ? 'SUBSCRIBED' : 'UNSUBSCRIBED'}`);
      console.log(`Billing impact: ${isSubscribed ? 'Service will be added to next bill' : 'Service will be removed from next bill'}`);
      console.log(`Database record updated: ${subscription._id}`);

      logger.info(`VAS service ${action} successful`, { 
        customerId, 
        customerEmail,
        serviceId, 
        serviceName,
        action, 
        isSubscribed,
        subscriptionId: subscription._id,
        timestamp: new Date().toISOString(),
        ip: req.ip || req.connection.remoteAddress
      });

      // 🔌 Emit WebSocket event for real-time updates
      const vasUpdateEvent = {
        type: 'vas_subscription_update',
        customerId,
        customerEmail,
        serviceId,
        serviceName,
        isSubscribed,
        action,
        timestamp: subscription.updatedAt || new Date().toISOString(),
        subscriptionId: subscription._id
      };

      // Emit to the specific customer's room
      if (global.io) {
        global.io.to(`customer_${customerId}`).emit('vasSubscriptionUpdate', vasUpdateEvent);
        console.log(`🔌 WebSocket: Emitted VAS update to customer_${customerId}:`, vasUpdateEvent);
        
        // Also emit to admin/CSR dashboard for monitoring
        global.io.to('csr-dashboard').emit('customerVasUpdate', {
          ...vasUpdateEvent,
          customerIdentifier: customerEmail
        });
        console.log(`🔌 WebSocket: Emitted VAS update to CSR dashboard for customer ${customerEmail}`);
      } else {
        console.log('⚠️  WebSocket: Global io not available, skipping real-time update');
      }

      console.log(`Request completed successfully at: ${new Date().toISOString()}`);
      console.log('================================================\n');

      res.json({
        success: true,
        message: `Successfully ${action}d to service`,
        data: {
          serviceId,
          serviceName,
          isSubscribed,
          action,
          timestamp: subscription.updatedAt || new Date().toISOString(),
          subscriptionId: subscription._id,
          subscriptionHistory: subscription.subscriptionHistory.slice(-3) // Last 3 actions
        }
      });

    } catch (error) {
      console.log('\n========== VAS SUBSCRIPTION ERROR ==========');
      console.error('Error details:', error);
      console.log(`Error time: ${new Date().toISOString()}`);
      console.log('==============================================\n');
      
      logger.error('Error toggling VAS subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update subscription',
        error: error.message
      });
    }
  }

  // Get VAS subscription history
  async getVASSubscriptionHistory(req, res) {
    try {
      const customerId = req.customer.customerId;

      // Mock subscription history data
      const subscriptionHistory = [
        {
          id: '1',
          serviceId: 'telelife-insurance',
          serviceName: 'Telelife Life Insurance',
          action: 'subscribe',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days ago
          status: 'active'
        },
        {
          id: '2',
          serviceId: 'peo-tv',
          serviceName: 'PEO TV',
          action: 'subscribe',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(), // 45 days ago
          status: 'active'
        },
        {
          id: '3',
          serviceId: 'kaspersky-security',
          serviceName: 'Kaspersky Internet Security',
          action: 'subscribe',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(), // 60 days ago
          status: 'active'
        },
        {
          id: '4',
          serviceId: 'usage-reports',
          serviceName: 'Usage Reports & SMS Alerts',
          action: 'subscribe',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(), // 90 days ago
          status: 'active'
        },
        {
          id: '5',
          serviceId: 'slt-storage',
          serviceName: 'SLT Akaza Cloud Storage',
          action: 'subscribe',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(), // 120 days ago
          status: 'active'
        }
      ];

      logger.info('VAS subscription history retrieved', { customerId, historyCount: subscriptionHistory.length });

      res.json({
        success: true,
        data: subscriptionHistory,
        meta: {
          total: subscriptionHistory.length,
          activeSubscriptions: subscriptionHistory.filter(h => h.status === 'active').length
        }
      });

    } catch (error) {
      logger.error('Error retrieving VAS subscription history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve subscription history',
        error: error.message
      });
    }
  }

  // Get VAS service details
  async getVASServiceDetails(req, res) {
    try {
      const { serviceId } = req.params;
      const customerId = req.customer.customerId;

      // This would typically query the database for detailed service information
      // For now, return detailed mock data for any service
      const serviceDetails = {
        id: serviceId,
        name: 'Sample VAS Service',
        description: 'Detailed description of the selected VAS service',
        category: 'entertainment',
        provider: 'SLT Mobitel',
        price: 'LKR 500/month',
        features: [
          'Feature 1',
          'Feature 2',
          'Feature 3'
        ],
        termsAndConditions: [
          'Terms and conditions apply',
          'Service subject to availability',
          'Billing cycle is monthly'
        ],
        supportContact: {
          phone: '1212',
          email: 'support@sltmobitel.lk',
          hours: '24/7'
        }
      };

      logger.info('VAS service details retrieved', { customerId, serviceId });

      res.json({
        success: true,
        data: serviceDetails
      });

    } catch (error) {
      logger.error('Error retrieving VAS service details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve service details',
        error: error.message
      });
    }
  }

  // CSR Methods for Managing Customer VAS Subscriptions

  // Get customer VAS services for CSR dashboard
  async getCustomerVASForCSR(req, res) {
    try {
      const csrUser = req.user; // CSR authentication
      const customerEmail = req.query.customerEmail;
      const customerId = req.query.customerId;

      console.log('\n========== CSR VAS REQUEST ==========');
      console.log(`CSR User: ${csrUser.email} (ID: ${csrUser.id})`);
      console.log(`Target Customer: ${customerEmail} (ID: ${customerId})`);
      console.log(`Request Time: ${new Date().toISOString()}`);

      if (!customerEmail || !customerId) {
        return res.status(400).json({
          success: false,
          message: 'Customer email and ID are required in headers'
        });
      }

      // Fetch customer's current subscriptions from MongoDB
      const customerSubscriptions = await VASSubscription.getCustomerSubscriptions(customerId, customerEmail);
      
      // Create a map of subscribed services for quick lookup
      const subscriptionMap = {};
      
      console.log(`🔍 CSR VAS: Found ${customerSubscriptions.length} subscription records for customer ${customerId}`);
      
      customerSubscriptions.forEach(sub => {
        const isSubscribedValue = sub.isSubscribed === true;
        subscriptionMap[sub.serviceId] = isSubscribedValue;
        console.log(`🔍 CSR VAS: Service ${sub.serviceId} -> ${isSubscribedValue}`);
      });
      
      // Fetch all active VAS services from database
      const allVASServices = await VASService.find({ status: 'active' }).sort({ popularity: -1 });
      
      // Map VAS services with customer subscription status
      const vasServices = allVASServices.map(service => ({
        id: service.id, // Use service.id (short form) instead of _id for consistency
        name: service.name,
        description: service.description,
        category: service.category,
        provider: service.provider,
        price: service.price,
        features: service.features || [],
        benefits: service.benefits || [],
        isSubscribed: subscriptionMap[service.id] === true, // Look up by service.id for consistency
        popularity: service.popularity || 0
      }));
      console.log(`CSR VAS services loaded for customer: ${customerEmail}`);
      console.log(`Active subscriptions: ${vasServices.filter(s => s.isSubscribed).length}`);

      logger.info('CSR VAS services retrieved successfully', { 
        csrUserId: csrUser.id,
        csrEmail: csrUser.email,
        customerId, 
        customerEmail,
        serviceCount: vasServices.length,
        activeSubscriptions: vasServices.filter(s => s.isSubscribed).length
      });

      res.json({
        success: true,
        data: vasServices,
        meta: {
          total: vasServices.length,
          subscribed: vasServices.filter(s => s.isSubscribed).length,
          categories: [...new Set(vasServices.map(s => s.category))],
          customerInfo: {
            customerId,
            customerEmail
          },
          csrInfo: {
            csrId: csrUser.id,
            csrEmail: csrUser.email
          }
        }
      });

    } catch (error) {
      console.error('CSR VAS Error:', error);
      logger.error('Error retrieving customer VAS for CSR:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve customer VAS services',
        error: error.message
      });
    }
  }

  // Toggle customer VAS subscription for CSR dashboard
  async toggleCustomerVASForCSR(req, res) {
    try {
      const csrUser = req.user; // CSR authentication
      const customerEmail = req.body.customerEmail;
      const customerId = req.body.customerId;
      const { serviceId } = req.params;
      const { action } = req.body; // 'subscribe' or 'unsubscribe'

      console.log('\n========== CSR VAS SUBSCRIPTION REQUEST ==========');
      console.log(`CSR User: ${csrUser.email} (ID: ${csrUser.id})`);
      console.log(`Target Customer: ${customerEmail} (ID: ${customerId})`);
      console.log(`Service ID: ${serviceId}`);
      console.log(`Action: ${action.toUpperCase()}`);
      console.log(`Request Time: ${new Date().toISOString()}`);

      if (!customerEmail || !customerId) {
        return res.status(400).json({
          success: false,
          message: 'Customer email and ID are required in headers'
        });
      }

      // Validate action
      if (!['subscribe', 'unsubscribe'].includes(action)) {
        console.log(`Invalid action: ${action}`);
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Must be "subscribe" or "unsubscribe"'
        });
      }

      // Validate serviceId by checking if it exists in the database
      console.log(`🔍 CSR VAS Debug: Validating service ID: ${serviceId}`);
      
      let serviceExists;
      try {
        // First try to find by MongoDB _id (ObjectId)
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(serviceId)) {
          console.log(`🔍 CSR VAS Debug: Searching by ObjectId: ${serviceId}`);
          serviceExists = await VASService.findOne({ _id: serviceId, status: 'active' });
        } else {
          console.log(`🔍 CSR VAS Debug: Searching by custom ID field: ${serviceId}`);
          // If not a valid ObjectId, search by custom 'id' field (for legacy services)
          serviceExists = await VASService.findOne({ id: serviceId, status: 'active' });
        }
        
        console.log(`🔍 CSR VAS Debug: Database query result:`, serviceExists ? 'FOUND' : 'NOT FOUND');
        
        if (serviceExists) {
          console.log(`🔍 CSR VAS Debug: Found service: ${serviceExists.name} (Status: ${serviceExists.status})`);
        }
      } catch (error) {
        console.log(`🔍 CSR VAS Debug: Error validating service ID: ${error.message}`);
        serviceExists = null;
      }
      
      if (!serviceExists) {
        console.log(`❌ CSR VAS Debug: Invalid or inactive service ID: ${serviceId}`);
        return res.status(400).json({
          success: false,
          message: `Invalid or inactive service ID: ${serviceId}`
        });
      }

      // Get service name from the database
      const serviceName = serviceExists.name;

      console.log(`CSR processing ${action} request for service ${serviceName}...`);

      // Update subscription in MongoDB with CSR info
      const requestInfo = {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        csrUser: {
          id: csrUser.id,
          email: csrUser.email,
          name: csrUser.name || csrUser.email
        },
        actionBy: 'CSR'
      };

      const subscription = await VASSubscription.updateSubscription(
        customerId,
        customerEmail,
        serviceId,
        serviceName,
        action,
        requestInfo
      );

      const isSubscribed = subscription.isSubscribed;

      console.log(`CSR VAS service ${action} successful!`);
      console.log(`New subscription status: ${isSubscribed ? 'SUBSCRIBED' : 'UNSUBSCRIBED'}`);
      console.log(`Action performed by CSR: ${csrUser.email}`);
      console.log(`Database record updated: ${subscription._id}`);

      logger.info(`CSR VAS service ${action} successful`, { 
        csrUserId: csrUser.id,
        csrEmail: csrUser.email,
        customerId, 
        customerEmail,
        serviceId, 
        serviceName,
        action, 
        isSubscribed,
        subscriptionId: subscription._id,
        timestamp: new Date().toISOString(),
        actionBy: 'CSR'
      });

      console.log(`CSR request completed successfully at: ${new Date().toISOString()}`);
      console.log('=====================================================\n');

      // Emit real-time update to CSR dashboard
      if (global.io) {
        const csrVasUpdateEvent = {
          customerId,
          customerEmail,
          serviceId,
          serviceName,
          isSubscribed,
          action,
          timestamp: subscription.updatedAt || new Date().toISOString(),
          csrInfo: {
            csrId: csrUser.id,
            csrEmail: csrUser.email
          }
        };

        console.log('🔄 CSR Dashboard: Broadcasting VAS update to all CSR dashboards:', csrVasUpdateEvent);
        global.io.to('csr-dashboard').emit('csrVasUpdate', csrVasUpdateEvent);

        // Also send to customer if they're online
        console.log('🔄 Customer Update: Broadcasting VAS update to customer:', customerId);
        global.io.to(`customer_${customerId}`).emit('vasSubscriptionUpdate', {
          serviceId,
          serviceName,
          isSubscribed,
          action,
          timestamp: subscription.updatedAt || new Date().toISOString(),
          source: 'CSR'
        });
      }

      res.json({
        success: true,
        message: `Successfully ${action}d customer to service`,
        data: {
          serviceId,
          serviceName,
          isSubscribed,
          action,
          timestamp: subscription.updatedAt || new Date().toISOString(),
          subscriptionId: subscription._id,
          customerInfo: {
            customerId,
            customerEmail
          },
          csrInfo: {
            csrId: csrUser.id,
            csrEmail: csrUser.email
          },
          subscriptionHistory: subscription.subscriptionHistory.slice(-3) // Last 3 actions
        }
      });

    } catch (error) {
      console.log('\n========== CSR VAS SUBSCRIPTION ERROR ==========');
      console.error('Error details:', error);
      console.log(`Error time: ${new Date().toISOString()}`);
      console.log('===============================================\n');
      
      logger.error('Error toggling customer VAS subscription for CSR:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update customer subscription',
        error: error.message
      });
    }
  }
}

module.exports = new VASController();
