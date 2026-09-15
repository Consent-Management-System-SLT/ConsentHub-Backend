const mongoose = require('mongoose');

const ConsentTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipient', required: true },
  purposeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Purpose', required: true },
  scopeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scope' }],
  status: { type: String, enum: ['DRAFT', 'ACTIVE', 'RETIRED'], default: 'DRAFT' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('ConsentTemplate', ConsentTemplateSchema);
