const mongoose = require('mongoose');

const EnterpriseOrganizationSchema = new mongoose.Schema({
  legalName: { type: String, required: true },
  tradingName: { type: String },
  registrationNumber: { type: String, required: true },
  organizationType: { type: String },
  industry: { type: String },
  website: { type: String },
  registeredAddress: { type: String },
  country: { type: String },
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'MORE_INFORMATION_REQUIRED', 'APPROVED', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'EXPIRED'],
    default: 'SUBMITTED'
  },
  authorizedRepresentative: {
    name: String,
    designation: String,
    email: String,
    phone: String,
    department: String
  },
  privacyContact: {
    name: String,
    email: String,
    phone: String,
    designation: String
  },
  requestedCapabilities: [{ type: String }],
  approvedAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  activationEmailStatus: { type: String, enum: ['PENDING', 'SENT', 'FAILED', 'EXPIRED'], default: 'PENDING' }
}, {
  timestamps: true
});

module.exports = mongoose.model('EnterpriseOrganization', EnterpriseOrganizationSchema);
