const mongoose = require('mongoose');

const PartnerCampaignSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'EnterpriseOrganization', required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipient' },
  campaignCode: { type: String, required: true },
  campaignName: { type: String, required: true },
  description: { type: String },
  purposeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Purpose', required: true },
  scopeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scope' }],
  channels: [{ type: String }],
  audienceDefinition: {
    ageRange: { min: Number, max: Number },
    region: String,
    serviceType: String
  },
  consentTemplateVersionId: { type: String },
  messageTemplateId: { type: String },
  campaignStart: { type: Date },
  campaignEnd: { type: Date },
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUIRED', 'APPROVED', 'CONSENT_COLLECTION', 'READY_TO_LAUNCH', 'RUNNING', 'PAUSED', 'COMPLETED', 'REJECTED', 'CANCELLED'],
    default: 'DRAFT'
  },
  submittedAt: { type: Date },
  approvedAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

module.exports = mongoose.model('PartnerCampaign', PartnerCampaignSchema);
