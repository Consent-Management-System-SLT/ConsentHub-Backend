const MessagingService = require('../services/MessagingProvider');
const NodemailerProvider = require('../services/messaging/NodemailerProvider');
const ConsentPolicyService = require('../services/ConsentPolicyService');

jest.mock('../services/messaging/NodemailerProvider', () => {
  return {
    processAndSend: jest.fn(),
    sendConsentRequest: jest.fn()
  };
});

jest.mock('../services/ConsentPolicyService', () => {
  return {
    canReceiveCampaignMessage: jest.fn()
  };
});

describe('Messaging Service & SMTP Fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SMS_PROVIDER_ENABLED = 'false';
    process.env.MESSAGING_PROVIDER = 'smtp';
  });

  it('should fallback to EMAIL for SMS campaigns when SMS is disabled', async () => {
    const campaign = { _id: 'camp1', campaignName: 'Promo', campaignCode: 'C1' };
    const audience = [{ _id: 'cust1', email: 'cust1@test.com' }];

    NodemailerProvider.processAndSend.mockResolvedValue([{ success: true }]);

    const results = await MessagingService.sendCampaignBatch(campaign, audience, 'SMS');

    expect(NodemailerProvider.processAndSend).toHaveBeenCalledTimes(1);
    const callArgs = NodemailerProvider.processAndSend.mock.calls[0][0];
    
    expect(callArgs.channel).toBe('EMAIL');
    expect(callArgs.requestedChannel).toBe('SMS');
    expect(callArgs.isFallback).toBe(true);
  });

  it('should use EMAIL directly for EMAIL campaigns without fallback flag', async () => {
    const campaign = { _id: 'camp2', campaignName: 'Promo', campaignCode: 'C2' };
    const audience = [{ _id: 'cust2', email: 'cust2@test.com' }];

    NodemailerProvider.processAndSend.mockResolvedValue([{ success: true }]);

    await MessagingService.sendCampaignBatch(campaign, audience, 'EMAIL');

    expect(NodemailerProvider.processAndSend).toHaveBeenCalledTimes(1);
    const callArgs = NodemailerProvider.processAndSend.mock.calls[0][0];
    
    expect(callArgs.channel).toBe('EMAIL');
    expect(callArgs.requestedChannel).toBe('EMAIL');
    expect(callArgs.isFallback).toBe(false);
  });
});
