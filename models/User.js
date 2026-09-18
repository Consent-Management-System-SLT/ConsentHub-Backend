const mongoose = require('mongoose');
const { hash, verify, isHashed, normaliseAnswer } = require('../utils/password');
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    default: 'SLT-Mobitel',
    trim: true
  },
  department: {
    type: String,
    default: '',
    trim: true
  },
  jobTitle: {
    type: String,
    default: '',
    trim: true
  },
  // Asked at sign-up and used to confirm a password reset. The answer is
  // hashed by the pre-save hook exactly like the password.
  securityQuestion: {
    type: String,
    default: '',
    trim: true
  },
  securityAnswer: {
    type: String,
    default: '',
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'customer', 'csr', 'enterprise', 'guardian'],
    default: 'customer'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  activationTokenHash: { type: String },
  activationExpiresAt: { type: Date },
  activationUsedAt: { type: Date },
  isActivated: { type: Boolean, default: true },
  isActive: {
    type: Boolean,
    default: true
  },
  acceptTerms: {
    type: Boolean,
    default: false
  },
  acceptPrivacy: {
    type: Boolean,
    default: false
  },
  language: {
    type: String,
    default: 'en'
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  profilePicture: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  // Guardian/Minor relationship support
  hasMinorDependents: {
    type: Boolean,
    default: false
  },
  minorDependents: [{
    id: String,
    name: String,
    firstName: String,
    lastName: String,
    age: Number,
    dateOfBirth: String,
    relationship: {
      type: String,
      enum: ['child', 'ward', 'stepchild'],
      default: 'child'
    },
    legalDocuments: {
      birthCertificate: { type: Boolean, default: false },
      guardianshipPapers: { type: Boolean, default: false }
    }
  }],
  guardianOf: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true, // This adds createdAt and updatedAt automatically
  collection: 'users'
});
// Hash credentials on the way in.
//
// There was a comment elsewhere in the codebase claiming this hook existed, but
// it did not: passwords were written to MongoDB in plain text and the login
// route compared them with `!==`.
userSchema.pre('save', async function hashCredentials(next) {
  try {
    if (this.isModified('password') && this.password && !isHashed(this.password)) {
      this.password = await hash(this.password);
    }
    if (this.isModified('securityAnswer') && this.securityAnswer && !isHashed(this.securityAnswer)) {
      this.securityAnswer = await hash(normaliseAnswer(this.securityAnswer));
    }
    next();
  } catch (err) {
    next(err);
  }
});

/** Verify a login attempt. Resolves { ok, legacy }; legacy means the stored value was plaintext. */
userSchema.methods.verifyPassword = function verifyPassword(plain) {
  return verify(plain, this.password);
};

/** Verify a security answer, normalised the same way it was when stored. */
userSchema.methods.verifySecurityAnswer = function verifySecurityAnswer(plain) {
  return verify(normaliseAnswer(plain), this.securityAnswer);
};

// Virtual field for full name
userSchema.virtual('name').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Credentials must never leave the process, whatever a route selects.
function stripSecrets(_doc, ret) {
  delete ret.password;
  delete ret.securityAnswer;
  return ret;
}
// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: stripSecrets
});
userSchema.set('toObject', {
  virtuals: true,
  transform: stripSecrets
});
// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
module.exports = mongoose.model('User', userSchema);
