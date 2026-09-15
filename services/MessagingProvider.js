const NodemailerProvider = require('./messaging/NodemailerProvider');

class MessagingService {
  constructor() {
    this.smsProviderEnabled = process.env.SMS_PROVIDER_ENABLED === 'true';
    this.messagingProvider = process.env.MESSAGING_PROVIDER || 'smtp';
  }

  async sendCampaignBatch(campaign, audience, channel, messageTemplateContent) {
    console.log(`[MessagingService] Starting delivery for campaign: ${campaign.campaignCode}`);
    console.log(`[MessagingService] Requested Channel: ${channel}, Audience Size: ${audience.length}`);
    
    const results = [];

    // Simple batching/worker simulation
    const batchSize = 10;
    for (let i = 0; i < audience.length; i += batchSize) {
      const batch = audience.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (customer) => {
        let isFallback = false;
        let activeProvider = null;
        let activeChannel = channel;

        if (channel === 'SMS' || channel === 'sms') {
          if (this.smsProviderEnabled) {
            // Future SMS adapter logic here
            // activeProvider = SmsProvider;
          } else if (this.messagingProvider === 'smtp') {
            isFallback = true;
            activeProvider = NodemailerProvider;
            activeChannel = 'EMAIL';
          } else {
            // No provider configured
             return { success: false, status: 'FAILED', error: 'NO_PROVIDER_CONFIGURED' };
          }
        } else if (channel === 'EMAIL' || channel === 'email') {
          activeProvider = NodemailerProvider;
        } else {
          return { success: false, status: 'FAILED', error: 'UNSUPPORTED_CHANNEL' };
        }

        if (activeProvider) {
          const subject = campaign.campaignName;
          const content = messageTemplateContent || `Dear Customer, you have a message regarding ${campaign.campaignName}.`;

          return activeProvider.processAndSend({
            customer,
            recipient: null, // Depending on the actual setup
            campaign,
            channel: activeChannel,
            requestedChannel: channel,
            subject,
            content,
            isFallback
          });
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Simulate a tiny delay to not overload SMTP
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log(`[MessagingService] Finished batch. Total Processed: ${results.length}`);
    return results;
  }
}

module.exports = new MessagingService();
