const { logger } = require('../../shared/utils');

class VASController {
  // Get all available VAS services
  async getVASServices(req, res) {
    try {
      const customerId = req.customer.customerId;
      
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
          isSubscribed: false,
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
          isSubscribed: true,
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
          isSubscribed: false,
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
          isSubscribed: true,
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
          isSubscribed: false,
          popularity: 78,
          benefits: ['Secure storage', 'Team collaboration', 'Business tools']
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
            'Speed boost during peak hours',
            'Premium technical support',
            'Network security monitoring'
          ],
          isSubscribed: true,
          popularity: 83,
          benefits: ['Faster speeds', 'Family safety', 'Priority support']
        }
      ];

      logger.info('VAS services retrieved successfully', { customerId, serviceCount: vasServices.length });

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
      const { serviceId } = req.params;
      const { action } = req.body; // 'subscribe' or 'unsubscribe'

      // Enhanced console logging for VAS subscription operations
      console.log('\n========== VAS SUBSCRIPTION REQUEST ==========');
      console.log(`Customer ID: ${customerId}`);
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

      // In production, this would update the database
      // For now, simulate the operation
      console.log(`Processing ${action} request for service ${serviceId}...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing delay

      const isSubscribed = action === 'subscribe';

      console.log(`VAS service ${action} successful!`);
      console.log(`New subscription status: ${isSubscribed ? 'SUBSCRIBED' : 'UNSUBSCRIBED'}`);
      console.log(`Billing impact: ${isSubscribed ? 'Service will be added to next bill' : 'Service will be removed from next bill'}`);

      logger.info(`VAS service ${action} successful`, { 
        customerId, 
        serviceId, 
        action, 
        isSubscribed,
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
          isSubscribed,
          action,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.log('\n💥 ========== VAS SUBSCRIPTION ERROR ==========');
      console.error('❌ Error details:', error);
      console.log(`🕐 Error time: ${new Date().toISOString()}`);
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
}

module.exports = new VASController();
