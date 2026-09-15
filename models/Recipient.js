const mongoose = require('mongoose');

const RecipientSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'EnterpriseOrganization', required: true },
  recipientCode: { type: String, required: true, unique: true },
  legalName: { type: String, required: true },
  recipientType: { type: String, enum: ['PARTNER', 'BANK', 'FINTECH', 'GOVERNMENT', 'INTERNAL_APPLICATION', 'OTHER'], default: 'PARTNER' },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
  validityStart: { type: Date },
  validityEnd: { type: Date },
  approvedPurposes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Purpose' }],
  approvedScopes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scope' }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Recipient', RecipientSchema);
