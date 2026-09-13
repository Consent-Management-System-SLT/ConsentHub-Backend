const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const crypto = require('crypto');
const router = express.Router();

const ExternalPartyMapping = require('../../../models/ExternalPartyMapping');
const customerAuth = require('../middleware/customerAuth');

// Rate limiting for OTP attempts
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many OTP attempts, please try again later.' }
  }
});

// Mock/Assume EasyApply Backend URL
const EASYAPPLY_API_URL = process.env.EASYAPPLY_API_URL || 'http://localhost:5000';
const EASYAPPLY_API_KEY = process.env.EASYAPPLY_API_KEY || 'easyapply-mock-key';

// POST /api/v1/customer-auth/easyapply/request-otp
router.post('/easyapply/request-otp', otpLimiter, async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    
    if (!mobileNumber) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'mobileNumber is required' } });
    }

    // Call EasyApply backend to request OTP
    console.log(`[CustomerAuth] Requesting OTP for ${mobileNumber} via EasyApply`);
    
    // Server-to-server call to EasyApply
    try {
      const response = await axios.post(`${EASYAPPLY_API_URL}/api/otp/request`, { mobileNumber }, {
        headers: { 'Authorization': `Bearer ${EASYAPPLY_API_KEY}` }
      });
      console.log('[CustomerAuth] EasyApply OTP Request Success');
    } catch (err) {
      // In a real scenario, we handle failure, but to prevent enumeration we might always return 200 to the client
      console.error('[CustomerAuth] EasyApply OTP Request Failed:', err.message);
      // For this phase, if EasyApply says user not found, we reject it
      if (err.response && err.response.status === 404) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found in EasyApply' } });
      }
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to request OTP' } });
    }

    return res.status(200).json({ success: true, message: 'OTP requested successfully' });
  } catch (error) {
    console.error('[CustomerAuth] Request OTP Error:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

// POST /api/v1/customer-auth/easyapply/verify-otp
router.post('/easyapply/verify-otp', otpLimiter, async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;

    if (!mobileNumber || !otp) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'mobileNumber and otp are required' } });
    }

    console.log(`[CustomerAuth] Verifying OTP for ${mobileNumber}`);

    let easyApplyCustomerId;
    
    // Server-to-server call to EasyApply to verify OTP
    try {
      const response = await axios.post(`${EASYAPPLY_API_URL}/api/otp/verify`, { mobileNumber, otp }, {
        headers: { 'Authorization': `Bearer ${EASYAPPLY_API_KEY}` }
      });
      easyApplyCustomerId = response.data.customerId;
    } catch (err) {
      console.error('[CustomerAuth] EasyApply OTP Verify Failed:', err.message);
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired OTP' } });
    }

    if (!easyApplyCustomerId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired OTP' } });
    }

    // Resolve ConsentHub partyId using ExternalPartyMapping
    const mapping = await ExternalPartyMapping.findOne({ sourceSystem: 'EASYAPPLY', externalCustomerId: easyApplyCustomerId });
    
    if (!mapping) {
      console.log(`[CustomerAuth] No mapping found for EasyApply customer ${easyApplyCustomerId}`);
      return res.status(404).json({ success: false, error: { code: 'MAPPING_NOT_FOUND', message: 'Customer account found, but no consent records associated.' } });
    }

    const sessionId = crypto.randomUUID();

    // Create Customer JWT
    const token = jwt.sign(
      {
        sub: sessionId,
        partyId: mapping.partyId,
        sourceSystem: 'EASYAPPLY',
        role: 'CUSTOMER'
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' } // Short lived token for customers
    );

    console.log(`[CustomerAuth] Customer ${mapping.partyId} logged in successfully`);

    return res.status(200).json({
      success: true,
      token,
      data: {
        partyId: mapping.partyId,
        sourceSystem: 'EASYAPPLY'
      }
    });

  } catch (error) {
    console.error('[CustomerAuth] Verify OTP Error:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

// POST /api/v1/customer-auth/logout
router.post('/logout', customerAuth, (req, res) => {
  // In a stateless JWT setup, logout is handled client-side by destroying the token
  // If we had a token blacklist/session store, we would invalidate the token here
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// GET /api/v1/customer-auth/me
router.get('/me', customerAuth, (req, res) => {
  // Return basic customer session info
  res.status(200).json({
    success: true,
    data: req.customer
  });
});

module.exports = router;
