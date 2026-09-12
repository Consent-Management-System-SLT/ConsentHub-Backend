const mongoose = require('mongoose');

const externalPartyMappingSchema = new mongoose.Schema({
  sourceSystem: {
    type: String,
    required: true,
    enum: ['EASYAPPLY'], // Can be expanded in the future
    uppercase: true,
    trim: true
  },
  externalCustomerId: {
    type: String,
    required: true,
    trim: true
  },
  partyId: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'external_party_mappings'
});

// Required unique constraint: sourceSystem + externalCustomerId
externalPartyMappingSchema.index({ sourceSystem: 1, externalCustomerId: 1 }, { unique: true });
externalPartyMappingSchema.index({ partyId: 1 });

module.exports = mongoose.model('ExternalPartyMapping', externalPartyMappingSchema);
