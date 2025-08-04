const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  // Firebase UID
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // User basic information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  emailVerified: {
    type: Boolean,
    default: false
  },

  phoneNumber: {
    type: String,
    sparse: true,
    index: true
  },

  phoneVerified: {
    type: Boolean,
    default: false
  },

  // User profile
  displayName: String,
  photoURL: String,

  // ConsentHub specific fields
  partyId: {
    type: String,
    index: true,
    sparse: true // Reference to party in party-service
  },

  role: {
    type: String,
    enum: ['customer', 'csr', 'admin'],
    default: 'customer',
    index: true
  },

  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending_verification'],
    default: 'pending_verification',
    index: true
  },

  // User preferences
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'Asia/Colombo'
    },
    notificationChannels: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    }
  },

  // Security
  lastLoginAt: Date,
  lastLoginIP: String,
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  accountLockedUntil: Date,

  // Custom claims for Firebase
  customClaims: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },

  // Metadata
  metadata: {
    creationTime: Date,
    lastSignInTime: Date,
    lastRefreshTime: Date
  },

  // Audit fields
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: String,
  updatedBy: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userProfileSchema.index({ email: 1, status: 1 });
userProfileSchema.index({ role: 1, status: 1 });
userProfileSchema.index({ partyId: 1 }, { sparse: true });
userProfileSchema.index({ createdAt: -1 });

// Virtual for full name
userProfileSchema.virtual('fullName').get(function() {
  return this.displayName || this.email;
});

// Methods
userProfileSchema.methods.isAccountLocked = function() {
  return this.accountLockedUntil && this.accountLockedUntil > Date.now();
};

userProfileSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.accountLockedUntil && this.accountLockedUntil < Date.now()) {
    return this.updateOne({
      $unset: { accountLockedUntil: 1 },
      $set: { failedLoginAttempts: 1 }
    });
  }

  const updates = { $inc: { failedLoginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.failedLoginAttempts + 1 >= 5 && !this.isAccountLocked()) {
    updates.$set = { 
      accountLockedUntil: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
    };
  }

  return this.updateOne(updates);
};

userProfileSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { 
      failedLoginAttempts: 1,
      accountLockedUntil: 1
    },
    $set: {
      lastLoginAt: new Date(),
      lastLoginIP: this.lastLoginIP
    }
  });
};

// Static methods
userProfileSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userProfileSchema.statics.findByFirebaseUid = function(uid) {
  return this.findOne({ firebaseUid: uid });
};

userProfileSchema.statics.findActiveUsers = function() {
  return this.find({ status: 'active' });
};

// Pre-save middleware
userProfileSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.updatedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('UserProfile', userProfileSchema);
