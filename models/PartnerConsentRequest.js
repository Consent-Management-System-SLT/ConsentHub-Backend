const mongoose = require('mongoose');

const PartnerConsentRequestSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerCampaign', required: true },
  customerId: { type: String, required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'EnterpriseOrganization', required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipient', required: true },
  purposeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Purpose', required: true },
  scopeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scope' }],
  templateVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ConsentTemplateVersion', required: true },
  status: { type: String, enum: ['PENDING', 'GRANTED', 'DECLINED', 'EXPIRED', 'CANCELLED'], default: 'PENDING' },
  expiresAt: { type: Date },
  respondedAt: { type: Date }
}, { timestamps: true });

PartnerConsentRequestSchema.index({ customerId: 1, status: 1 });

module.exports = mongoose.model('PartnerConsentRequest', PartnerConsentRequestSchema);
