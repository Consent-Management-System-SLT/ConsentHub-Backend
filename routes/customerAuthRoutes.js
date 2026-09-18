const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const crypto = require('crypto');

const ExternalPartyMapping = require('../models/ExternalPartyMapping');
const Consent = require('../models/Consent');

const router = express.Router();

/**
 * EasyApply customer sign-in.
 *
 * ConsentHub never sees the OTP itself: both steps are server-to-server calls
 * to EasyApply, which owns the customer identity. On success the EasyApply
 * customer id is resolved to a ConsentHub partyId through ExternalPartyMapping
 * and we mint our own short-lived customer token.
 */

const EASYAPPLY_API_URL = process.env.EASYAPPLY_API_URL;
const EASYAPPLY_API_KEY = process.env.EASYAPPLY_API_KEY;

// An OTP endpoint is a brute-force target: six digits is a million guesses.
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many attempts. Please try again in 15 minutes.' }
  }
});

const easyApplyConfigured = () => Boolean(EASYAPPLY_API_URL && EASYAPPLY_API_KEY);

const easyApplyPost = (path, body) =>
  axios.post(`${EASYAPPLY_API_URL}${path}`, body, {
    headers: { Authorization: `Bearer ${EASYAPPLY_API_KEY}`, 'Content-Type': 'application/json' },
    timeout: 15000
  });

/** Customer token guard. Separate from staff auth: different claims, shorter life. */
const customerAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No token provided' } });
  }
  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    if (decoded.role !== 'CUSTOMER') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Customer access only' } });
    }
    req.customer = { partyId: decoded.partyId, sourceSystem: decoded.sourceSystem, sessionId: decoded.sub };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
  }
};

// Step 1 - ask EasyApply to send the customer an OTP
router.post('/easyapply/request-otp', otpLimiter, async (req, res) => {
  const { mobileNumber } = req.body || {};
  if (!mobileNumber) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Mobile number is required' } });
  }
  if (!easyApplyConfigured()) {
    console.error('[CustomerAuth] EASYAPPLY_API_URL / EASYAPPLY_API_KEY are not configured');
    return res.status(503).json({ success: false, error: { code: 'CONFIGURATION_ERROR', message: 'Mobile sign-in is unavailable right now.' } });
  }

  try {
    await easyApplyPost('/api/integrations/consenthub/auth/request-otp', { mobileNumber });
    return res.json({ success: true, message: 'OTP sent' });
  } catch (err) {
    const status = err.response?.status;
    console.error('[CustomerAuth] EasyApply request-otp failed:', err.message, status);
    if (status === 404) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'That mobile number is not registered with EasyApply.' } });
    }
    if (status === 429) {
      return res.status(429).json({ success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please wait and try again.' } });
    }
    return res.status(502).json({ success: false, error: { code: 'UPSTREAM_ERROR', message: 'Could not send the code. Please try again.' } });
  }
});

// Step 2 - verify the OTP with EasyApply and issue a ConsentHub customer token
router.post('/easyapply/verify-otp', otpLimiter, async (req, res) => {
  const { mobileNumber, otp } = req.body || {};
  if (!mobileNumber || !otp) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Mobile number and code are required' } });
  }
  if (!easyApplyConfigured()) {
    return res.status(503).json({ success: false, error: { code: 'CONFIGURATION_ERROR', message: 'Mobile sign-in is unavailable right now.' } });
  }

  let externalCustomerId;
  try {
    const response = await easyApplyPost('/api/integrations/consenthub/auth/verify-otp', { mobileNumber, otp });
    externalCustomerId = response.data?.customer?.externalCustomerId;
  } catch (err) {
    console.error('[CustomerAuth] EasyApply verify-otp failed:', err.message, err.response?.status);
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'That code is not valid or has expired.' } });
  }

  if (!externalCustomerId) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'That code is not valid or has expired.' } });
  }

  const mapping = await ExternalPartyMapping.findOne({ sourceSystem: 'EASYAPPLY', externalCustomerId });
  if (!mapping) {
    return res.status(404).json({
      success: false,
      error: { code: 'CUSTOMER_MAPPING_NOT_FOUND', message: 'We found your account but no consent records are linked to it yet.' }
    });
  }

  const token = jwt.sign(
    { sub: crypto.randomUUID(), partyId: mapping.partyId, sourceSystem: 'EASYAPPLY', role: 'CUSTOMER' },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  return res.json({ success: true, token, data: { partyId: mapping.partyId, sourceSystem: 'EASYAPPLY' } });
});

router.get('/me', customerAuth, (req, res) => res.json({ success: true, data: req.customer }));

router.post('/logout', customerAuth, (req, res) => res.json({ success: true, message: 'Logged out' }));

// The customer's own consent records, scoped to their partyId by the token.
router.get('/consents', customerAuth, async (req, res) => {
  try {
    const consents = await Consent.find({ partyId: req.customer.partyId }).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: consents.map((c) => ({
        consentId: c.id,
        purpose: c.purpose,
        status: c.status,
        grantedAt: c.grantedAt,
        revokedAt: c.revokedAt,
        expiresAt: c.expiresAt,
        privacyNoticeId: c.privacyNoticeId,
        privacyNoticeVersion: c.versionAccepted,
        channel: c.channel,
        sourceSystem: c.sourceSystem,
        createdAt: c.createdAt
      }))
    });
  } catch (error) {
    console.error('[CustomerAuth] consents fetch failed:', error.message);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not load your consents' } });
  }
});

module.exports = router;
