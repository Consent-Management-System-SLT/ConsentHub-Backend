const express = require('express');
const { ConsentCategory, ConsentMaster, ConsentScope, CustomerConsent, nextId, SCOPE_STATUSES } = require('../models/ConsentDataModel');

/**
 * Admin management of the PDF's CONSENT_CATEGORY, CONSENT_MASTER and CONSENT_SCOPE tables.
 * Mounted behind verifyToken + requireRole(['admin']). Nothing is deleted: a category or consent
 * type is switched off with isActive, a version is retired with its status, so customer consents
 * that point at them keep resolving.
 */
const router = express.Router();

const bad = (message) => Object.assign(new Error(message), { status: 400 });
const clean = (v) => (typeof v === 'string' ? v.trim() : v);
const pick = (body, keys) => Object.fromEntries(keys.filter((k) => body[k] !== undefined).map((k) => [k, clean(body[k])]));
const who = (req) => String(req.user.email || req.user.id).slice(0, 50);

const send = (res, error, action) => {
  if (error.status === 400 || error.name === 'ValidationError') return res.status(400).json({ error: true, message: error.message });
  if (error.code === 11000) return res.status(400).json({ error: true, message: `That ${Object.keys(error.keyPattern || {}).join(' + ') || 'value'} already exists` });
  console.error(`Consent catalog: could not ${action}:`, error);
  return res.status(500).json({ error: true, message: `Could not ${action}` });
};

const CATEGORY_FIELDS = ['categoryName', 'description', 'isActive'];
const MASTER_FIELDS = ['consentName', 'description', 'consentCategory', 'purpose', 'isMandatory', 'applicability', 'isActive'];
const SCOPE_FIELDS = ['scopeType', 'scopeCode', 'scopeName', 'scopeVersion', 'status', 'effectiveFrom', 'effectiveTo'];

router.get('/', async (req, res) => {
  try {
    const [categories, masters, scopes, inUse] = await Promise.all([
      ConsentCategory.find().sort({ categoryCode: 1 }).lean(),
      ConsentMaster.find().sort({ consentId: 1 }).lean(),
      ConsentScope.find().sort({ consentId: 1, scopeVersion: 1 }).lean(),
      CustomerConsent.aggregate([{ $group: { _id: '$consentScopeId', customers: { $sum: 1 } } }]),
    ]);
    const used = new Map(inUse.map((u) => [u._id, u.customers]));
    res.json({ categories, masters, scopes: scopes.map((s) => ({ ...s, customerConsents: used.get(s.consentScopeId) || 0 })) });
  } catch (error) {
    send(res, error, 'load the consent catalog');
  }
});

// ---- categories ----
router.post('/categories', async (req, res) => {
  try {
    const categoryCode = String(clean(req.body.categoryCode) || '').toUpperCase().replace(/\s+/g, '_');
    if (!/^[A-Z][A-Z0-9_]*$/.test(categoryCode)) throw bad('categoryCode is required: capital letters, digits and underscores');
    res.status(201).json(await ConsentCategory.create({ isActive: 'Y', ...pick(req.body, CATEGORY_FIELDS), categoryCode }));
  } catch (error) {
    send(res, error, 'create the category');
  }
});

router.put('/categories/:categoryCode', async (req, res) => {
  try {
    const category = await ConsentCategory.findOne({ categoryCode: req.params.categoryCode });
    if (!category) return res.status(404).json({ error: true, message: 'Category not found' });
    category.set(pick(req.body, CATEGORY_FIELDS));
    res.json(await category.save());
  } catch (error) {
    send(res, error, 'update the category');
  }
});

// ---- consent types (CONSENT_MASTER) ----
const requireCategory = async (code) => {
  if (!(await ConsentCategory.exists({ categoryCode: code }))) throw bad(`Unknown category ${code}`);
};

router.post('/masters', async (req, res) => {
  try {
    const consentCode = String(clean(req.body.consentCode) || '').toUpperCase().replace(/\s+/g, '_');
    if (!/^[A-Z][A-Z0-9_]*$/.test(consentCode)) throw bad('consentCode is required: capital letters, digits and underscores');
    await requireCategory(clean(req.body.consentCategory));
    const master = await ConsentMaster.create({
      isActive: 'Y', isMandatory: 'N', ...pick(req.body, MASTER_FIELDS), consentCode,
      consentId: await nextId('consentId'), createdBy: who(req),
    });
    res.status(201).json(master);
  } catch (error) {
    send(res, error, 'create the consent type');
  }
});

// consentCode never changes: the rest of the system identifies a consent type by it.
router.put('/masters/:consentId', async (req, res) => {
  try {
    const master = await ConsentMaster.findOne({ consentId: Number(req.params.consentId) });
    if (!master) return res.status(404).json({ error: true, message: 'Consent type not found' });
    if (req.body.consentCategory !== undefined) await requireCategory(clean(req.body.consentCategory));
    master.set({ ...pick(req.body, MASTER_FIELDS), updatedBy: who(req) });
    res.json(await master.save());
  } catch (error) {
    send(res, error, 'update the consent type');
  }
});

// ---- versions (CONSENT_SCOPE) ----
const scopeValues = (body) => {
  const values = pick(body, SCOPE_FIELDS);
  for (const k of ['effectiveFrom', 'effectiveTo']) {
    if (values[k] === '' || values[k] === null) values[k] = null;
    else if (values[k] !== undefined) {
      values[k] = new Date(values[k]);
      if (Number.isNaN(values[k].getTime())) throw bad(`${k} is not a valid date`);
    }
  }
  return values;
};

// Customers are recorded against the ACTIVE version, so a consent type can only have one.
async function checkScope(scope) {
  if (!SCOPE_STATUSES.includes(scope.status)) throw bad(`status must be one of: ${SCOPE_STATUSES.join(', ')}`);
  if (!scope.effectiveFrom) throw bad('effectiveFrom is required');
  if (scope.effectiveTo && scope.effectiveTo < scope.effectiveFrom) throw bad('effectiveTo cannot be before effectiveFrom');
  if (!Number.isInteger(scope.consentId) || !(await ConsentMaster.exists({ consentId: scope.consentId }))) throw bad('Unknown consent type');
  if (scope.status === 'ACTIVE') {
    const other = await ConsentScope.findOne({ consentId: scope.consentId, status: 'ACTIVE', consentScopeId: { $ne: scope.consentScopeId } }).lean();
    if (other) throw bad(`Version ${other.scopeVersion} is already active for this consent type; retire it first`);
  }
  scope.isActive = scope.status === 'ACTIVE' ? 'Y' : 'N';
}

router.post('/scopes', async (req, res) => {
  try {
    const scope = new ConsentScope({
      status: 'DRAFT', ...scopeValues(req.body),
      consentId: Number(req.body.consentId), consentScopeId: await nextId('consentScopeId'),
    });
    await checkScope(scope);
    res.status(201).json(await scope.save());
  } catch (error) {
    send(res, error, 'create the version');
  }
});

router.put('/scopes/:consentScopeId', async (req, res) => {
  try {
    const scope = await ConsentScope.findOne({ consentScopeId: Number(req.params.consentScopeId) });
    if (!scope) return res.status(404).json({ error: true, message: 'Version not found' });
    scope.set(scopeValues(req.body));
    await checkScope(scope);
    res.json(await scope.save());
  } catch (error) {
    send(res, error, 'update the version');
  }
});

module.exports = router;
