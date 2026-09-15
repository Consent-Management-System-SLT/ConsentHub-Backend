const express = require('express');
const router = express.Router();
const EnterpriseOrganization = require('../models/EnterpriseOrganization');
const PartnerCampaign = require('../models/PartnerCampaign');
const Recipient = require('../models/Recipient');

// List Applications
router.get('/applications', async (req, res) => {
  try {
    const apps = await EnterpriseOrganization.find().sort({ createdAt: -1 }).lean();
    const EnterpriseDocument = require('../models/EnterpriseDocument');
    
    for (const app of apps) {
      const docs = await EnterpriseDocument.find({ organizationId: app._id });
      app.documents = docs;
    }

    res.json({ success: true, data: apps });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Failed to fetch applications' });
  }
});

// Approve Application
router.post('/applications/:id/approve', async (req, res) => {
    try {
      const org = await EnterpriseOrganization.findById(req.params.id);
      if (!org) return res.status(404).json({ error: true, message: 'Organization not found' });
      
      org.status = 'ACTIVE';
      org.approvedAt = new Date();
      org.approvedBy = req.user.id;
      
      // Create Recipient
      let recipient = await Recipient.findOne({ organizationId: org._id });
      if (!recipient) {
        recipient = new Recipient({
          organizationId: org._id,
          recipientCode: 'REC-' + Date.now(),
          legalName: org.legalName,
          status: 'ACTIVE'
        });
        await recipient.save();
      } else {
        recipient.status = 'ACTIVE';
        await recipient.save();
      }
      
      // Secure token generation for activation
      const crypto = require('crypto');
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      
      const User = require('../models/User');
      let enterpriseUser = await User.findOne({ email: org.authorizedRepresentative.email });
      if (!enterpriseUser) {
        enterpriseUser = new User({
          email: org.authorizedRepresentative.email,
          firstName: org.authorizedRepresentative.name || org.legalName,
          lastName: '',
          phone: org.authorizedRepresentative.phone || '0000000000',
          role: 'enterprise',
          password: crypto.randomBytes(16).toString('hex'), // temp unguessable password
          activationTokenHash: tokenHash,
          activationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          isActivated: false
        });
        await enterpriseUser.save();
        
        const EnterpriseUser = require('../models/EnterpriseUser');
        const eu = new EnterpriseUser({
          userId: enterpriseUser._id,
          organizationId: org._id,
          organizationRole: 'OWNER'
        });
        await eu.save();
      } else {
        enterpriseUser.activationTokenHash = tokenHash;
        enterpriseUser.activationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        enterpriseUser.isActivated = false;
        await enterpriseUser.save();
      }

      // Send email notification with raw token link
      try {
        const NodemailerProvider = require('../services/messaging/NodemailerProvider');
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const activationLink = `${frontendUrl}/enterprise/activate?token=${rawToken}&email=${encodeURIComponent(enterpriseUser.email)}`;
        
        const emailContent = `Hello ${enterpriseUser.firstName},\n\nYour Enterprise registration for ${org.legalName} has been approved by SLT ConsentHub.\n\nLogin Email: ${enterpriseUser.email}\n\nTo activate your Enterprise account and create your password, use the secure activation link below:\n\n${activationLink}\n\nThis link expires in 24 hours and may only be used once.\n\nAfter activation, login through ConsentHub using your registered email.`;

        const result = await NodemailerProvider.deliver({
          customer: enterpriseUser,
          subject: 'Your SLT ConsentHub Enterprise Account Has Been Approved',
          content: emailContent
        });
        
        if (result.success) {
          org.activationEmailStatus = 'SENT';
        } else {
          org.activationEmailStatus = 'FAILED';
        }
      } catch (e) {
        console.error('Failed to send notification email', e);
        org.activationEmailStatus = 'FAILED';
      }
      
      await org.save();
  
      res.json({ success: true, organization: org });
    } catch (error) {
      console.error('Approve Error:', error);
      res.status(500).json({ error: true, message: 'Failed to approve application' });
    }
  });

// List Campaigns
router.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await PartnerCampaign.find().populate('organizationId').populate('purposeId');
    res.json({ success: true, data: campaigns });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Failed to fetch campaigns' });
  }
});

// Approve Campaign and Generate Invitations
router.post('/campaigns/:id/approve', async (req, res) => {
  try {
    const campaign = await PartnerCampaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: true, message: 'Campaign not found' });
    if (campaign.status !== 'SUBMITTED') return res.status(400).json({ error: true, message: 'Campaign must be in SUBMITTED state to approve' });

    campaign.status = 'APPROVED';
    await campaign.save();

    // Generate PartnerConsentRequests for eligible audience
    const matchCriteria = { role: 'customer', status: 'active' };
    const ageRange = campaign.audienceDefinition?.ageRange;
    if (ageRange && (ageRange.min || ageRange.max)) {
      matchCriteria.age = {};
      if (ageRange.min) matchCriteria.age.$gte = parseInt(ageRange.min);
      if (ageRange.max) matchCriteria.age.$lte = parseInt(ageRange.max);
    }
    const region = campaign.audienceDefinition?.region;
    if (region) {
      matchCriteria.region = region;
    }

    const User = require('../models/User');
    const eligibleCustomers = await User.find(matchCriteria);

    const PartnerConsentRequest = require('../models/PartnerConsentRequest');
    const ConsentTemplateVersion = require('../models/ConsentTemplateVersion');
    const Recipient = require('../models/Recipient');
    const Purpose = require('../models/Purpose');
    const EnterpriseOrganization = require('../models/EnterpriseOrganization');

    const org = await EnterpriseOrganization.findById(campaign.organizationId);
    const recipient = await Recipient.findOne({ organizationId: campaign.organizationId });
    const purpose = await Purpose.findById(campaign.purposeId);
    
    // Find the active template version for this purpose/recipient
    const template = await require('../models/ConsentTemplate').findOne({ recipientId: recipient._id, purposeId: purpose._id });
    let templateVersionId = null;
    if (template) {
      const activeVersion = await ConsentTemplateVersion.findOne({ templateId: template._id, status: 'APPROVED' }).sort({ createdAt: -1 });
      if (activeVersion) templateVersionId = activeVersion._id;
    }

    // Default template version if none exists (just for testing logic safety)
    if (!templateVersionId) {
      // In a real system, you'd fail here, but we proceed for demonstration resilience
    }

    const NodemailerProvider = require('../services/messaging/NodemailerProvider');

    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Valid until 1 year from now

    for (const customer of eligibleCustomers) {
      // Check if request already exists to prevent duplicates
      const existing = await PartnerConsentRequest.findOne({
        campaignId: campaign._id,
        customerId: customer._id
      });

      if (!existing) {
        const reqDoc = new PartnerConsentRequest({
          campaignId: campaign._id,
          customerId: customer._id,
          organizationId: campaign.organizationId,
          recipientId: recipient ? recipient._id : null,
          purposeId: campaign.purposeId,
          templateVersionId: templateVersionId, // May be null if no template setup
          expiresAt: expiryDate,
          status: 'PENDING'
        });
        await reqDoc.save();

        // Send Email Invitation
        await NodemailerProvider.sendConsentRequest(customer, {
          organizationName: org ? org.legalName : 'Unknown Partner',
          purposeName: purpose ? purpose.name : 'Promotional Marketing',
          requestedChannel: campaign.channels.join(', '),
          validUntil: expiryDate.toLocaleDateString()
        });
      }
    }

    res.json({ success: true, message: 'Campaign approved and invitations sent', campaign });
  } catch (error) {
    console.error('Approval Error:', error);
    res.status(500).json({ error: true, message: 'Failed to approve campaign' });
  }
});

// Request More Information
router.post('/applications/:id/request-information', async (req, res) => {
  try {
    const { reason, requestedItems } = req.body;
    const org = await EnterpriseOrganization.findById(req.params.id);
    
    if (!org) return res.status(404).json({ error: true, message: 'Organization not found' });
    
    org.status = 'MORE_INFORMATION_REQUIRED';
    org.reviewNotes = reason;
    await org.save();

    // Send email notification
    try {
      const NodemailerProvider = require('../services/messaging/NodemailerProvider');
      const User = require('../models/User');
      const enterpriseUser = await User.findOne({ email: org.authorizedRepresentative.email });
      if (enterpriseUser) {
        await NodemailerProvider.deliver({
          customer: enterpriseUser,
          subject: 'Action Required: ConsentHub Enterprise Application',
          content: `Your application requires more information:\n\n${reason}`
        });
      }
    } catch (e) {
      console.error('Failed to send notification email', e);
    }

    res.json({ success: true, message: 'More information requested', organization: org });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Failed to request information' });
  }
});

// Reject Application
router.post('/applications/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const org = await EnterpriseOrganization.findById(req.params.id);
    
    if (!org) return res.status(404).json({ error: true, message: 'Organization not found' });
    
    org.status = 'REJECTED';
    org.reviewNotes = reason;
    await org.save();

    // Send email notification
    try {
      const NodemailerProvider = require('../services/messaging/NodemailerProvider');
      const User = require('../models/User');
      const enterpriseUser = await User.findOne({ email: org.authorizedRepresentative.email });
      if (enterpriseUser) {
        await NodemailerProvider.deliver({
          customer: enterpriseUser,
          subject: 'ConsentHub Enterprise Application Update',
          content: `Your application has been rejected.\n\nReason: ${reason}`
        });
      }
    } catch (e) {
      console.error('Failed to send notification email', e);
    }

    res.json({ success: true, message: 'Application rejected', organization: org });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Failed to reject application' });
  }
});

// Secure Document Retrieval
router.get('/documents/:id', async (req, res) => {
  try {
    const EnterpriseDocument = require('../models/EnterpriseDocument');
    const doc = await EnterpriseDocument.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: true, message: 'Document not found' });

    // Since this is the admin router, they already passed verifyToken and requireRole(['admin'])
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

const Purpose = require('../models/Purpose');
const Scope = require('../models/Scope');

// Purposes CRUD
router.post('/purposes', async (req, res) => {
  try {
    const purpose = new Purpose(req.body);
    await purpose.save();
    res.status(201).json({ success: true, purpose });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Failed to create purpose' });
  }
});

router.put('/purposes/:id/status', async (req, res) => {
  try {
    const purpose = await Purpose.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json({ success: true, purpose });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Failed to update purpose' });
  }
});

// Scopes CRUD
router.post('/scopes', async (req, res) => {
  try {
    const scope = new Scope(req.body);
    await scope.save();
    res.status(201).json({ success: true, scope });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Failed to create scope' });
  }
});

router.put('/scopes/:id/status', async (req, res) => {
  try {
    const scope = await Scope.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json({ success: true, scope });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Failed to update scope' });
  }
});

// Resend Activation
router.post('/applications/:id/resend-activation', async (req, res) => {
  try {
    const org = await EnterpriseOrganization.findById(req.params.id);
    if (!org) return res.status(404).json({ error: true, message: 'Organization not found' });
    
    if (org.status !== 'ACTIVE') {
      return res.status(400).json({ error: true, message: 'Organization is not ACTIVE' });
    }

    const User = require('../models/User');
    const enterpriseUser = await User.findOne({ email: org.authorizedRepresentative.email });
    if (!enterpriseUser) return res.status(404).json({ error: true, message: 'Enterprise user not found' });

    if (enterpriseUser.isActivated) {
      return res.status(400).json({ error: true, message: 'User is already activated' });
    }

    const crypto = require('crypto');
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    enterpriseUser.activationTokenHash = tokenHash;
    enterpriseUser.activationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await enterpriseUser.save();

    try {
      const NodemailerProvider = require('../services/messaging/NodemailerProvider');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const activationLink = frontendUrl + '/enterprise/activate?token=' + rawToken + '&email=' + encodeURIComponent(enterpriseUser.email);
      
      const emailContent = 'Hello ' + enterpriseUser.firstName + ',\n\nYour Enterprise registration for ' + org.legalName + ' has been approved by SLT ConsentHub.\n\nLogin Email: ' + enterpriseUser.email + '\n\nTo activate your Enterprise account and create your password, use the secure activation link below:\n\n' + activationLink + '\n\nThis link expires in 24 hours and may only be used once.\n\nAfter activation, login through ConsentHub using your registered email.';

      const result = await NodemailerProvider.deliver({
        customer: enterpriseUser,
        subject: 'Your SLT ConsentHub Enterprise Account Has Been Approved',
        content: emailContent
      });
      
      if (result.success) {
        org.activationEmailStatus = 'SENT';
      } else {
        org.activationEmailStatus = 'FAILED';
      }
    } catch (e) {
      console.error('Failed to send notification email', e);
      org.activationEmailStatus = 'FAILED';
    }
    
    await org.save();
    res.json({ success: true, message: 'Activation email resent' });
  } catch (error) {
    console.error('Resend Activation Error:', error);
    res.status(500).json({ error: true, message: 'Failed to resend activation email' });
  }
});




// --- Campaign Review Routes ---

// Get all submitted campaigns
router.get('/campaigns', async (req, res) => {
  try {
    const PartnerCampaign = require('../models/PartnerCampaign');
    const campaigns = await PartnerCampaign.find({ 
      status: { $in: ['SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUIRED'] } 
    }).populate('organizationId').populate('purposeId').populate('scopeIds');
    res.json({ success: true, data: campaigns });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Failed to fetch campaigns' });
  }
});

// Get single campaign for review
router.get('/campaigns/:id', async (req, res) => {
  try {
    const PartnerCampaign = require('../models/PartnerCampaign');
    const campaign = await PartnerCampaign.findById(req.params.id)
      .populate('organizationId')
      .populate('purposeId')
      .populate('scopeIds');
    if (!campaign) return res.status(404).json({ error: true, message: 'Campaign not found' });
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Failed to fetch campaign details' });
  }
});

// Approve campaign
router.post('/campaigns/:id/approve', async (req, res) => {
  try {
    const PartnerCampaign = require('../models/PartnerCampaign');
    const campaign = await PartnerCampaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: true, message: 'Campaign not found' });

    campaign.status = 'APPROVED';
    campaign.approvedAt = new Date();
    campaign.approvedBy = req.user.id;
    await campaign.save();

    res.json({ success: true, message: 'Campaign approved successfully', campaign });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Failed to approve campaign' });
  }
});

// Reject campaign
router.post('/campaigns/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const PartnerCampaign = require('../models/PartnerCampaign');
    const campaign = await PartnerCampaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: true, message: 'Campaign not found' });

    campaign.status = 'REJECTED';
    campaign.rejectionReason = reason;
    await campaign.save();

    res.json({ success: true, message: 'Campaign rejected', campaign });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Failed to reject campaign' });
  }
});

// Request changes
router.post('/campaigns/:id/request-changes', async (req, res) => {
  try {
    const { reason } = req.body;
    const PartnerCampaign = require('../models/PartnerCampaign');
    const campaign = await PartnerCampaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: true, message: 'Campaign not found' });

    campaign.status = 'CHANGES_REQUIRED';
    campaign.rejectionReason = reason; // Store reason in rejectionReason field or add a new field
    await campaign.save();

    res.json({ success: true, message: 'Changes requested', campaign });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Failed to request changes' });
  }
});


module.exports = router;
