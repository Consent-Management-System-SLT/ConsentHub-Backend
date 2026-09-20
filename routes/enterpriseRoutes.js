const express = require('express');
const { verifyToken, requireEnterpriseTenant, requireEnterpriseTenantWithStatus } = require('../utils/authMiddleware');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const EnterpriseOrganization = require('../models/EnterpriseOrganization');
const PartnerCampaign = require('../models/PartnerCampaign');
const PartnerConsentRequest = require('../models/PartnerConsentRequest');
const Recipient = require('../models/Recipient');
const Consent = require('../models/Consent');
const Purpose = require('../models/Purpose');
const Scope = require('../models/Scope');
const EnterpriseUser = require('../models/EnterpriseUser');

const EnterpriseDocument = require('../models/EnterpriseDocument');
const crypto = require('crypto');

// Setup secure file upload logic below
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const randomName = crypto.randomBytes(16).toString('hex');
    cb(null, randomName + path.extname(file.originalname))
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter
});

// Enterprise Registration (Public)
router.post('/register', upload.single('document'), async (req, res) => {
  try {
    const { 
      legalName, tradingName, registrationNumber, organizationType, industry, 
      website, registeredAddress, country, authRepName, authRepEmail, 
      authRepPhone, authRepDesignation, authRepDepartment,
      privacyName, privacyEmail, privacyPhone, privacyDesignation,
      requestedCapabilities, requestedChannels
    } = req.body;

    const org = new EnterpriseOrganization({
      legalName,
      tradingName,
      registrationNumber,
      organizationType,
      industry,
      website,
      registeredAddress,
      country,
      status: 'SUBMITTED',
      authorizedRepresentative: {
        name: authRepName,
        email: authRepEmail,
        phone: authRepPhone,
        designation: authRepDesignation,
        department: authRepDepartment
      },
      privacyContact: {
        name: privacyName,
        email: privacyEmail,
        phone: privacyPhone,
        designation: privacyDesignation
      },
      requestedCapabilities: requestedCapabilities ? JSON.parse(requestedCapabilities) : []
    });

    await org.save();

    if (req.file) {
      const doc = new EnterpriseDocument({
        organizationId: org._id,
        documentType: 'BUSINESS_REGISTRATION',
        originalFilename: req.file.originalname,
        storedFilename: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        storagePath: req.file.path
      });
      await doc.save();
    }

    try {
      const NodemailerProvider = require('../services/messaging/NodemailerProvider');
      await NodemailerProvider.deliver({
        customer: { email: authRepEmail },
        subject: 'ConsentHub Enterprise Application Submitted',
        content: 'Your application for ' + legalName + ' has been received and is currently under review by our administrators. You will be notified once a decision is made.'
      });
    } catch (e) {
      console.error('Failed to send notification email', e);
    }

    res.status(201).json({ success: true, message: 'Organization registered', organizationId: org._id });
  } catch (error) {
    console.error('Enterprise registration error:', error);
    res.status(500).json({ error: true, message: 'Failed to submit application.' });
  }
});

// Resubmit Application
router.post('/application/resubmit', verifyToken, requireEnterpriseTenantWithStatus(['MORE_INFORMATION_REQUIRED']), upload.single('document'), async (req, res) => {
  try {
    const org = req.enterprise.organization;
    
    // Process new file if provided
    if (req.file) {
      const doc = new EnterpriseDocument({
        organizationId: org._id,
        documentType: 'BUSINESS_REGISTRATION',
        originalFilename: req.file.originalname,
        storedFilename: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        storagePath: req.file.path,
        uploadedBy: req.user.id
      });
      await doc.save();
    }

    org.status = 'SUBMITTED';
    await org.save();

    res.json({ success: true, message: 'Application resubmitted successfully', organization: org });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Failed to resubmit application' });
  }
});

// Campaign Creation
router.post('/campaigns', verifyToken, requireEnterpriseTenant, async (req, res) => {
  try {
    const { campaignName, description, purposeId, channels, ageMin, ageMax, region, scopes } = req.body;
    
    // Fetch Recipient associated with the Enterprise
    const recipient = await Recipient.findOne({ organizationId: req.enterprise.organizationId });
    if (!recipient || recipient.status !== 'ACTIVE') {
      return res.status(403).json({ error: true, message: 'Active recipient record required for campaign creation' });
    }

    // Validate Purpose
    if (!recipient.approvedPurposes.includes(purposeId)) {
      return res.status(403).json({ error: true, message: 'Requested purpose is not approved for this recipient' });
    }

    // Validate Scopes
    if (scopes && scopes.length > 0) {
      for (const scopeId of scopes) {
        if (!recipient.approvedScopes.includes(scopeId)) {
          return res.status(403).json({ error: true, message: `Requested scope ${scopeId} is not approved for this recipient` });
        }
      }
    }
    
    const campaign = new PartnerCampaign({
      organizationId: req.enterprise.organizationId,
      campaignCode: 'CAMP-' + Date.now(),
      campaignName,
      description,
      purposeId,
      channels,
      audienceDefinition: {
        ageRange: { min: ageMin, max: ageMax },
        region
      },
      status: 'SUBMITTED'
    });

    await campaign.save();
    res.status(201).json({ success: true, campaign });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Failed to create campaign' });
  }
});

// Get Campaigns (Tenant isolated)
router.get('/campaigns', verifyToken, requireEnterpriseTenant, async (req, res) => {
  try {
    const campaigns = await PartnerCampaign.find({ organizationId: req.enterprise.organizationId });
    res.json({ success: true, data: campaigns });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Failed to fetch campaigns' });
  }
});

// Audience Estimation
router.post('/audience/estimate', verifyToken, requireEnterpriseTenant, async (req, res) => {
  try {
    const { ageRange, region } = req.body;
    
    // Whitelisted allowed filters
    const matchCriteria = { role: 'customer', status: 'active' };
    
    if (ageRange && (ageRange.min || ageRange.max)) {
      matchCriteria.age = {};
      if (ageRange.min) matchCriteria.age.$gte = parseInt(ageRange.min);
      if (ageRange.max) matchCriteria.age.$lte = parseInt(ageRange.max);
    }
    
    if (region && typeof region === 'string') {
      matchCriteria.region = region;
    }

    const User = require('../models/User');
    const result = await User.aggregate([
      { $match: matchCriteria },
      { $count: "estimatedCount" }
    ]);
    
    const estimatedCount = result.length > 0 ? result[0].estimatedCount : 0;
    
    res.json({ 
      success: true, 
      estimatedCount, 
      evaluatedAt: new Date(), 
      appliedCriteria: Object.keys(matchCriteria).filter(k => k !== 'role' && k !== 'status')
    });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Failed to estimate audience' });
  }
});

// Launch Campaign
router.post('/campaigns/:id/launch', verifyToken, requireEnterpriseTenant, async (req, res) => {
  try {
    const campaign = await PartnerCampaign.findOne({
      _id: req.params.id,
      organizationId: req.enterprise.organizationId
    });

    if (!campaign) return res.status(404).json({ error: true, message: 'Campaign not found' });
    if (campaign.status !== 'APPROVED') return res.status(400).json({ error: true, message: 'Campaign must be APPROVED to launch' });

    // Fetch approved message template
    const CampaignMessageTemplate = require('../models/CampaignMessageTemplate');
    const template = await CampaignMessageTemplate.findOne({
      campaignId: campaign._id,
      status: 'APPROVED'
    });
    
    // In strict mode, we'd fail if no template. For demo, we can fallback to default.
    const messageContent = template ? template.content : null;

    // Execute targeting logic. This must select the same population that
    // POST /audience/estimate counts, otherwise the enterprise is shown one
    // audience size and a different set of people is messaged.
    const User = require('../models/User');
    const matchCriteria = { role: 'customer', status: 'active' };
    if (campaign.audienceDefinition?.ageRange) {
      matchCriteria.age = {};
      if (campaign.audienceDefinition.ageRange.min) matchCriteria.age.$gte = parseInt(campaign.audienceDefinition.ageRange.min);
      if (campaign.audienceDefinition.ageRange.max) matchCriteria.age.$lte = parseInt(campaign.audienceDefinition.ageRange.max);
    }
    if (campaign.audienceDefinition?.region) {
      matchCriteria.region = campaign.audienceDefinition.region;
    }
    const audience = await User.find(matchCriteria);

    campaign.status = 'RUNNING';
    await campaign.save();

    const MessagingService = require('../services/MessagingProvider'); // This is our new MessagingService
    
    // Kick off dispatch process in background for each channel
    for (const channel of campaign.channels) {
      MessagingService.sendCampaignBatch(campaign, audience, channel, messageContent)
        .catch(err => console.error(`[Campaign ${campaign._id}] Delivery error for ${channel}:`, err));
    }

    res.json({ success: true, message: 'Campaign launched successfully', audienceSize: audience.length });
  } catch (error) {
    console.error('Launch Error:', error);
    res.status(500).json({ error: true, message: 'Failed to launch campaign' });
  }
});

// Secure Document Retrieval
router.get('/documents/:id', verifyToken, requireEnterpriseTenant, async (req, res) => {
  try {
    const EnterpriseDocument = require('../models/EnterpriseDocument');
    const doc = await EnterpriseDocument.findOne({
      _id: req.params.id,
      organizationId: req.enterprise.organizationId
    });
    
    if (!doc) return res.status(404).json({ error: true, message: 'Document not found or unauthorized' });

    const fs = require('fs');
    const path = require('path');
    const absolutePath = path.resolve(process.cwd(), doc.storagePath);
    
    if (fs.existsSync(absolutePath)) {
      res.setHeader('Content-Type', doc.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${doc.originalFilename}"`);
      fs.createReadStream(absolutePath).pipe(res);
    } else {
      res.status(404).json({ error: true, message: 'File not found on disk' });
    }
  } catch (error) {
    res.status(500).json({ error: true, message: 'Failed to retrieve document' });
  }
});

// Enterprise Analytics
router.get('/analytics', verifyToken, requireEnterpriseTenant, async (req, res) => {
  try {
    const campaigns = await PartnerCampaign.countDocuments({ organizationId: req.enterprise.organizationId });
    const requests = await PartnerConsentRequest.find({ organizationId: req.enterprise.organizationId });
    
    const pending = requests.filter(r => r.status === 'PENDING').length;
    const granted = requests.filter(r => r.status === 'GRANTED').length;
    const declined = requests.filter(r => r.status === 'DECLINED').length;

    // Fetch delivery events for campaigns owned by this org
    const orgCampaigns = await PartnerCampaign.find({ organizationId: req.enterprise.organizationId }).select('_id');
    const campaignIds = orgCampaigns.map(c => c._id);
    
    const DeliveryEvent = require('../models/DeliveryEvent');
    const deliveryEvents = await DeliveryEvent.find({ campaignId: { $in: campaignIds } });

    const deliveries = {
      total: deliveryEvents.length,
      sent: deliveryEvents.filter(e => e.status === 'SENT').length,
      failed: deliveryEvents.filter(e => e.status === 'FAILED').length,
      suppressed: deliveryEvents.filter(e => e.status === 'SUPPRESSED').length,
      fallbacks: deliveryEvents.filter(e => e.fallbackUsed).length
    };
    
    res.json({
      success: true,
      metrics: {
        totalCampaigns: campaigns,
        totalRequests: requests.length,
        pending,
        granted,
        declined,
        grantRate: requests.length ? ((granted / requests.length) * 100).toFixed(1) : 0,
        deliveries
      }
    });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Failed to fetch analytics' });
  }
});


router.post('/activate', async (req, res) => {
  try {
    const { token, email, password } = req.body;
    if (!token || !email || !password) {
      return res.status(400).json({ error: true, message: 'Missing required fields' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: true, message: 'Password must be at least 8 characters' });
    }

    const User = require('../models/User');
    const user = await User.findOne({ email, role: 'enterprise' });
    if (!user) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }

    if (user.isActivated) {
      return res.status(400).json({ error: true, message: 'Account is already activated' });
    }

    if (!user.activationTokenHash || !user.activationExpiresAt) {
      return res.status(400).json({ error: true, message: 'No pending activation found' });
    }

    if (user.activationExpiresAt < new Date()) {
      return res.status(400).json({ error: true, message: 'Activation token has expired' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    if (user.activationTokenHash !== tokenHash) {
      return res.status(400).json({ error: true, message: 'Invalid activation token' });
    }

    // Set password
    user.password = password;
    user.isActivated = true;
    user.activationUsedAt = new Date();
    user.activationTokenHash = undefined; // clear token

    await user.save();

    res.json({ success: true, message: 'Account activated successfully' });
  } catch (error) {
    console.error('Activation Error:', error);
    res.status(500).json({ error: true, message: 'Failed to activate account' });
  }
});




// Get single campaign
router.get('/campaigns/:id', verifyToken, requireEnterpriseTenant, async (req, res) => {
  try {
    const campaign = await PartnerCampaign.findOne({ _id: req.params.id, organizationId: req.enterprise.organizationId })
      .populate('purposeId')
      .populate('scopeIds');
    if (!campaign) return res.status(404).json({ error: true, message: 'Campaign not found' });
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Failed to fetch campaign' });
  }
});

// Update DRAFT campaign
router.put('/campaigns/:id', verifyToken, requireEnterpriseTenant, async (req, res) => {
  try {
    const campaign = await PartnerCampaign.findOne({ _id: req.params.id, organizationId: req.enterprise.organizationId });
    if (!campaign) return res.status(404).json({ error: true, message: 'Campaign not found' });
    
    if (campaign.status !== 'DRAFT' && campaign.status !== 'CHANGES_REQUIRED') {
      return res.status(400).json({ error: true, message: 'Only DRAFT or CHANGES_REQUIRED campaigns can be edited' });
    }

    const { campaignName, description, purposeId, channels, ageMin, ageMax, region, scopes, consentTemplateVersionId, messageTemplateId, campaignStart, campaignEnd } = req.body;
    
    // Additional validation omitted for brevity, but should match POST
    if (campaignName) campaign.campaignName = campaignName;
    if (description) campaign.description = description;
    if (purposeId) campaign.purposeId = purposeId;
    if (scopes) campaign.scopeIds = scopes;
    if (channels) campaign.channels = channels;
    if (ageMin !== undefined || ageMax !== undefined || region) {
        campaign.audienceDefinition = {
            ageRange: { min: ageMin, max: ageMax },
            region
        };
    }
    if (consentTemplateVersionId) campaign.consentTemplateVersionId = consentTemplateVersionId;
    if (messageTemplateId) campaign.messageTemplateId = messageTemplateId;
    if (campaignStart) campaign.campaignStart = campaignStart;
    if (campaignEnd) campaign.campaignEnd = campaignEnd;

    await campaign.save();
    res.json({ success: true, campaign });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Failed to update campaign' });
  }
});

// Submit DRAFT campaign for approval
router.post('/campaigns/:id/submit', verifyToken, requireEnterpriseTenant, async (req, res) => {
  try {
    const campaign = await PartnerCampaign.findOne({ _id: req.params.id, organizationId: req.enterprise.organizationId });
    if (!campaign) return res.status(404).json({ error: true, message: 'Campaign not found' });
    
    if (campaign.status !== 'DRAFT' && campaign.status !== 'CHANGES_REQUIRED') {
      return res.status(400).json({ error: true, message: 'Only DRAFT or CHANGES_REQUIRED campaigns can be submitted' });
    }

    // Required fields check
    if (!campaign.campaignName || !campaign.purposeId || !campaign.channels.length || !campaign.campaignStart || !campaign.campaignEnd || !campaign.consentTemplateVersionId || !campaign.messageTemplateId) {
       return res.status(400).json({ error: true, message: 'Incomplete campaign details. Please complete all required fields.' });
    }

    campaign.status = 'SUBMITTED';
    campaign.submittedAt = new Date();
    await campaign.save();
    res.json({ success: true, message: 'Campaign submitted for approval', campaign });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Failed to submit campaign' });
  }
});

// Delete/Cancel DRAFT campaign
router.delete('/campaigns/:id', verifyToken, requireEnterpriseTenant, async (req, res) => {
  try {
    const campaign = await PartnerCampaign.findOne({ _id: req.params.id, organizationId: req.enterprise.organizationId });
    if (!campaign) return res.status(404).json({ error: true, message: 'Campaign not found' });
    
    if (campaign.status === 'DRAFT') {
      await PartnerCampaign.deleteOne({ _id: campaign._id });
      res.json({ success: true, message: 'Campaign deleted' });
    } else {
      campaign.status = 'CANCELLED';
      await campaign.save();
      res.json({ success: true, message: 'Campaign cancelled', campaign });
    }
  } catch (error) {
    res.status(500).json({ error: true, message: 'Failed to delete/cancel campaign' });
  }
});

// Get Configuration (Recipient, Purposes, Scopes, Channels)
router.get('/configuration', verifyToken, requireEnterpriseTenant, async (req, res) => {
  try {
    const recipient = await Recipient.findOne({ organizationId: req.enterprise.organizationId })
      .populate('approvedPurposes')
      .populate('approvedScopes');
    
    if (!recipient) {
       return res.json({ success: true, data: { recipient: null, approvedPurposes: [], approvedScopes: [], approvedChannels: [] } });
    }

    // For demo purposes, we will return some standard channels
    const approvedChannels = ['SMS', 'EMAIL', 'MYSLT_PUSH'];
    
    res.json({ success: true, data: {
      recipient,
      approvedPurposes: recipient.approvedPurposes,
      approvedScopes: recipient.approvedScopes,
      approvedChannels
    }});
  } catch (error) {
    res.status(500).json({ error: true, message: 'Failed to fetch configuration' });
  }
});

// Get Consent Templates for Recipient
router.get('/consent-templates', verifyToken, requireEnterpriseTenant, async (req, res) => {
    try {
        const recipient = await Recipient.findOne({ organizationId: req.enterprise.organizationId });
        if (!recipient) return res.status(403).json({ error: true, message: 'Recipient not found' });

        const ConsentTemplate = require('../models/ConsentTemplate');
        const ConsentTemplateVersion = require('../models/ConsentTemplateVersion');

        const templates = await ConsentTemplate.find({ recipientId: recipient._id, status: 'ACTIVE' });
        const templateIds = templates.map(t => t._id);

        const versions = await ConsentTemplateVersion.find({ 
            templateId: { $in: templateIds }, 
            status: 'APPROVED' 
        }).populate('templateId');

        res.json({ success: true, data: versions });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Failed to fetch consent templates' });
    }
});

// Message Templates CRUD
router.get('/message-templates', verifyToken, requireEnterpriseTenant, async (req, res) => {
    try {
        const CampaignMessageTemplate = require('../models/CampaignMessageTemplate');
        const templates = await CampaignMessageTemplate.find({ organizationId: req.enterprise.organizationId });
        res.json({ success: true, data: templates });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Failed to fetch message templates' });
    }
});

router.post('/message-templates', verifyToken, requireEnterpriseTenant, async (req, res) => {
    try {
        const { channel, language, version, content, campaignId } = req.body;
        const CampaignMessageTemplate = require('../models/CampaignMessageTemplate');
        
        const template = new CampaignMessageTemplate({
            organizationId: req.enterprise.organizationId,
            campaignId: campaignId || null,
            channel,
            language: language || 'en',
            version: version || '1.0',
            content,
            status: 'DRAFT',
            createdBy: req.user.id
        });
        
        await template.save();
        res.json({ success: true, data: template });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Failed to create message template' });
    }
});


module.exports = router;
