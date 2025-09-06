const { logger } = require('../../shared/utils');
const VASSubscription = require('../../../../models/VASSubscription');

class VASController {
  // Get all available VAS services
  async getVASServices(req, res) {
    try {
      const customerId = req.customer.customerId;
      const customerEmail = req.customer.email;
      
      // Fetch customer's current subscriptions from MongoDB
      const customerSubscriptions = await VASSubscription.getCustomerSubscriptions(customerId, customerEmail);
      
      // Create a map of subscribed services for quick lookup
      // All services default to unsubscribed (false) unless explicitly subscribed
      const subscriptionMap = {};
      
      console.log(`🔍 VAS: Found ${customerSubscriptions.length} subscription records for customer ${customerId}`);
      console.log('🔍 VAS: Customer subscriptions:', customerSubscriptions.map(s => ({ serviceId: s.serviceId, isSubscribed: s.isSubscribed })));
      
      customerSubscriptions.forEach(sub => {
        // Only set to true if explicitly subscribed in database
        const isSubscribedValue = sub.isSubscribed === true;
        subscriptionMap[sub.serviceId] = isSubscribedValue;
        console.log(`🔍 VAS: Service ${sub.serviceId} -> ${isSubscribedValue}`);
      });
      
      console.log('✅ VAS: Using actual subscription status from MongoDB');
      
      // Mock VAS services data - 6 popular SLT services for subscription
      const vasServices = [
        {
          id: 'slt-filmhall',
          name: 'SLT Filmhall',
          description: 'Premium OTT streaming platform with movies, TV shows, music, and games. Enjoy unlimited entertainment on any device.',
          category: 'entertainment',
          provider: 'SLT Mobitel',
          price: 'LKR 299/month',
          features: [
            'HD & 4K video streaming',
            'Unlimited music downloads',
            'Interactive gaming platform',
            'Multi-device access',
            'Offline viewing capability',
            'Family sharing (up to 5 profiles)'
          ],
          isSubscribed: subscriptionMap['slt-filmhall'] === true, // Explicitly check for true
          popularity: 95,
          benefits: ['Premium content', 'No ads', 'Family friendly']
        },
        {
          id: 'peo-tv',
          name: 'PEO TV Plus',
          description: 'Complete IPTV solution with 200+ channels, sports packages, and premium entertainment content.',
          category: 'entertainment',
          provider: 'SLT Net',
          price: 'LKR 1,200/month',
          features: [
            '200+ live TV channels',
            'Premium sports channels',
            'Time-shift & catch-up TV',
            'Video-on-demand library',
            '4K Ultra HD content',
            'Multi-room viewing'
          ],
          isSubscribed: subscriptionMap['peo-tv'] === true, // Explicitly check for true
          popularity: 92,
          benefits: ['Live sports', 'Premium channels', 'Family entertainment']
        },
        {
          id: 'kaspersky-security',
          name: 'Kaspersky Total Security',
          description: 'Complete digital protection for your family with antivirus, VPN, password manager, and parental controls.',
          category: 'security',
          provider: 'Kaspersky Lab',
          price: 'LKR 450/month',
          features: [
            'Real-time antivirus protection',
            'Secure VPN (unlimited data)',
            'Password manager',
            'Parental controls & monitoring',
            'Safe banking & shopping',
            'Identity theft protection'
          ],
          isSubscribed: subscriptionMap['kaspersky-security'] === true, // Explicitly check for true
          popularity: 88,
          benefits: ['Complete security', 'Family protection', 'Privacy shield']
        },
        {
          id: 'e-channelling-plus',
          name: 'e-Channelling Health+',
          description: 'Comprehensive healthcare service with doctor consultations, lab bookings, and health monitoring.',
          category: 'healthcare',
          provider: 'e-Channelling (SLT)',
          price: 'LKR 650/month',
          features: [
            'Unlimited doctor consultations',
            'Lab test bookings & home collection',
            'Prescription delivery',
            'Health record management',
            '24/7 medical helpline',
            'Specialist referrals'
          ],
          isSubscribed: subscriptionMap['e-channelling-plus'] === true, // Explicitly check for true
          popularity: 86,
          benefits: ['Healthcare access', 'Home services', 'Emergency support']
        },
        {
          id: 'slt-cloud-pro',
          name: 'SLT Cloud Pro',
          description: 'Professional cloud storage and collaboration suite with advanced security and team features.',
          category: 'cloud',
          provider: 'SLT Digital Services',
          price: 'LKR 850/month',
          features: [
            '1TB secure cloud storage',
            'Real-time collaboration tools',
            'Advanced file sharing',
            'Automated backup',
            'Version control & history',
            'Enterprise-grade security'
          ],
          isSubscribed: subscriptionMap['slt-cloud-pro'] === true, // Explicitly check for true
          popularity: 78,
          benefits: ['Secure storage', 'Team collaboration', 'Business tools']
        },
        {
          id: 'slt-international-roaming',
          name: 'International Roaming Plus',
          description: 'Affordable international roaming with data packages and competitive call rates worldwide.',
          category: 'connectivity',
          provider: 'SLT Mobitel',
          price: 'LKR 950/month',
          features: [
            'Global roaming coverage',
            'Discounted international calls',
            'Data roaming packages',
            'SMS bundles worldwide',
            'Emergency support 24/7',
            'Usage monitoring & alerts'
          ],
          isSubscribed: subscriptionMap['slt-international-roaming'] === true, // Explicitly check for true
          popularity: 75,
          benefits: ['Global connectivity', 'Cost savings', 'Travel convenience']
        },
        {
          id: 'slt-wifi-plus',
          name: 'SLT WiFi Plus',
          description: 'Enhanced internet experience with priority bandwidth, parental controls, and premium support.',
          category: 'connectivity',
          provider: 'SLT Mobitel',
          price: 'LKR 750/month',
          features: [
            'Priority bandwidth allocation',
            'Advanced parental controls',
            'Guest network management',
            'Network security monitoring',
            '24/7 premium technical support',
            'Speed optimization tools'
          ],
          isSubscribed: subscriptionMap['slt-wifi-plus'] === true, // Explicitly check for true
          popularity: 83,
          benefits: ['Faster speeds', 'Family safety', 'Priority support']
        }
      ];

      console.log(`VAS Services loaded for customer: ${customerEmail}`);
      console.log(`Total subscriptions found: ${customerSubscriptions.length}`);
      console.log(`Active subscriptions: ${Object.values(subscriptionMap).filter(status => status === true).length}`);
      console.log(`Default behavior: All services start as UNSUBSCRIBED`);

      logger.info('VAS services retrieved successfully', { 
        customerId, 
        customerEmail,
        serviceCount: vasServices.length,
        activeSubscriptions: Object.values(subscriptionMap).filter(status => status === true).length,
        defaultBehavior: 'unsubscribed'
      });

      res.json({
        success: true,
        data: vasServices,
        meta: {
          total: vasServices.length,
          subscribed: vasServices.filter(s => s.isSubscribed).length,
          categories: [...new Set(vasServices.map(s => s.category))]
        }
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

      // Validate serviceId
      const validServices = ['slt-filmhall', 'peo-tv', 'kaspersky-security', 'e-channelling-plus', 'slt-cloud-pro', 'slt-international-roaming', 'slt-wifi-plus'];
      if (!validServices.includes(serviceId)) {
        console.log(`Invalid service ID: ${serviceId}`);
        return res.status(400).json({
          success: false,
          message: 'Invalid service ID'
        });
      }

      // Get service name for record keeping
      const serviceNames = {
        'slt-filmhall': 'SLT Filmhall',
        'peo-tv': 'PEO TV Plus',
        'kaspersky-security': 'Kaspersky Total Security',
        'e-channelling-plus': 'e-Channelling Health+',
        'slt-cloud-pro': 'SLT Cloud Pro',
        'slt-international-roaming': 'International Roaming Plus',
        'slt-wifi-plus': 'SLT WiFi Plus'
      };

      const serviceName = serviceNames[serviceId];

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
      const customerEmail = req.headers['customer-email'];
      const customerId = req.headers['customer-id'];

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
      
      // VAS services data (same as customer view)
      const vasServices = [
        {
          id: 'slt-filmhall',
          name: 'SLT Filmhall',
          description: 'Premium OTT streaming platform with movies, TV shows, music, and games. Enjoy unlimited entertainment on any device.',
          category: 'entertainment',
          provider: 'SLT Mobitel',
          price: 'LKR 299/month',
          isSubscribed: subscriptionMap['slt-filmhall'] === true,
          popularity: 95
        },
        {
          id: 'peo-tv',
          name: 'PEO TV Plus',
          description: 'Enhanced digital TV experience with premium channels, on-demand content, and interactive features.',
          category: 'entertainment',
          provider: 'SLT Mobitel',
          price: 'LKR 450/month',
          isSubscribed: subscriptionMap['peo-tv'] === true,
          popularity: 88
        },
        {
          id: 'kaspersky-security',
          name: 'Kaspersky Total Security',
          description: 'Complete cybersecurity solution protecting your devices from malware, viruses, and online threats.',
          category: 'security',
          provider: 'Kaspersky',
          price: 'LKR 650/month',
          isSubscribed: subscriptionMap['kaspersky-security'] === true,
          popularity: 92
        },
        {
          id: 'e-channelling-plus',
          name: 'e-Channelling Health+',
          description: 'Comprehensive healthcare services including doctor consultations, home services, and health monitoring.',
          category: 'healthcare',
          provider: 'e-Channelling',
          price: 'LKR 1200/month',
          isSubscribed: subscriptionMap['e-channelling-plus'] === true,
          popularity: 86
        },
        {
          id: 'slt-cloud-pro',
          name: 'SLT Cloud Pro',
          description: 'Professional cloud storage and collaboration suite with advanced security and team features.',
          category: 'cloud',
          provider: 'SLT Digital Services',
          price: 'LKR 850/month',
          isSubscribed: subscriptionMap['slt-cloud-pro'] === true,
          popularity: 78
        },
        {
          id: 'slt-international-roaming',
          name: 'International Roaming Plus',
          description: 'Affordable international roaming with data packages and competitive call rates worldwide.',
          category: 'connectivity',
          provider: 'SLT Mobitel',
          price: 'LKR 950/month',
          isSubscribed: subscriptionMap['slt-international-roaming'] === true,
          popularity: 75
        },
        {
          id: 'slt-wifi-plus',
          name: 'SLT WiFi Plus',
          description: 'Enhanced internet experience with priority bandwidth, parental controls, and premium support.',
          category: 'connectivity',
          provider: 'SLT Mobitel',
          price: 'LKR 750/month',
          isSubscribed: subscriptionMap['slt-wifi-plus'] === true,
          popularity: 83
        }
      ];

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
      const customerEmail = req.headers['customer-email'];
      const customerId = req.headers['customer-id'];
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

      // Validate serviceId
      const validServices = ['slt-filmhall', 'peo-tv', 'kaspersky-security', 'e-channelling-plus', 'slt-cloud-pro', 'slt-international-roaming', 'slt-wifi-plus'];
      if (!validServices.includes(serviceId)) {
        console.log(`Invalid service ID: ${serviceId}`);
        return res.status(400).json({
          success: false,
          message: 'Invalid service ID'
        });
      }

      // Get service name for record keeping
      const serviceNames = {
        'slt-filmhall': 'SLT Filmhall',
        'peo-tv': 'PEO TV Plus',
        'kaspersky-security': 'Kaspersky Total Security',
        'e-channelling-plus': 'e-Channelling Health+',
        'slt-cloud-pro': 'SLT Cloud Pro',
        'slt-international-roaming': 'International Roaming Plus',
        'slt-wifi-plus': 'SLT WiFi Plus'
      };

      const serviceName = serviceNames[serviceId];

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
