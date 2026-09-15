const mongoose = require('mongoose');

const PurposeSchema = new mongoose.Schema({
  purposeCode: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  legalBasis: { type: String, default: 'consent' },
  status: {
    type: String,
    enum: ['DRAFT', 'UNDER_REVIEW', 'ACTIVE', 'RETIRED'],
    default: 'DRAFT'
  },
  version: { type: String, default: '1.0' },
  validFrom: { type: Date },
  validUntil: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Purpose', PurposeSchema);
