const mongoose = require('mongoose');

const ConsentEvidenceSchema = new mongoose.Schema({
  consentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consent', required: true },
  eventType: { type: String, required: true },
  decision: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  channel: { type: String },
  sourceApplication: { type: String },
  consentTextVersion: { type: String },
  consentTextHash: { type: String },
  authenticationMethod: { type: String },
  authenticationEventReference: { type: String },
  sessionReference: { type: String },
  transactionReference: { type: String },
  deviceReference: { type: String },
  ipReference: { type: String },
  userAgentReference: { type: String },
  csrId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  evidenceMetadata: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true
});

module.exports = mongoose.model('ConsentEvidence', ConsentEvidenceSchema);
