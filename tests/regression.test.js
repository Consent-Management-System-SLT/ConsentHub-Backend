require('dotenv').config();
process.env.SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
process.env.SMTP_USER = process.env.SMTP_USER || 'test@example.com';
process.env.SMTP_PASS = process.env.SMTP_PASS || 'pass123';

const NodemailerProvider = require('../services/messaging/NodemailerProvider');

describe('Regression Tests', () => {
  it('NodemailerProvider.deliver exists', () => {
    expect(typeof NodemailerProvider.deliver).toBe('function');
  });

  it('NodemailerProvider.sendConsentRequest exists', () => {
    expect(typeof NodemailerProvider.sendConsentRequest).toBe('function');
  });

  it('enterprise role is enterprise', () => {
    const User = require('../models/User');
    const roleSchema = User.schema.path('role');
    expect(roleSchema.enumValues).toContain('enterprise');
  });
});
