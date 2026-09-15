const ConsentPolicyService = require('../ConsentPolicyService');
const DeliveryEvent = require('../../models/DeliveryEvent'); // Assuming we will create this model

class BaseProvider {
  constructor(name) {
    this.name = name;
  }

  /**
   * Evaluates consent and preferences before delegating to the actual sender.
   */
  async processAndSend({ customer, recipient, campaign, channel, subject, content, isFallback = false, requestedChannel = null }) {
    try {
      // 1. Consent Policy Check
      const policyCheck = await ConsentPolicyService.canReceiveCampaignMessage(customer._id, campaign._id, requestedChannel || channel);
      
      if (!policyCheck.allowed) {
        return this._recordDeliveryEvent({
          customer, campaign, channel: actualChannel(this.name, channel), requestedChannel, status: 'SUPPRESSED',
          reason: policyCheck.reason, isFallback
        });
      }

      // 2. Delegate to implementation
      const result = await this.deliver({ customer, recipient, campaign, channel, subject, content });
      
      // 3. Record Delivery Event
      return this._recordDeliveryEvent({
        customer, campaign, channel: actualChannel(this.name, channel), requestedChannel, 
        status: result.success ? 'SENT' : 'FAILED', 
        reason: result.error ? result.error.message : null,
        messageId: result.messageId, isFallback
      });

    } catch (error) {
      console.error(`[${this.name}] Delivery Processing Error:`, error);
      return this._recordDeliveryEvent({
        customer, campaign, channel: actualChannel(this.name, channel), requestedChannel, status: 'FAILED',
        reason: 'INTERNAL_ERROR', isFallback
      });
    }
  }

  async deliver(params) {
    throw new Error('deliver() must be implemented by subclass');
  }

  async _recordDeliveryEvent({ customer, campaign, channel, requestedChannel, status, reason, messageId, isFallback }) {
    try {
      const event = new DeliveryEvent({
        campaignId: campaign._id,
        customerId: customer._id,
        requestedChannel: requestedChannel || channel,
        actualChannel: channel,
        provider: this.name,
        status,
        failureReason: reason,
        messageId,
        fallbackUsed: isFallback,
        fallbackReason: isFallback ? 'SMS_PROVIDER_NOT_CONFIGURED' : null
      });
      await event.save();

      return {
        success: status === 'SENT',
        provider: this.name,
        requestedChannel: requestedChannel || channel,
        actualChannel: channel,
        messageId,
        timestamp: event.createdAt,
        error: reason
      };
    } catch (error) {
      console.error('Failed to save DeliveryEvent', error);
      return { success: false, error: 'DB_ERROR' };
    }
  }
}

function actualChannel(providerName, defaultChannel) {
  if (providerName === 'NODEMAILER_SMTP') return 'EMAIL';
  return defaultChannel;
}

module.exports = BaseProvider;
