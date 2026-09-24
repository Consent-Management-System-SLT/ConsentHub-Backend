const mongoose = require('mongoose');

/**
 * The four tables of SLT_Consent_Management_Data_Model.pdf.
 * Column names are the PDF's, camelCased (CONSENT_SCOPE_ID -> consentScopeId), and the
 * numeric primary keys are real numbers handed out by nextId() because MongoDB has no sequences.
 * Only deviation: customerId allows 24 characters (the PDF's VARCHAR2(20)) because customers are
 * identified by their MongoDB user id.
 */

const YN = { type: String, enum: ['Y', 'N'], required: true };
const opts = (collection, createdAt = 'createdDate', updatedAt = 'updatedDate') => ({
  collection,
  versionKey: false,
  timestamps: { createdAt, updatedAt },
});

const CONSENT_STATUSES = ['GRANTED', 'DENIED', 'WITHDRAWN', 'NOT_RESPONDED'];
const SCOPE_STATUSES = ['DRAFT', 'UNDER_REVIEW', 'APPROVAL_PENDING', 'APPROVED', 'PLANNED', 'ACTIVE', 'REJECTED', 'RETIRED'];
const CHANNELS = ['WEB', 'MOBILE_APP', 'SMS', 'EMAIL', 'IVR', 'CALL_CENTER', 'BRANCH'];

const Counter = mongoose.models.ConsentCounter || mongoose.model(
  'ConsentCounter',
  new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } }, { collection: 'consent_counters', versionKey: false })
);

/** Next value of a numeric primary key sequence; atomic, so concurrent creates never collide. */
const nextId = async (name) => (await Counter.findByIdAndUpdate(name, { $inc: { seq: 1 } }, { new: true, upsert: true })).seq;

const ConsentCategory = mongoose.models.ConsentCategory || mongoose.model('ConsentCategory', new mongoose.Schema({
  categoryCode: { type: String, required: true, unique: true, maxlength: 30 },
  categoryName: { type: String, required: true, maxlength: 100 },
  description: { type: String, maxlength: 300 },
  isActive: YN,
}, opts('consent_categories')));

const ConsentMaster = mongoose.models.ConsentMaster || mongoose.model('ConsentMaster', new mongoose.Schema({
  consentId: { type: Number, required: true, unique: true },
  consentCode: { type: String, required: true, unique: true, maxlength: 50 },
  consentName: { type: String, required: true, maxlength: 200 },
  description: { type: String, maxlength: 500 },
  consentCategory: { type: String, required: true, maxlength: 50 },
  purpose: { type: String, maxlength: 500 },
  isMandatory: YN,
  applicability: { type: String, maxlength: 200 },
  isActive: YN,
  createdBy: { type: String, required: true, maxlength: 50 },
  updatedBy: { type: String, maxlength: 50 },
}, opts('consent_masters')));

const ConsentScope = mongoose.models.ConsentScope || mongoose.model('ConsentScope', (() => {
  const s = new mongoose.Schema({
    consentScopeId: { type: Number, required: true, unique: true },
    consentId: { type: Number, required: true, index: true },
    scopeType: { type: String, required: true, maxlength: 50 },
    scopeCode: { type: String, required: true, maxlength: 50 },
    scopeName: { type: String, required: true, maxlength: 200 },
    description: { type: String, maxlength: 1000 },
    scopeVersion: { type: String, required: true, maxlength: 20 },
    status: { type: String, enum: SCOPE_STATUSES, required: true },
    effectiveFrom: { type: Date, required: true },
    effectiveTo: { type: Date, default: null },
    isActive: YN,
  }, opts('consent_scopes', 'createdDate', false));
  // A consent type can hold several scopes (scopeCode), and different scopes may share a version number.
  // A version number is unique only within one scope.
  s.index({ consentId: 1, scopeCode: 1, scopeVersion: 1 }, { unique: true });
  return s;
})());

// Drops the old (consentId, scopeVersion) unique index and builds the one above on existing databases.
ConsentScope.syncIndexes().catch((e) => console.error('ConsentScope index sync failed:', e.message));

const customerConsentSchema = new mongoose.Schema({
  customerConsentId: { type: Number, required: true, unique: true },
  customerId: { type: String, required: true, maxlength: 24, index: true },
  consentScopeId: { type: Number, required: true, index: true },
  consentStatus: { type: String, enum: CONSENT_STATUSES, required: true },
  channel: { type: String, enum: CHANNELS, required: true },
  source: { type: String, required: true, maxlength: 50 },
  consentDateTime: { type: Date, default: null },
  withdrawalDateTime: { type: Date, default: null },
  capturedBy: { type: String, required: true, maxlength: 50 },
}, opts('customer_consents'));

// The dates the PDF's sample data implies for each status.
const badInput = (message) => Object.assign(new Error(message), { status: 400 });
customerConsentSchema.pre('validate', function checkDates(next) {
  const { consentStatus: s, consentDateTime: c, withdrawalDateTime: w } = this;
  if (s === 'NOT_RESPONDED' && (c || w)) return next(badInput('A consent that has not been responded to cannot have a consent or withdrawal date'));
  if (s !== 'NOT_RESPONDED' && !c) return next(badInput('consentDateTime is required once the customer has responded'));
  if (s === 'WITHDRAWN' && !w) return next(badInput('withdrawalDateTime is required for a withdrawn consent'));
  if (s !== 'WITHDRAWN' && w) return next(badInput('Only a withdrawn consent can have a withdrawalDateTime'));
  if (w && c && w < c) return next(badInput('withdrawalDateTime cannot be before consentDateTime'));
  return next();
});

const CustomerConsent = mongoose.models.CustomerConsent || mongoose.model('CustomerConsent', customerConsentSchema);

module.exports = { ConsentCategory, ConsentMaster, ConsentScope, CustomerConsent, Counter, nextId, CONSENT_STATUSES, SCOPE_STATUSES, CHANNELS };
