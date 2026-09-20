// Rebuilds the four consent tables from SLT_Consent_Management_Data_Model.pdf and fills them with
// the PDF's sample rows plus generated data for every customer.
//
//   node scripts/seedConsentDataModel.js --yes
//
// DROPS consent_categories, consent_masters, consent_scopes, customer_consents and consent_counters.
// A JSON backup of every consent collection is written to db-backup/ first. The older `consents`
// collection (partner and guardian consents) is not touched.
require('dotenv').config();
const mongoose = require('mongoose');
const { backup } = require('./backupConsentData');

if (!process.argv.includes('--yes')) {
  console.error('This drops and rebuilds the consent tables. Re-run with --yes to continue.');
  process.exit(1);
}

// Sri Lanka time, as in the PDF's samples.
const at = (text) => new Date(`${text.replace(' ', 'T')}${text.includes(' ') ? ':00' : 'T00:00:00'}+05:30`);
const YEARS_AGO = (n) => new Date(Date.now() - n * 365 * 864e5);

const CATEGORIES = [
  ['SERVICE', 'Service', 'Terms & Conditions, Service Agreement'],
  ['PRIVACY', 'Privacy & Data', 'Privacy Policy, Personal Data Processing'],
  ['COMMUNICATION', 'Service Communication', 'SMS notifications, billing alerts, outage notifications'],
  ['MARKETING', 'Marketing', 'Promotional SMS, email campaigns, special offers'],
  ['PERSONALIZATION', 'Personalization', 'Personalized offers, recommendations'],
  ['THIRD_PARTY', 'Third Party', 'Partner offers, third-party communications'],
  ['FEEDBACK', 'Feedback & Research', 'Customer surveys, service feedback'],
  ['LEGAL', 'Legal & Regulatory', 'Regulatory declarations, legal acknowledgements'],
].map(([categoryCode, categoryName, description]) => ({
  categoryCode, categoryName, description, isActive: 'Y',
  createdDate: at('2025-01-01 09:00'), updatedDate: categoryCode === 'MARKETING' ? at('2026-07-01 10:00') : at('2025-01-01 09:00'),
}));

const MASTERS = [
  [1, 'TERMS_AND_CONDITIONS', 'Terms & Conditions', "Acceptance of SLT's general terms of service", 'SERVICE', 'Legal basis for service provisioning', 'Y'],
  [2, 'PRIVACY_POLICY', 'Privacy Policy', 'Acknowledgement of how SLT collects and uses personal data', 'PRIVACY', 'Lawful processing of personal data', 'Y'],
  [3, 'SERVICE_COMMUNICATION', 'Service Communications', 'Billing alerts, outage and service notifications', 'COMMUNICATION', 'Keeping the customer informed about their service', 'Y'],
  [4, 'MARKETING', 'Marketing Communications', 'Promotional SMS, email and special offers from SLT', 'MARKETING', 'Direct marketing of SLT products', 'N'],
  [5, 'PERSONALIZED_OFFERS', 'Personalized Offers', 'Offers and recommendations based on usage', 'PERSONALIZATION', 'Personalisation of offers', 'N'],
  [6, 'PARTNER_OFFERS', 'Partner Offers', 'Offers from SLT partners and third parties', 'THIRD_PARTY', 'Sharing contact details with partners for offers', 'N'],
  [7, 'CUSTOMER_FEEDBACK', 'Customer Feedback', 'Customer surveys and service feedback requests', 'FEEDBACK', 'Improving service quality', 'N'],
].map(([consentId, consentCode, consentName, description, consentCategory, purpose, isMandatory]) => ({
  consentId, consentCode, consentName, description, consentCategory, purpose, isMandatory,
  applicability: 'All active customers', isActive: 'Y', createdBy: 'ADMIN', createdDate: at('2025-01-01 09:00'),
  updatedBy: consentId === 4 ? 'ADMIN' : undefined, updatedDate: consentId === 4 ? at('2026-07-01 10:00') : undefined,
}));

const SCOPES = [
  [101, 4, 'MKT_COMMS', 'Marketing Communications', 'V1', 'RETIRED', '2025-01-01', '2026-06-30', '2024-12-15 10:00'],
  [102, 4, 'MKT_COMMS', 'Marketing Communications', 'V2', 'ACTIVE', '2026-07-01', null, '2026-06-15 11:00'],
  [103, 4, 'MKT_COMMS', 'Marketing Communications', 'V3', 'PLANNED', '2026-12-01', null, '2026-09-01 09:30'],
  [201, 1, 'TNC_001', 'Terms & Conditions', '2.1', 'ACTIVE', '2026-01-01', null, '2025-12-10 14:00'],
  [301, 2, 'PRIV_001', 'Privacy Policy', '1.4', 'ACTIVE', '2025-09-01', null, '2025-08-20 09:00'],
  [401, 3, 'SVC_COMM_001', 'Service Communications', '1.0', 'ACTIVE', '2025-01-01', null, '2024-12-15 10:00'],
  [501, 5, 'PERS_OFFERS_001', 'Personalized Offers', '1.0', 'ACTIVE', '2025-03-01', null, '2025-02-15 10:00'],
  [601, 6, 'PARTNER_001', 'Partner Offers', '1.1', 'APPROVED', '2026-11-01', null, '2026-08-25 16:00'],
  [701, 7, 'FEEDBACK_001', 'Customer Feedback', '1.0', 'ACTIVE', '2025-01-01', null, '2024-12-15 10:00'],
].map(([consentScopeId, consentId, scopeCode, scopeName, scopeVersion, status, from, to, created]) => ({
  consentScopeId, consentId, scopeType: 'DOCUMENT', scopeCode, scopeName, scopeVersion, status,
  effectiveFrom: at(from), effectiveTo: to ? at(to) : null, isActive: status === 'ACTIVE' ? 'Y' : 'N', createdDate: at(created),
}));

// The PDF's 12 sample rows. The customer ids there (CUST12345 ...) are CRM ids that do not exist here,
// so each is mapped onto a real customer below.
const PDF_ROWS = [
  ['CUST12345', 201, 'GRANTED', 'WEB', 'ONBOARDING_PORTAL', '2026-09-15 10:30', null, 'SYSTEM'],
  ['CUST12345', 301, 'GRANTED', 'WEB', 'ONBOARDING_PORTAL', '2026-09-15 10:30', null, 'SYSTEM'],
  ['CUST12345', 102, 'GRANTED', 'WEB', 'ONBOARDING_PORTAL', '2026-09-15 10:31', null, 'SYSTEM'],
  ['CUST12345', 601, 'DENIED', 'WEB', 'ONBOARDING_PORTAL', '2026-09-15 10:31', null, 'SYSTEM'],
  ['CUST67890', 201, 'GRANTED', 'MOBILE_APP', 'SELF_CARE_APP', '2026-08-02 08:15', null, 'SYSTEM'],
  ['CUST67890', 102, 'WITHDRAWN', 'MOBILE_APP', 'SELF_CARE_APP', '2026-08-02 08:16', '2026-09-10 19:42', 'SYSTEM'],
  ['CUST67890', 501, 'NOT_RESPONDED', 'MOBILE_APP', 'SELF_CARE_APP', null, null, 'SYSTEM'],
  ['CUST54321', 401, 'GRANTED', 'CALL_CENTER', 'IVR_SYSTEM', '2026-05-20 13:05', null, 'AGENT_R.PERERA'],
  ['CUST54321', 102, 'DENIED', 'CALL_CENTER', 'IVR_SYSTEM', '2026-05-20 13:06', null, 'AGENT_R.PERERA'],
  ['CUST54321', 701, 'GRANTED', 'SMS', 'SURVEY_CAMPAIGN', '2026-06-11 09:22', null, 'SYSTEM'],
  ['CUST98765', 201, 'GRANTED', 'WEB', 'ONBOARDING_PORTAL', '2026-09-01 16:40', null, 'SYSTEM'],
  ['CUST98765', 102, 'GRANTED', 'WEB', 'ONBOARDING_PORTAL', '2026-09-01 16:41', null, 'SYSTEM'],
];

const SOURCE_BY_CHANNEL = { WEB: 'ONBOARDING_PORTAL', MOBILE_APP: 'SELF_CARE_APP', SMS: 'SURVEY_CAMPAIGN', EMAIL: 'EMAIL_CAMPAIGN', IVR: 'IVR_SYSTEM', CALL_CENTER: 'IVR_SYSTEM', BRANCH: 'BRANCH_POS' };
const CHANNEL_WEIGHTS = [['WEB', 34], ['MOBILE_APP', 24], ['EMAIL', 14], ['SMS', 10], ['CALL_CENTER', 8], ['BRANCH', 6], ['IVR', 4]];
const AGENTS = ['AGENT_R.PERERA', 'AGENT_S.FERNANDO', 'AGENT_K.SILVA', 'AGENT_N.JAYASINGHE'];

// Deterministic, so re-running the seed produces the same data.
const rng = (() => { let s = 20260920; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; })();
const pick = (weighted) => { let r = rng() * weighted.reduce((t, [, w]) => t + w, 0); for (const [v, w] of weighted) { if ((r -= w) < 0) return v; } return weighted[0][0]; };

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  console.log('Backing up first...');
  await backup();

  console.log('Rebuilding tables...');
  for (const name of ['consent_categories', 'consent_masters', 'consent_scopes', 'customer_consents', 'consent_counters']) {
    await db.collection(name).drop().catch((e) => { if (e.codeName !== 'NamespaceNotFound') throw e; });
  }
  // Loaded only now: registering the models starts building their indexes, which must not race the drops above.
  const { ConsentCategory, ConsentMaster, ConsentScope, CustomerConsent, Counter } = require('../models/ConsentDataModel');
  await Promise.all([ConsentCategory, ConsentMaster, ConsentScope, CustomerConsent].map((m) => m.init()));
  await ConsentCategory.insertMany(CATEGORIES, { timestamps: false });
  await ConsentMaster.insertMany(MASTERS, { timestamps: false });
  await ConsentScope.insertMany(SCOPES, { timestamps: false });

  // Customers to give consents to: every customer account, plus whoever the EasyApply demo number resolves to.
  const users = await db.collection('users').find({
    $or: [{ role: 'customer' }, { phone: /775878565$/ }],
  }).project({ _id: 1, phone: 1, email: 1, createdAt: 1 }).sort({ createdAt: 1 }).toArray();
  const demo = users.find((u) => /775878565$/.test(u.phone || ''));
  const ordered = demo ? [demo, ...users.filter((u) => String(u._id) !== String(demo._id))] : users;
  const crmIds = ['CUST12345', 'CUST67890', 'CUST54321', 'CUST98765'];
  const crmToUser = Object.fromEntries(crmIds.map((id, i) => [id, ordered[i] && String(ordered[i]._id)]).filter(([, u]) => u));

  const scopeById = new Map(SCOPES.map((s) => [s.consentScopeId, s]));
  const rows = [];
  const have = new Set(); // customerId|consentId, so generated rows never duplicate a PDF row
  const add = (customerId, scopeId, consentStatus, channel, source, consentDateTime, withdrawalDateTime, capturedBy) => {
    const c = consentDateTime && (consentDateTime instanceof Date ? consentDateTime : at(consentDateTime));
    const w = withdrawalDateTime && (withdrawalDateTime instanceof Date ? withdrawalDateTime : at(withdrawalDateTime));
    have.add(`${customerId}|${scopeById.get(scopeId).consentId}`);
    rows.push({
      customerConsentId: 100001 + rows.length, customerId, consentScopeId: scopeId, consentStatus, channel, source,
      consentDateTime: c || null, withdrawalDateTime: w || null, capturedBy,
      createdDate: c || YEARS_AGO(0.3 + rng() * 0.6), updatedDate: w || c || YEARS_AGO(0.2),
    });
  };

  for (const [crm, scopeId, status, channel, source, consentAt, withdrawnAt, by] of PDF_ROWS) {
    if (crmToUser[crm]) add(crmToUser[crm], scopeId, status, channel, source, consentAt, withdrawnAt, by);
  }

  const activeScopeFor = (consentId) => SCOPES.filter((s) => s.consentId === consentId).sort((a, b) => (b.status === 'ACTIVE') - (a.status === 'ACTIVE') || b.effectiveFrom - a.effectiveFrom)[0];
  for (const user of ordered) {
    const customerId = String(user._id);
    for (const master of MASTERS) {
      if (have.has(`${customerId}|${master.consentId}`)) continue;
      const scope = activeScopeFor(master.consentId);
      const channel = pick(CHANNEL_WEIGHTS);
      const status = master.isMandatory === 'Y' ? 'GRANTED' : pick([['GRANTED', 45], ['DENIED', 15], ['WITHDRAWN', 15], ['NOT_RESPONDED', 25]]);
      const by = channel === 'CALL_CENTER' || channel === 'BRANCH' ? AGENTS[Math.floor(rng() * AGENTS.length)] : 'SYSTEM';
      const start = new Date(Math.max(YEARS_AGO(1).getTime(), user.createdAt ? new Date(user.createdAt).getTime() : 0));
      const consentAt = new Date(start.getTime() + rng() * (Date.now() - 3 * 864e5 - start.getTime()));
      const withdrawnAt = new Date(Math.min(Date.now() - 3600e3, consentAt.getTime() + (1 + rng() * 120) * 864e5));
      add(customerId, scope.consentScopeId, status, channel, SOURCE_BY_CHANNEL[channel], status === 'NOT_RESPONDED' ? null : consentAt, status === 'WITHDRAWN' ? withdrawnAt : null, by);
    }
  }

  await CustomerConsent.insertMany(rows, { timestamps: false });
  await Counter.insertMany([
    { _id: 'consentId', seq: Math.max(...MASTERS.map((m) => m.consentId)) },
    { _id: 'consentScopeId', seq: Math.max(...SCOPES.map((s) => s.consentScopeId)) },
    { _id: 'customerConsentId', seq: Math.max(...rows.map((r) => r.customerConsentId)) },
  ]);

  const tally = (f) => rows.reduce((m, r) => ((m[r[f]] = (m[r[f]] || 0) + 1), m), {});
  console.log(`\nconsent_categories: ${CATEGORIES.length}\nconsent_masters: ${MASTERS.length}\nconsent_scopes: ${SCOPES.length}\ncustomer_consents: ${rows.length} across ${ordered.length} customers`);
  console.log('by status', tally('consentStatus'));
  console.log('by channel', tally('channel'));
  console.log('PDF sample customers mapped to:', crmToUser);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
