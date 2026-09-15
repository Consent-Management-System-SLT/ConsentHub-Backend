const Consent = require('../models/Consent');
const EnterpriseOrganization = require('../models/EnterpriseOrganization');
const Recipient = require('../models/Recipient');
const PartnerCampaign = require('../models/PartnerCampaign');
const Purpose = require('../models/Purpose');

class ConsentPolicyService {
  static async canReceiveCampaignMessage(customerId, campaignId, channel) {
    try {
      const campaign = await PartnerCampaign.findById(campaignId);
      if (!campaign || campaign.status !== 'RUNNING') return { allowed: false, reason: 'CAMPAIGN_INVALID' };

      const org = await EnterpriseOrganization.findById(campaign.organizationId);
      if (!org || org.status !== 'ACTIVE') return { allowed: false, reason: 'ENTERPRISE_SUSPENDED' };

      const recipient = await Recipient.findOne({ organizationId: org._id });
      if (!recipient || recipient.status !== 'ACTIVE') return { allowed: false, reason: 'RECIPIENT_SUSPENDED' };

      // Check if purpose is still valid
      const purpose = await Purpose.findById(campaign.purposeId);
      if (!purpose || purpose.status !== 'ACTIVE') return { allowed: false, reason: 'PURPOSE_INVALID' };

      // Check actual consent record
      const consent = await Consent.findOne({
        customerId: customerId,
        recipientId: recipient._id,
        purposeId: purpose._id,
        channel: channel
      }).sort({ createdAt: -1 });

      if (!consent) return { allowed: false, reason: 'NO_CONSENT_FOUND' };

      if (consent.status === 'revoked') return { allowed: false, reason: 'CONSENT_REVOKED' };
      if (consent.status === 'declined') return { allowed: false, reason: 'CONSENT_DECLINED' };
      if (consent.status !== 'granted') return { allowed: false, reason: 'CONSENT_NOT_GRANTED' };

      // Expiry check
      if (consent.expiresAt && new Date(consent.expiresAt) <= new Date()) {
        return { allowed: false, reason: 'CONSENT_EXPIRED' };
      }
      if (consent.validTo && new Date(consent.validTo) <= new Date()) {
        return { allowed: false, reason: 'CONSENT_EXPIRED' };
      }

      // Check global communication preferences
      const UserPreference = require('../models/UserPreference');
      const pref = await UserPreference.findOne({ userId: customerId });
      
      if (pref) {
        if (pref.globalOptOut) return { allowed: false, reason: 'GLOBAL_OPT_OUT' };
        
        // Check channel specific preferences
        if (channel === 'sms' && !pref.channels.sms) return { allowed: false, reason: 'CHANNEL_DISABLED' };
        if (channel === 'email' && !pref.channels.email) return { allowed: false, reason: 'CHANNEL_DISABLED' };
        if (channel === 'push' && !pref.channels.push) return { allowed: false, reason: 'CHANNEL_DISABLED' };
      }

      // Check Minor/Guardian policy (Simplified mockup)
      const User = require('../models/User');
      const user = await User.findById(customerId);
      if (user && user.age !== undefined && user.age < 18) {
        // Need explicit guardian consent for minors, fallback to suppressed for partner marketing
        return { allowed: false, reason: 'MINOR_RESTRICTION' };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Consent Policy Evaluation Error:', error);
      return { allowed: false, reason: 'POLICY_EVALUATION_ERROR' };
    }
  }
}

module.exports = ConsentPolicyService;
