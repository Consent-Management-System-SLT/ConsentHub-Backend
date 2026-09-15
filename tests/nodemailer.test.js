const nodemailer = require('nodemailer');

jest.mock('nodemailer', () => {
  const mSendMail = jest.fn();
  const mTransport = { sendMail: mSendMail };
  return {
    createTransport: jest.fn(() => mTransport)
  };
});

describe('NodemailerProvider', () => {
  let NodemailerProvider;
  let mockSendMail;

  beforeEach(() => {
    jest.resetModules();
    const nodemailer = require('nodemailer');
    mockSendMail = nodemailer.createTransport().sendMail;
    mockSendMail.mockReset();
    process.env.SMTP_HOST = 'test.smtp.com';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASS = 'pass';
    NodemailerProvider = require('../services/messaging/NodemailerProvider');
  });

  it('should skip if customer has no email', async () => {
    const res = await NodemailerProvider.deliver({ customer: { _id: 'cust1' }, subject: 'Hi', content: 'test' });
    expect(res.success).toBe(false);
    expect(res.error.message).toBe('MISSING_CUSTOMER_EMAIL');
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('should send email if customer has email', async () => {
    mockSendMail.mockResolvedValue({ messageId: 'msg-123' });

    const res = await NodemailerProvider.deliver({ 
      customer: { _id: 'cust2', email: 'test@test.com' }, 
      subject: 'Hi', 
      content: 'test' 
    });

    expect(res.success).toBe(true);
    expect(res.messageId).toBe('msg-123');
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'test@test.com',
      subject: 'Hi',
      text: 'test'
    }));
  });
});
