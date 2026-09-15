const mongoose = require('mongoose');

const ScopeSchema = new mongoose.Schema({
  scopeCode: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  scopeType: { type: String },
  resource: { type: String },
  operation: { type: String },
  status: {
    type: String,
    enum: ['ACTIVE', 'RETIRED'],
    default: 'ACTIVE'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Scope', ScopeSchema);
