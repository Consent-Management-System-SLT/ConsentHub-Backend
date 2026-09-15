const mongoose = require('mongoose');

const DeliveryEventSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerCampaign', required: true },
  customerId: { type: String, required: true }, // Using String to match existing user references (sometimes ObjectIds, sometimes Strings)
  requestedChannel: { type: String, required: true },
  actualChannel: { type: String, required: true },
  provider: { type: String, required: true },
  status: { type: String, enum: ['QUEUED', 'SENT', 'FAILED', 'SUPPRESSED'], required: true },
  failureReason: { type: String },
  messageId: { type: String },
  fallbackUsed: { type: Boolean, default: false },
  fallbackReason: { type: String }
}, { timestamps: true });

DeliveryEventSchema.index({ campaignId: 1, status: 1 });

module.exports = mongoose.model('DeliveryEvent', DeliveryEventSchema);
