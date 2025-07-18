const mongoose = require('mongoose');

const dsarSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  partyId: {
    type: String,
    required: true,
    ref: 'Party'
  },
  requestType: {
    type: String,
    required: true,
    enum: [
      'access',
      'rectification',
      'erasure',
      'portability',
      'restriction',
      'objection',
      'automated_decision_making'
    ]
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'rejected', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  completedAt: {
    type: Date,
    required: false
  },
  assignedTo: {
    type: String,
    required: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationMethod: {
    type: String,
    enum: ['email', 'phone', 'identity_document', 'in_person'],
    required: false
  },
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: Date
  }],
  response: {
    message: String,
    documents: [{
      name: String,
      type: String,
      url: String,
      createdAt: Date
    }],
    deliveredAt: Date
  },
  notes: [{
    author: String,
    message: String,
    timestamp: Date,
    isInternal: Boolean
  }],
  metadata: {
    source: String,
    channel: String,
    ipAddress: String,
    userAgent: String,
    customFields: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for better performance
dsarSchema.index({ partyId: 1 });
dsarSchema.index({ requestType: 1 });
dsarSchema.index({ status: 1 });
dsarSchema.index({ priority: 1 });
dsarSchema.index({ dueDate: 1 });
dsarSchema.index({ submittedAt: -1 });
dsarSchema.index({ assignedTo: 1 });

// Pre-save middleware to set due date
dsarSchema.pre('save', function(next) {
  if (this.isNew && !this.dueDate) {
    // Set due date to 30 days from submission (GDPR requirement)
    this.dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

// Virtual for days remaining
dsarSchema.virtual('daysRemaining').get(function() {
  if (this.status === 'completed') return 0;
  
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  const diffTime = dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

// Virtual for overdue status
dsarSchema.virtual('isOverdue').get(function() {
  if (this.status === 'completed') return false;
  return this.daysRemaining < 0;
});

// Ensure virtual fields are serialized
dsarSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('DSAR', dsarSchema);
