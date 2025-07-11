const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const partySchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  partyType: {
    type: String,
    enum: ['individual', 'organization'],
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  tradingName: {
    type: String,
  },
  nameType: {
    type: String,
    enum: ['legal', 'trading', 'display'],
    default: 'legal',
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
  // Contact information
  contactInformation: [{
    contactType: {
      type: String,
      enum: ['email', 'phone', 'mobile', 'fax', 'address'],
      required: true,
    },
    contactValue: {
      type: String,
      required: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    validFor: {
      startDateTime: {
        type: Date,
        default: Date.now,
      },
      endDateTime: {
        type: Date,
      },
    },
  }],
  // Characteristics
  characteristics: [{
    name: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    valueType: {
      type: String,
      enum: ['string', 'number', 'boolean', 'date'],
      default: 'string',
    },
  }],
  // Individual specific fields
  individualIdentification: [{
    identificationType: {
      type: String,
      enum: ['passport', 'national_id', 'driving_license', 'tax_id'],
    },
    identificationId: {
      type: String,
    },
    issuingAuthority: {
      type: String,
    },
    issuingDate: {
      type: Date,
    },
    expirationDate: {
      type: Date,
    },
  }],
  // Organization specific fields
  organizationIdentification: [{
    identificationType: {
      type: String,
      enum: ['business_registration', 'tax_registration', 'vat_registration'],
    },
    identificationId: {
      type: String,
    },
    issuingAuthority: {
      type: String,
    },
    issuingDate: {
      type: Date,
    },
    expirationDate: {
      type: Date,
    },
  }],
  // Relationships
  partyRelationships: [{
    relationshipType: {
      type: String,
      enum: ['parent', 'child', 'spouse', 'guardian', 'subsidiary', 'partner'],
      required: true,
    },
    relatedPartyId: {
      type: String,
      required: true,
    },
    validFor: {
      startDateTime: {
        type: Date,
        default: Date.now,
      },
      endDateTime: {
        type: Date,
      },
    },
  }],
  // Roles
  partyRoles: [{
    name: {
      type: String,
      enum: ['customer', 'subscriber', 'user', 'contact', 'billing_contact', 'guardian'],
      required: true,
    },
    validFor: {
      startDateTime: {
        type: Date,
        default: Date.now,
      },
      endDateTime: {
        type: Date,
      },
    },
  }],
  // Privacy settings
  privacySettings: {
    dataProcessingConsent: {
      type: Boolean,
      default: false,
    },
    marketingConsent: {
      type: Boolean,
      default: false,
    },
    thirdPartyDataSharing: {
      type: Boolean,
      default: false,
    },
    profileAnalytics: {
      type: Boolean,
      default: false,
    },
  },
  // Preferences
  preferences: {
    language: {
      type: String,
      enum: ['en', 'si', 'ta'],
      default: 'en',
    },
    timeZone: {
      type: String,
      default: 'Asia/Colombo',
    },
    currency: {
      type: String,
      default: 'LKR',
    },
    communicationPreferences: {
      email: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: true,
      },
    },
  },
  // External references
  externalReferences: [{
    type: {
      type: String,
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
    href: {
      type: String,
    },
  }],
  // Validity period
  validFor: {
    startDateTime: {
      type: Date,
      default: Date.now,
    },
    endDateTime: {
      type: Date,
    },
  },
  // Metadata
  metadata: {
    createdBy: {
      type: String,
      required: true,
    },
    lastModifiedBy: {
      type: String,
    },
    source: {
      type: String,
      enum: ['web', 'mobile', 'call_center', 'store', 'api'],
      default: 'web',
    },
    tags: [{
      type: String,
    }],
  },
}, {
  timestamps: true,
});

// Indexes for performance
partySchema.index({ partyType: 1 });
partySchema.index({ status: 1 });
partySchema.index({ 'contactInformation.contactType': 1, 'contactInformation.contactValue': 1 });
partySchema.index({ 'individualIdentification.identificationType': 1, 'individualIdentification.identificationId': 1 });
partySchema.index({ 'organizationIdentification.identificationType': 1, 'organizationIdentification.identificationId': 1 });
partySchema.index({ 'partyRoles.name': 1 });
partySchema.index({ createdAt: -1 });

// Virtual for full name
partySchema.virtual('fullName').get(function() {
  return this.name;
});

// Method to get primary contact
partySchema.methods.getPrimaryContact = function(type) {
  return this.contactInformation.find(contact => 
    contact.contactType === type && contact.isPrimary
  );
};

// Method to check if party has role
partySchema.methods.hasRole = function(roleName) {
  return this.partyRoles.some(role => 
    role.name === roleName && 
    (!role.validFor.endDateTime || role.validFor.endDateTime > new Date())
  );
};

module.exports = mongoose.model('Party', partySchema);
