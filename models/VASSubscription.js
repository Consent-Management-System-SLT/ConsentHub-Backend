const mongoose = require('mongoose');

const vasSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VASService',
    required: true,
    index: true
  },
  subscriptionId: {
    type: String,
    unique: true,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'cancelled'],
    default: 'active',
    index: true
  },
  isSubscribed: {
    type: Boolean,
    default: true,
    index: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  billing: {
    amount: { type: Number, default: 0 },
    frequency: { type: String, enum: ['monthly', 'daily', 'one-time'], default: 'monthly' },
    nextBillingDate: { type: Date }
  },
  preferences: {
    notifications: { type: Boolean, default: true },
    autoRenewal: { type: Boolean, default: true }
  },
  metadata: {
    activatedBy: { type: String }, // 'customer' or 'csr'
    activationChannel: { type: String }, // 'web', 'api', 'csr-dashboard'
    lastModified: { type: Date, default: Date.now },
    notes: { type: String }
  }
}, {
  timestamps: true,
  collection: 'vassubscriptions'
});

// Compound indexes for efficient queries
vasSubscriptionSchema.index({ userId: 1, serviceId: 1 });
vasSubscriptionSchema.index({ userId: 1, status: 1 });
vasSubscriptionSchema.index({ serviceId: 1, status: 1 });

// Virtual to get service details
vasSubscriptionSchema.virtual('service', {
  ref: 'VASService',
  localField: 'serviceId',
  foreignField: '_id',
  justOne: true
});

// Virtual to get user details
vasSubscriptionSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Ensure virtual fields are serialized
vasSubscriptionSchema.set('toJSON', { virtuals: true });
vasSubscriptionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('VASSubscription', vasSubscriptionSchema);