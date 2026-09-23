const { ConsentCategory, ConsentMaster, ConsentScope, CustomerConsent, nextId, CHANNELS } = require('../models/ConsentDataModel');

/**
 * Customer consents, stored in the PDF's tables (customer_consents -> consent_scopes ->
 * consent_masters -> consent_categories).
 *
 * Every consent screen and endpoint goes through here. Reads return the PDF columns plus the older
 * field names (id, partyId, purpose, status, ...) so screens written before the PDF keep working.
 */

class ConsentInputError extends Error {
  constructor(message) { super(message); this.status = 400; }
}

// Old vocabulary <-> the PDF's.
const STATUS_TO_LEGACY = { GRANTED: 'granted', DENIED: 'declined', WITHDRAWN: 'revoked', NOT_RESPONDED: 'pending' };
const STATUS_FROM_LEGACY = { granted: 'GRANTED', active: 'GRANTED', declined: 'DENIED', denied: 'DENIED', revoked: 'WITHDRAWN', withdrawn: 'WITHDRAWN', pending: 'NOT_RESPONDED' };
// Purposes used before the PDF that have a clear home among its consent types.
const PURPOSE_ALIASES = { dataProcessing: 'PRIVACY_POLICY', personalization: 'PERSONALIZED_OFFERS', thirdPartySharing: 'PARTNER_OFFERS', research: 'CUSTOMER_FEEDBACK' };

/** TERMS_AND_CONDITIONS -> termsAndConditions: the key the screens use for a consent type. */
const purposeKey = (consentCode) =>
  consentCode.toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase());

const canCollectConsent = (scope, now = new Date()) =>
  scope?.status === 'ACTIVE' && scope.isActive === 'Y' && scope.effectiveFrom <= now &&
  (!scope.effectiveTo || scope.effectiveTo >= now);

const toPdfStatus = (value) => {
  const v = String(value ?? '');
  return STATUS_FROM_LEGACY[v.toLowerCase()] || (STATUS_TO_LEGACY[v.toUpperCase()] ? v.toUpperCase() : undefined);
};
const toPdfChannel = (value) => {
  if (value === undefined) return undefined;
  const channel = String(value).toUpperCase();
  if (!CHANNELS.includes(channel)) throw new ConsentInputError(`channel must be one of: ${CHANNELS.join(', ')}`);
  return channel;
};

async function loadCatalog() {
  const [scopes, masters, categories] = await Promise.all([ConsentScope.find().lean(), ConsentMaster.find().lean(), ConsentCategory.find().lean()]);
  return {
    scopes: new Map(scopes.map((s) => [s.consentScopeId, s])),
    masters: new Map(masters.map((m) => [m.consentId, m])),
    categories: new Map(categories.map((c) => [c.categoryCode, c])),
  };
}

const describeScope = (scope, catalog) => {
  const master = catalog.masters.get(scope.consentId) || {};
  return {
    consentScopeId: scope.consentScopeId,
    consentId: scope.consentId,
    consentCode: master.consentCode,
    consentName: master.consentName,
    description: master.description,
    consentCategory: master.consentCategory,
    categoryName: catalog.categories.get(master.consentCategory)?.categoryName,
    isMandatory: master.isMandatory,
    purpose: master.consentCode ? purposeKey(master.consentCode) : undefined,
    scopeType: scope.scopeType,
    scopeCode: scope.scopeCode,
    scopeName: scope.scopeName,
    scopeDescription: scope.description || `Consent wording and terms for ${scope.scopeName}.`,
    scopeVersion: scope.scopeVersion,
    status: scope.status,
    effectiveFrom: scope.effectiveFrom,
    effectiveTo: scope.effectiveTo,
  };
};

/** The consent types and versions an admin can record a decision against. */
async function listScopes({ activeOnly = true } = {}) {
  const catalog = await loadCatalog();
  return [...catalog.scopes.values()]
    .filter((s) => !activeOnly || (canCollectConsent(s) && catalog.masters.get(s.consentId)?.isActive === 'Y'))
    .map((s) => describeScope(s, catalog))
    .sort((a, b) => a.consentId - b.consentId || a.scopeVersion.localeCompare(b.scopeVersion));
}

/** One customer consent as the API returns it: PDF columns, scope details, and the older names. */
function toApi(cc, catalog) {
  const scope = catalog.scopes.get(cc.consentScopeId);
  const detail = scope ? describeScope(scope, catalog) : {};
  const id = String(cc.customerConsentId);
  const granted = cc.consentStatus === 'GRANTED' || cc.consentStatus === 'WITHDRAWN';
  return {
    customerConsentId: cc.customerConsentId,
    customerId: cc.customerId,
    consentScopeId: cc.consentScopeId,
    consentStatus: cc.consentStatus,
    channel: cc.channel.toLowerCase(),
    source: cc.source,
    consentDateTime: cc.consentDateTime,
    withdrawalDateTime: cc.withdrawalDateTime,
    capturedBy: cc.capturedBy,
    createdDate: cc.createdDate,
    updatedDate: cc.updatedDate,
    consentCode: detail.consentCode,
    consentName: detail.consentName,
    consentCategory: detail.consentCategory,
    categoryName: detail.categoryName,
    isMandatory: detail.isMandatory,
    scopeCode: detail.scopeCode,
    scopeName: detail.scopeName,
    scopeVersion: detail.scopeVersion,
    scopeStatus: detail.status,
    // Older names, so screens written before the PDF keep working.
    id,
    _id: id,
    partyId: cc.customerId,
    purpose: detail.purpose,
    type: detail.purpose,
    consentType: detail.purpose,
    description: detail.description,
    status: STATUS_TO_LEGACY[cc.consentStatus],
    recordSource: cc.source,
    grantedAt: granted ? cc.consentDateTime : null,
    revokedAt: cc.consentStatus === 'WITHDRAWN' ? cc.withdrawalDateTime : null,
    deniedAt: cc.consentStatus === 'DENIED' ? cc.consentDateTime : null,
    timestampGranted: granted ? cc.consentDateTime : null,
    timestampRevoked: cc.consentStatus === 'WITHDRAWN' ? cc.withdrawalDateTime : null,
    validFrom: cc.consentDateTime || cc.createdDate,
    validTo: detail.effectiveTo || null,
    expiresAt: detail.effectiveTo || null,
    versionAccepted: detail.scopeVersion,
    privacyNoticeId: detail.scopeCode,
    geoLocation: 'Sri Lanka',
    createdAt: cc.createdDate,
    updatedAt: cc.updatedDate,
  };
}

async function find(filter = {}, { sort = { createdDate: -1 }, skip = 0, limit = 0 } = {}) {
  const [rows, catalog] = await Promise.all([CustomerConsent.find(filter).sort(sort).skip(skip).limit(limit).lean(), loadCatalog()]);
  return rows.map((r) => toApi(r, catalog));
}

const findForCustomer = (customerId) => find({ customerId: String(customerId) });
const count = (filter = {}) => CustomerConsent.countDocuments(filter);

async function findOne(customerConsentId, customerId) {
  const filter = { customerConsentId: Number(customerConsentId) };
  if (customerId) filter.customerId = String(customerId);
  if (!Number.isInteger(filter.customerConsentId)) return null;
  return (await find(filter))[0] || null;
}

/** Turns what a caller passed (a scope id, or an older purpose key such as "marketing") into a scope. */
async function resolveScope({ consentScopeId, purpose }) {
  const catalog = await loadCatalog();
  if (consentScopeId !== undefined && consentScopeId !== null && consentScopeId !== '') {
    const scope = catalog.scopes.get(Number(consentScopeId));
    if (!scope) throw new ConsentInputError(`Unknown consent scope ${consentScopeId}`);
    if (!canCollectConsent(scope)) throw new ConsentInputError(`Consent scope ${consentScopeId} is not currently active`);
    if (catalog.masters.get(scope.consentId)?.isActive !== 'Y') throw new ConsentInputError(`Consent type for scope ${consentScopeId} is not active`);
    return scope;
  }
  if (!purpose) throw new ConsentInputError('consentScopeId is required');
  const wanted = PURPOSE_ALIASES[purpose] || null;
  const master = [...catalog.masters.values()].find((m) => (wanted ? m.consentCode === wanted : purposeKey(m.consentCode) === purpose));
  if (!master) throw new ConsentInputError(`"${purpose}" is not one of the consent types: ${[...catalog.masters.values()].map((m) => purposeKey(m.consentCode)).join(', ')}`);
  if (master.isActive !== 'Y') throw new ConsentInputError(`Consent type ${master.consentCode} is not active`);
  const now = new Date();
  const scope = [...catalog.scopes.values()]
    .filter((s) => s.consentId === master.consentId && canCollectConsent(s, now))
    .sort((a, b) => b.effectiveFrom - a.effectiveFrom)[0];
  if (!scope) throw new ConsentInputError(`No active version of ${master.consentName}`);
  return scope;
}

/** Applies what the PDF says a status implies about the dates. */
function settleDates(cc, { consentDateTime, withdrawalDateTime }, now = new Date()) {
  const asDate = (v, field) => {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) throw new ConsentInputError(`${field} is not a valid date`);
    return d;
  };
  if (consentDateTime) cc.consentDateTime = asDate(consentDateTime, 'consentDateTime');
  if (withdrawalDateTime) cc.withdrawalDateTime = asDate(withdrawalDateTime, 'withdrawalDateTime');
  if (cc.consentStatus === 'NOT_RESPONDED') {
    cc.consentDateTime = null;
    cc.withdrawalDateTime = null;
    return;
  }
  // A never-answered consent that is withdrawn straight away is dated by the withdrawal.
  if (!cc.consentDateTime) cc.consentDateTime = (cc.consentStatus === 'WITHDRAWN' && cc.withdrawalDateTime) || now;
  if (cc.consentStatus === 'WITHDRAWN') {
    if (!cc.withdrawalDateTime) cc.withdrawalDateTime = now;
  } else {
    cc.withdrawalDateTime = null;
  }
}

const saveOrExplain = async (doc) => {
  try {
    await doc.save();
  } catch (err) {
    if (err.name === 'ValidationError' || err.status === 400) throw new ConsentInputError(err.message);
    throw err;
  }
};

/**
 * input: customerId, (consentScopeId | purpose), (consentStatus | status), channel, source, capturedBy,
 * consentDateTime, withdrawalDateTime.
 */
async function create(input) {
  if (!input.customerId) throw new ConsentInputError('customerId is required');
  const consentStatus = toPdfStatus(input.consentStatus ?? input.status);
  if (!consentStatus) throw new ConsentInputError('status must be one of: GRANTED, DENIED, WITHDRAWN, NOT_RESPONDED');
  const scope = await resolveScope(input);
  const cc = new CustomerConsent({
    customerConsentId: await nextId('customerConsentId'),
    customerId: String(input.customerId),
    consentScopeId: scope.consentScopeId,
    consentStatus,
    channel: toPdfChannel(input.channel) || 'WEB',
    source: input.source || 'ADMIN_DASHBOARD',
    capturedBy: input.capturedBy || 'SYSTEM',
  });
  settleDates(cc, input);
  await saveOrExplain(cc);
  return findOne(cc.customerConsentId);
}

/**
 * The same decision for many customers. A customer who already has a record for the version is left
 * alone (their own decision is never overwritten), and is counted in `skipped`.
 */
async function createForCustomers(customerIds, input) {
  if (!toPdfStatus(input.consentStatus ?? input.status)) throw new ConsentInputError('status must be one of: GRANTED, DENIED, WITHDRAWN, NOT_RESPONDED');
  toPdfChannel(input.channel);
  const scope = await resolveScope(input);
  const have = new Set((await CustomerConsent.find({ consentScopeId: scope.consentScopeId, customerId: { $in: customerIds } }).select('customerId').lean()).map((c) => c.customerId));
  const todo = customerIds.filter((id) => !have.has(id));
  // ponytail: one at a time so each row gets its own id; batch the inserts if this ever runs over tens of thousands of customers
  for (const customerId of todo) await create({ ...input, customerId, consentScopeId: scope.consentScopeId });
  return { created: todo.length, skipped: customerIds.length - todo.length, total: customerIds.length };
}

/** patch: any of consentScopeId/purpose, consentStatus/status, channel, source, capturedBy, consentDateTime, withdrawalDateTime. */
async function update(customerConsentId, patch, { customerId } = {}) {
  const filter = { customerConsentId: Number(customerConsentId) };
  if (customerId) filter.customerId = String(customerId);
  const cc = Number.isInteger(filter.customerConsentId) ? await CustomerConsent.findOne(filter) : null;
  if (!cc) return null;

  if (patch.consentScopeId !== undefined || patch.purpose !== undefined) {
    cc.consentScopeId = (await resolveScope(patch)).consentScopeId;
  }
  if (patch.consentStatus !== undefined || patch.status !== undefined) {
    const status = toPdfStatus(patch.consentStatus ?? patch.status);
    if (!status) throw new ConsentInputError('status must be one of: GRANTED, DENIED, WITHDRAWN, NOT_RESPONDED');
    cc.consentStatus = status;
  }
  if (patch.channel !== undefined) cc.channel = toPdfChannel(patch.channel);
  if (patch.source !== undefined) cc.source = patch.source;
  if (patch.capturedBy !== undefined) cc.capturedBy = patch.capturedBy;
  settleDates(cc, patch);
  await saveOrExplain(cc);
  return findOne(cc.customerConsentId);
}

/** A customer's own decision from a portal: the decision is dated now and the record notes where it came from. */
const respond = (customerConsentId, customerId, status, { source = 'CUSTOMER_PORTAL', channel = 'web', capturedBy = 'SYSTEM' } = {}) =>
  update(customerConsentId, { status, source, channel, capturedBy, consentDateTime: status === 'GRANTED' || status === 'DENIED' ? new Date() : undefined, withdrawalDateTime: status === 'WITHDRAWN' ? new Date() : undefined }, { customerId });

/** New customers start with the mandatory consents granted and the optional ones awaiting a response. */
async function createDefaultsForCustomer(customerId, { source = 'REGISTRATION', capturedBy = 'SYSTEM' } = {}) {
  if ((await count({ customerId: String(customerId) })) > 0) return [];
  const catalog = await loadCatalog();
  const now = new Date();
  const created = [];
  for (const master of [...catalog.masters.values()].sort((a, b) => a.consentId - b.consentId)) {
    if (master.isActive !== 'Y') continue;
    const scope = [...catalog.scopes.values()].find((s) => s.consentId === master.consentId && s.status === 'ACTIVE' && s.effectiveFrom <= now);
    if (!scope) continue;
    created.push(await create({
      customerId,
      consentScopeId: scope.consentScopeId,
      consentStatus: master.isMandatory === 'Y' ? 'GRANTED' : 'NOT_RESPONDED',
      channel: 'web',
      source,
      capturedBy,
    }));
  }
  return created;
}

module.exports = {
  ConsentInputError, purposeKey, toPdfStatus, toPdfChannel, settleDates,
  listScopes, find, findForCustomer, findOne, count, create, createForCustomers, update, respond, createDefaultsForCustomer, resolveScope,
  STATUS_TO_LEGACY, STATUS_FROM_LEGACY,
};
