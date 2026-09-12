const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const easyApplyRoutes = require('./easyApplyIntegration.routes');

const ExternalPartyMapping = require('../../models/ExternalPartyMapping');
const User = require('../../models/User');
const PrivacyNotice = require('../../models/PrivacyNoticeNew');
const Consent = require('../../models/Consent');
const AuditLog = require('../../models/AuditLog');

const app = express();
app.use(express.json());
app.use('/api/v1/integrations/easyapply', easyApplyRoutes);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

describe('EasyApply Integration', () => {
  beforeEach(() => {
    process.env.EASYAPPLY_INTEGRATION_SECRET = 'test-secret';
  });

  const authHeader = { 'Authorization': 'Bearer test-secret' };

  describe('Authentication', () => {
    it('should return 401 if token is missing', async () => {
      const res = await request(app).get('/api/v1/integrations/easyapply/health');
      expect(res.status).toBe(401);
    });

    it('should return 403 if token is invalid', async () => {
      const res = await request(app)
        .get('/api/v1/integrations/easyapply/health')
        .set('Authorization', 'Bearer invalid');
      expect(res.status).toBe(403);
    });
  });

  describe('Resolve Party', () => {
    it('should resolve a new customer and create mapping', async () => {
      const res = await request(app)
        .post('/api/v1/integrations/easyapply/parties/resolve')
        .set(authHeader)
        .send({
          sourceSystem: 'EASYAPPLY',
          externalCustomerId: 'ext123',
          name: 'John Doe',
          phone: '0711111111',
          email: 'john@example.com'
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.resolution).toBe('created');
      expect(res.body.data.partyId).toBeDefined();

      const user = await User.findById(res.body.data.partyId);
      expect(user).toBeDefined();
      expect(user.firstName).toBe('John');

      const mapping = await ExternalPartyMapping.findOne({ externalCustomerId: 'ext123' });
      expect(mapping).toBeDefined();
    });

    it('should resolve same customer twice and return same partyId', async () => {
      const first = await request(app)
        .post('/api/v1/integrations/easyapply/parties/resolve')
        .set(authHeader)
        .send({
          sourceSystem: 'EASYAPPLY',
          externalCustomerId: 'ext456',
          name: 'Jane Doe'
        });
      
      const second = await request(app)
        .post('/api/v1/integrations/easyapply/parties/resolve')
        .set(authHeader)
        .send({
          sourceSystem: 'EASYAPPLY',
          externalCustomerId: 'ext456',
          name: 'Jane Doe'
        });

      expect(second.status).toBe(200);
      expect(second.body.data.resolution).toBe('existing');
      expect(second.body.data.partyId).toBe(first.body.data.partyId);
    });
  });

  describe('Active Privacy Notice', () => {
    it('should fetch active notice', async () => {
      const notice = new PrivacyNotice({
        noticeId: 'PN-001',
        title: 'Main Notice',
        content: 'Content',
        status: 'active',
        version: '1.0',
        category: 'marketing',
        applicableServices: ['new-connection']
      });
      await notice.save();

      const res = await request(app)
        .get('/api/v1/integrations/easyapply/privacy-notices/active?serviceType=new-connection')
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.noticeId).toBe('PN-001');
    });

    it('should return 404 if missing', async () => {
      const res = await request(app)
        .get('/api/v1/integrations/easyapply/privacy-notices/active?serviceType=unknown')
        .set(authHeader);
      expect(res.status).toBe(404);
    });
  });

  describe('Consent Capture', () => {
    it('should capture consents and enforce idempotency', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'pwd',
        firstName: 'Test',
        lastName: 'User',
        phone: '123'
      });
      await user.save();

      const mapping = new ExternalPartyMapping({
        sourceSystem: 'EASYAPPLY',
        externalCustomerId: 'ext789',
        partyId: user._id.toString()
      });
      await mapping.save();

      const payload = {
        externalCustomerId: 'ext789',
        applicationReference: 'REQ-123',
        serviceType: 'new-connection',
        privacyNoticeId: 'PN-001',
        privacyNoticeVersion: '1.0',
        channel: 'EASYAPPLY',
        decisions: [
          { purpose: 'service', granted: true },
          { purpose: 'marketing', granted: false }
        ]
      };

      const first = await request(app)
        .post('/api/v1/integrations/easyapply/consents')
        .set(authHeader)
        .set('Idempotency-Key', 'IDEMP-1')
        .send(payload);

      expect(first.status).toBe(201);
      expect(first.body.data.consents.length).toBe(2);
      expect(first.body.data.consents[0].status).toBe('granted');
      expect(first.body.data.consents[1].status).toBe('revoked');

      const second = await request(app)
        .post('/api/v1/integrations/easyapply/consents')
        .set(authHeader)
        .set('Idempotency-Key', 'IDEMP-1')
        .send(payload);

      expect(second.status).toBe(200);
      expect(second.body.data.consents.length).toBe(2);

      const audits = await AuditLog.find({ 'metadata.sourceSystem': 'EASYAPPLY' });
      expect(audits.length).toBe(2);
    });
  });

  describe('Customer Consents', () => {
    it('should fetch customer consents', async () => {
      const user = new User({
        email: 'test2@example.com',
        password: 'pwd',
        firstName: 'Test',
        lastName: 'User',
        phone: '123'
      });
      await user.save();

      const mapping = new ExternalPartyMapping({
        sourceSystem: 'EASYAPPLY',
        externalCustomerId: 'ext000',
        partyId: user._id.toString()
      });
      await mapping.save();

      const consent = new Consent({
        id: 'C1',
        partyId: user._id.toString(),
        purpose: 'service',
        status: 'granted',
        channel: 'EASYAPPLY'
      });
      await consent.save();

      const res = await request(app)
        .get('/api/v1/integrations/easyapply/parties/ext000/consents')
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].consentId).toBe('C1');
    });
  });

  describe('Update / Revoke Consent', () => {
    it('should update consent', async () => {
      const consent = new Consent({
        id: 'C2',
        partyId: 'p1',
        purpose: 'service',
        status: 'granted',
        channel: 'EASYAPPLY'
      });
      await consent.save();

      const res = await request(app)
        .patch('/api/v1/integrations/easyapply/consents/C2')
        .set(authHeader)
        .send({ status: 'revoked' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('revoked');

      const c = await Consent.findOne({ id: 'C2' });
      expect(c.status).toBe('revoked');
    });

    it('should revoke consent', async () => {
      const consent = new Consent({
        id: 'C3',
        partyId: 'p1',
        purpose: 'service',
        status: 'granted',
        channel: 'EASYAPPLY'
      });
      await consent.save();

      const res = await request(app)
        .patch('/api/v1/integrations/easyapply/consents/C3/revoke')
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('revoked');
    });
  });
});
