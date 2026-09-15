const mongoose = require('mongoose');

const EnterpriseDocumentSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'EnterpriseOrganization', required: true },
  documentType: { 
    type: String, 
    enum: ['BUSINESS_REGISTRATION', 'AUTHORIZATION_LETTER', 'COMPLIANCE_DOCUMENT', 'OTHER'],
    required: true 
  },
  originalFilename: { type: String, required: true },
  storedFilename: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number },
  storagePath: { type: String, required: true },
  reviewStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  reviewNotes: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('EnterpriseDocument', EnterpriseDocumentSchema);
