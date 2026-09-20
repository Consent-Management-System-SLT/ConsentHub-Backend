const store = require('../services/customerConsentStore');
const { CustomerConsent } = require('../models/ConsentDataModel');

const consent = (over) => new CustomerConsent({
  customerConsentId: 1, customerId: 'c1', consentScopeId: 102, channel: 'WEB', source: 'ONBOARDING_PORTAL', capturedBy: 'SYSTEM', ...over,
});
const day = (n) => new Date(Date.UTC(2026, 8, n));

describe('customer_consents column rules (from the PDF sample data)', () => {
  it('accepts a granted consent with a date and no withdrawal', async () => {
    await expect(consent({ consentStatus: 'GRANTED', consentDateTime: day(1) }).validate()).resolves.toBeUndefined();
  });
  it('requires a consent date once the customer has responded', async () => {
    await expect(consent({ consentStatus: 'DENIED' }).validate()).rejects.toThrow(/consentDateTime is required/);
  });
  it('keeps both dates empty while NOT_RESPONDED', async () => {
    await expect(consent({ consentStatus: 'NOT_RESPONDED' }).validate()).resolves.toBeUndefined();
    await expect(consent({ consentStatus: 'NOT_RESPONDED', consentDateTime: day(1) }).validate()).rejects.toThrow(/not been responded/);
  });
  it('needs a withdrawal date that is not before the consent date, and only for WITHDRAWN', async () => {
    await expect(consent({ consentStatus: 'WITHDRAWN', consentDateTime: day(2) }).validate()).rejects.toThrow(/withdrawalDateTime is required/);
    await expect(consent({ consentStatus: 'WITHDRAWN', consentDateTime: day(2), withdrawalDateTime: day(1) }).validate()).rejects.toThrow(/before consentDateTime/);
    await expect(consent({ consentStatus: 'GRANTED', consentDateTime: day(1), withdrawalDateTime: day(2) }).validate()).rejects.toThrow(/Only a withdrawn/);
    await expect(consent({ consentStatus: 'WITHDRAWN', consentDateTime: day(1), withdrawalDateTime: day(2) }).validate()).resolves.toBeUndefined();
  });
  it('only takes the PDF channels', async () => {
    await expect(consent({ consentStatus: 'GRANTED', consentDateTime: day(1), channel: 'PIGEON' }).validate()).rejects.toThrow(/channel/);
  });
});

describe('customerConsentStore vocabulary', () => {
  it('maps the older statuses onto the PDF and rejects ones the PDF does not have', () => {
    expect(store.toPdfStatus('granted')).toBe('GRANTED');
    expect(store.toPdfStatus('revoked')).toBe('WITHDRAWN');
    expect(store.toPdfStatus('declined')).toBe('DENIED');
    expect(store.toPdfStatus('pending')).toBe('NOT_RESPONDED');
    expect(store.toPdfStatus('NOT_RESPONDED')).toBe('NOT_RESPONDED');
    expect(store.toPdfStatus('expired')).toBeUndefined();
  });
  it('derives the screens\' purpose key from the consent code', () => {
    expect(store.purposeKey('TERMS_AND_CONDITIONS')).toBe('termsAndConditions');
    expect(store.purposeKey('MARKETING')).toBe('marketing');
  });
  it('settles the dates a status implies', () => {
    const now = day(20);
    const c = { consentStatus: 'WITHDRAWN', consentDateTime: null, withdrawalDateTime: null };
    store.settleDates(c, { withdrawalDateTime: day(10) }, now);
    expect(c.consentDateTime).toEqual(day(10)); // withdrawn straight from "not responded": dated by the withdrawal
    const granted = { consentStatus: 'GRANTED', consentDateTime: day(1), withdrawalDateTime: day(5) };
    store.settleDates(granted, {}, now);
    expect(granted.withdrawalDateTime).toBeNull(); // re-granting clears the old withdrawal
    const pending = { consentStatus: 'NOT_RESPONDED', consentDateTime: day(1), withdrawalDateTime: null };
    store.settleDates(pending, {}, now);
    expect(pending.consentDateTime).toBeNull();
  });
});
