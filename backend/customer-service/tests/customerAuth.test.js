const request = require('supertest');
const express = require('express');
const axios = require('axios');
jest.mock('axios');

const customerAuthRoutes = require('../routes/customerAuthRoutes');
const ExternalPartyMapping = require('../../../models/ExternalPartyMapping');
jest.mock('../../../models/ExternalPartyMapping');

const app = express();
app.use(express.json());
app.use('/api/v1/customer-auth', customerAuthRoutes);

describe('Customer Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('POST /api/v1/customer-auth/easyapply/request-otp', () => {
    it('should request OTP successfully', async () => {
      axios.post.mockResolvedValueOnce({ data: { success: true } });

      const response = await request(app)
        .post('/api/v1/customer-auth/easyapply/request-otp')
        .send({ mobileNumber: '0771234567' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/otp/request'),
        { mobileNumber: '0771234567' },
        expect.any(Object)
      );
    });
  });

  describe('POST /api/v1/customer-auth/easyapply/verify-otp', () => {
    it('should verify OTP and return token', async () => {
      axios.post.mockResolvedValueOnce({ data: { customerId: 'EA-123' } });
      ExternalPartyMapping.findOne.mockResolvedValueOnce({
        partyId: 'PARTY-456',
        sourceSystem: 'EASYAPPLY',
        externalCustomerId: 'EA-123'
      });

      const response = await request(app)
        .post('/api/v1/customer-auth/easyapply/verify-otp')
        .send({ mobileNumber: '0771234567', otp: '123456' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.data.partyId).toBe('PARTY-456');
    });

    it('should fail if EasyApply verification fails', async () => {
      axios.post.mockRejectedValueOnce(new Error('Invalid OTP'));

      const response = await request(app)
        .post('/api/v1/customer-auth/easyapply/verify-otp')
        .send({ mobileNumber: '0771234567', otp: '000000' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
