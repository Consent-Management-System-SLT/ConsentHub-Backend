const BaseProvider = require('../services/messaging/BaseProvider');
const ConsentPolicyService = require('../services/ConsentPolicyService');
const DeliveryEvent = require('../models/DeliveryEvent');

jest.mock('../services/ConsentPolicyService');
jest.mock('../models/DeliveryEvent', () => {
  return function() {
    this.save = jest.fn().mockResolvedValue(true);
  };
});

class TestProvider extends BaseProvider {
  constructor() {
    super('TEST_PROVIDER');
    this.deliver = jest.fn().mockResolvedValue({ success: true, messageId: 'test-id' });
  }
}

describe('BaseProvider Consent Evaluation', () => {
  let provider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new TestProvider();
  });

  it('should SUPPRESS if ConsentPolicyService returns allowed: false', async () => {
    ConsentPolicyService.canReceiveCampaignMessage.mockResolvedValue({ allowed: false, reason: 'GLOBAL_OPT_OUT' });

    const result = await provider.processAndSend({
      customer: { _id: 'cust1' },
      campaign: { _id: 'camp1' },
      channel: 'SMS'
    });

    expect(ConsentPolicyService.canReceiveCampaignMessage).toHaveBeenCalled();
    expect(provider.deliver).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.error).toBe('GLOBAL_OPT_OUT');
  });

  it('should DELIVER if ConsentPolicyService returns allowed: true', async () => {
    ConsentPolicyService.canReceiveCampaignMessage.mockResolvedValue({ allowed: true });

    const result = await provider.processAndSend({
      customer: { _id: 'cust2' },
      campaign: { _id: 'camp2' },
      channel: 'SMS'
    });

    expect(ConsentPolicyService.canReceiveCampaignMessage).toHaveBeenCalled();
    expect(provider.deliver).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.messageId).toBe('test-id');
  });
});
