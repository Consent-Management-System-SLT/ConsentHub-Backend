const mongoose = require('mongoose');
const crypto = require('crypto');

const ConsentTemplateVersionSchema = new mongoose.Schema({
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'ConsentTemplate', required: true },
  version: { type: String, required: true },
  language: { type: String, default: 'en' },
  title: { type: String, required: true },
  content: { type: String, required: true },
  contentHash: { type: String },
  status: { type: String, enum: ['DRAFT', 'APPROVED', 'SUPERSEDED'], default: 'DRAFT' },
  effectiveFrom: { type: Date },
  effectiveTo: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Pre-save hook to calculate SHA-256 hash of the exact consent wording
ConsentTemplateVersionSchema.pre('save', function(next) {
  if (this.isModified('content') || this.isNew) {
    this.contentHash = crypto.createHash('sha256').update(this.content).digest('hex');
  }
  next();
});

module.exports = mongoose.model('ConsentTemplateVersion', ConsentTemplateVersionSchema);
