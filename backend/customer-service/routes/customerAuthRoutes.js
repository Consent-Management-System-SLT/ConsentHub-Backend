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

// Use environment variables for EasyApply integration
const EASYAPPLY_API_URL = process.env.EASYAPPLY_API_URL;
const EASYAPPLY_API_KEY = process.env.EASYAPPLY_API_KEY;

// POST /api/v1/customer-auth/easyapply/request-otp
router.post('/easyapply/request-otp', otpLimiter, async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    
    if (!mobileNumber) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'mobileNumber is required' } });
    }

    if (!EASYAPPLY_API_URL || !EASYAPPLY_API_KEY) {
       console.error('[CustomerAuth] Missing EASYAPPLY_API_URL or EASYAPPLY_API_KEY configuration');
       return res.status(500).json({ success: false, error: { code: 'CONFIGURATION_ERROR', message: 'System configuration error' } });
    }

    // Call EasyApply backend to request OTP
    console.log(`[CustomerAuth] Requesting OTP for ${mobileNumber} via EasyApply (${EASYAPPLY_API_URL}/api/integrations/consenthub/auth/request-otp)`);
    
    // Server-to-server call to EasyApply
    try {
      const response = await axios.post(`${EASYAPPLY_API_URL}/api/integrations/consenthub/auth/request-otp`, { mobileNumber }, {
        headers: { 
          'Authorization': `Bearer ${EASYAPPLY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`[CustomerAuth] EasyApply OTP Request Success (Status: ${response.status})`);
    } catch (err) {
      // In a real scenario, we handle failure, but to prevent enumeration we might always return 200 to the client
      console.error('[CustomerAuth] EasyApply OTP Request Failed:', err.message, err.response?.status);
      
      if (err.response && err.response.status === 404) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found in EasyApply' } });
      } else if (err.response && err.response.status === 429) {
        return res.status(429).json({ success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests to EasyApply' } });
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
      const response = await axios.post(`${EASYAPPLY_API_URL}/api/integrations/consenthub/auth/verify-otp`, { mobileNumber, otp }, {
        headers: { 
          'Authorization': `Bearer ${EASYAPPLY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`[CustomerAuth] EasyApply OTP Verify Success (Status: ${response.status})`);
      easyApplyCustomerId = response.data?.customer?.externalCustomerId;
    } catch (err) {
      console.error('[CustomerAuth] EasyApply OTP Verify Failed:', err.message, err.response?.status);
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired OTP' } });
    }

    if (!easyApplyCustomerId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired OTP' } });
    }

    // Resolve ConsentHub partyId using ExternalPartyMapping
    const mapping = await ExternalPartyMapping.findOne({ sourceSystem: 'EASYAPPLY', externalCustomerId: easyApplyCustomerId });
    
    if (!mapping) {
      console.log(`[CustomerAuth] No mapping found for EasyApply customer ${easyApplyCustomerId}`);
      return res.status(404).json({ success: false, error: { code: 'CUSTOMER_MAPPING_NOT_FOUND', message: 'Customer account found, but no consent records associated.' } });
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
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// GET /api/v1/customer-auth/me
router.get('/me', customerAuth, (req, res) => {
  res.status(200).json({
    success: true,
    data: req.customer
  });
});

module.exports = router;
