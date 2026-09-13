const express = require('express');
const router = express.Router();

const Consent = require('../../../models/Consent');
const customerAuth = require('../middleware/customerAuth');

// GET /api/v1/customer/consents
router.get('/consents', customerAuth, async (req, res) => {
  try {
    const { partyId, sourceSystem } = req.customer;

    // We only fetch consents that belong to this customer's partyId
    const consents = await Consent.find({ partyId }).sort({ createdAt: -1 });

    // Map to required fields
    const formattedConsents = consents.map(c => ({
      consentId: c.id,
      purpose: c.purpose,
      status: c.status,
      grantedAt: c.grantedAt,
      revokedAt: c.revokedAt,
      expiresAt: c.expiresAt,
      privacyNoticeId: c.privacyNoticeId,
      privacyNoticeVersion: c.versionAccepted,
      applicationReference: c.applicationReference,
      sourceSystem: c.sourceSystem,
      channel: c.channel,
      serviceType: c.metadata && c.metadata.serviceType ? c.metadata.serviceType : undefined,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }));

    res.status(200).json({
      success: true,
      data: formattedConsents
    });

  } catch (error) {
    console.error('[CustomerConsents] Fetch error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error while fetching consents' }
    });
  }
});

module.exports = router;
