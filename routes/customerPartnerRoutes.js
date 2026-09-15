const express = require('express');
const router = express.Router();
const Consent = require('../models/Consent');
const ConsentEvidence = require('../models/ConsentEvidence');
const ConsentTemplateVersion = require('../models/ConsentTemplateVersion');

// Get partner consent requests
router.get('/requests', async (req, res) => {
  try {
    const requests = await PartnerConsentRequest.find({
      customerId: req.user.id
    })
    .populate('recipientId')
    .populate('purposeId')
    .populate('scopeIds')
    .populate('templateVersionId')
    .sort({ createdAt: -1 });
    
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Failed to fetch requests' });
  }
});

// Grant a partner consent request
router.post('/requests/:id/grant', async (req, res) => {
  try {
    const request = await PartnerConsentRequest.findOne({ _id: req.params.id, customerId: req.user.id });
    if (!request) return res.status(404).json({ error: true, message: 'Request not found' });
    if (request.status !== 'PENDING') return res.status(400).json({ error: true, message: 'Request is already processed' });

    const templateVersion = await ConsentTemplateVersion.findById(request.templateVersionId);

    // Update request
    request.status = 'GRANTED';
    request.respondedAt = new Date();
    await request.save();

    // Create active Consent record
    const consent = new Consent({
      id: 'CONS-' + Date.now(),
      partyId: req.user.id,
      customerId: req.user.id,
      recipientId: request.recipientId,
      purposeId: request.purposeId,
      scopeIds: request.scopeIds,
      templateVersionId: templateVersion._id.toString(),
      status: 'granted',
      channel: 'web',
      validTo: request.expiresAt
    });
    await consent.save();

    // Store Evidence
    const evidence = new ConsentEvidence({
      customerId: req.user.id,
      consentId: consent._id,
      recipientId: request.recipientId,
      purposeId: request.purposeId,
      decision: 'GRANTED',
      templateVersionId: templateVersion._id,
      consentTextHash: templateVersion.contentHash,
      channel: 'web',
      sourceApplication: 'Customer Portal'
    });
    await evidence.save();

    res.json({ success: true, message: 'Consent granted successfully' });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Failed to grant consent' });
  }
});

// Decline a partner consent request
router.post('/requests/:id/decline', async (req, res) => {
  try {
    const request = await PartnerConsentRequest.findOne({ _id: req.params.id, customerId: req.user.id });
    if (!request) return res.status(404).json({ error: true, message: 'Request not found' });
    if (request.status !== 'PENDING') return res.status(400).json({ error: true, message: 'Request is already processed' });

    const templateVersion = await ConsentTemplateVersion.findById(request.templateVersionId);

    // Update request
    request.status = 'DECLINED';
    request.respondedAt = new Date();
    await request.save();

    // Store Evidence
    const evidence = new ConsentEvidence({
      customerId: req.user.id,
      recipientId: request.recipientId,
      purposeId: request.purposeId,
      decision: 'DECLINED',
      templateVersionId: templateVersion._id,
      consentTextHash: templateVersion.contentHash,
      channel: 'web',
      sourceApplication: 'Customer Portal'
    });
    await evidence.save();

    res.json({ success: true, message: 'Consent declined successfully' });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Failed to decline consent' });
  }
});

// Revoke an active partner consent
router.post('/:id/revoke', async (req, res) => {
  try {
    const consent = await Consent.findOne({ _id: req.params.id, customerId: req.user.id, status: 'granted' });
    if (!consent) return res.status(404).json({ error: true, message: 'Active consent not found' });

    consent.status = 'revoked';
    consent.revokedAt = new Date();
    await consent.save();

    let hash = 'unknown';
    if (consent.templateVersionId) {
       const templateVersion = await ConsentTemplateVersion.findById(consent.templateVersionId);
       if (templateVersion) hash = templateVersion.contentHash;
    }

    const evidence = new ConsentEvidence({
      customerId: req.user.id,
      consentId: consent._id,
      recipientId: consent.recipientId,
      purposeId: consent.purposeId,
      decision: 'REVOKED',
      templateVersionId: consent.templateVersionId,
      consentTextHash: hash,
      channel: 'web',
      sourceApplication: 'Customer Portal'
    });
    await evidence.save();

    res.json({ success: true, message: 'Consent revoked successfully' });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Failed to revoke consent' });
  }
});

module.exports = router;
