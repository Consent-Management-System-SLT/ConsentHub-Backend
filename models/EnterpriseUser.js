const mongoose = require('mongoose');

const EnterpriseUserSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'EnterpriseOrganization', required: true },
  organizationRole: {
    type: String,
    enum: ['OWNER', 'ADMIN', 'CAMPAIGN_MANAGER', 'ANALYST', 'VIEWER'],
    default: 'VIEWER'
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    default: 'ACTIVE'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('EnterpriseUser', EnterpriseUserSchema);
