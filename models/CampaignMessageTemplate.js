const mongoose = require('mongoose');

const CampaignMessageTemplateSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'EnterpriseOrganization', required: true },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerCampaign' },
  channel: { type: String, required: true },
  language: { type: String, default: 'en' },
  version: { type: String, required: true },
  content: { type: String, required: true },
  status: { type: String, enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'], default: 'DRAFT' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('CampaignMessageTemplate', CampaignMessageTemplateSchema);
