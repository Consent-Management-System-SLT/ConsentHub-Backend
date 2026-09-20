# ConsentHub — Backend

Consent and privacy management API for SLT-Mobitel. Node.js, Express and MongoDB.

Serves the [ConsentHub frontend](../ConsentHub-Frontend): customer self-service,
CSR tooling, admin administration, and the enterprise partner-campaign flow.

## Running it

```bash
npm install
cp .env.example .env     # then fill in the values below
npm start                # http://localhost:3001
```

| Script | Does |
|---|---|
| `npm start` | Runs the API |
| `npm run dev` | Same, with nodemon reload |
| `npm test` | Jest suite |

### Environment

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Signing secret for access tokens |
| `PORT` | Defaults to 3001 |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Outbound email |
| `MESSAGING_PROVIDER` | `smtp` |
| `SMS_PROVIDER_ENABLED` | `false` — SMS campaigns fall back to email |

Point `MONGODB_URI` at a development database. It is not currently defaulted to
one, and local runs will otherwise read and write live customer data.

## Layout

```
comprehensive-backend.js   All 144 HTTP routes and the Socket.IO server
models/                    Mongoose schemas
routes/                    Enterprise and partner-consent routers (/api/v2)
services/                  Messaging providers and consent policy evaluation
utils/authMiddleware.js    verifyToken, requireRole, enterprise tenant guards
tests/, __tests__/         Jest suites
```

`comprehensive-backend.js` is a single 12,500-line file. Splitting it by domain
is the main outstanding refactor; until then, be aware that Express serves the
first matching route, so check for an existing registration before adding one.

## Authentication

Every route requires a bearer token except `/api/v1/health`,
`/api/v1/auth/login` and `/api/v1/auth/register`.

Authorisation is applied per route with `requireRole`:

| Scope | Roles | Covers |
|---|---|---|
| Admin only | `admin` | Users, preference administration, audit logs, compliance rules, webhooks, bulk import, privacy-notice authoring |
| Staff | `admin`, `csr` | Cross-customer consent, party, DSAR, guardian and TMF endpoints |
| Customer | `customer` | `/api/v1/customer/*`, own VAS, own profile, submitting a DSAR, acknowledging a notice |

A customer can only reach their own data plus shared reference content — privacy
notices and the preference category and topic lists.

## API groups

| Prefix | Area |
|---|---|
| `/api/v1/auth` | Login, registration, profile |
| `/api/v1/customer/*` | Customer self-service |
| `/api/v1/consent`, `/api/v1/csr/*` | Staff consent management |
| `/api/v1/dsar*` | Data subject access requests |
| `/api/v1/privacy-notices` | Privacy notices |
| `/api/v1/preferences*` | Communication preferences |
| `/api/v1/users`, `/api/v1/guardians` | User and guardian administration |
| `/api/v1/audit-logs`, `/api/v1/compliance-rules`, `/api/v1/webhooks` | Compliance tooling |
| `/api/v2/enterprise`, `/api/v2/admin/enterprise` | Partner registration and campaigns |
| `/api/tmf632`, `/api/tmf641`, `/api/tmf669` | TM Forum-shaped endpoints |

## Audit trail

Sign-in, consent grant and revoke, DSAR creation and status changes, user
administration and privacy-notice changes write an `AuditLog` entry through
`writeAuditLog()`. Auditing never fails the request that produced it — write
failures are logged and swallowed.

Use `writeAuditLog(req, {...})` rather than `AuditLog.create()` directly; the
schema has required fields that are easy to miss, and a rejected write is
invisible.

## Enterprise campaigns

```
register → admin approves → activate → create campaign → admin approves
        → customers grant partner consent → launch
```

`POST /api/v2/enterprise/campaigns/:id/launch` selects customers matching the
campaign's audience definition. Every recipient then passes through
`ConsentPolicyService.canReceiveCampaignMessage`, which checks campaign status,
organisation status, purpose validity, and the customer's consent for that
recipient, purpose and channel. Suppressed recipients get a `DeliveryEvent`
recording the reason; nothing is sent without a granted, unexpired consent.

Launching currently reaches nobody in practice: no `PartnerConsentRequest`
records exist and the customer UI has no screen for granting partner consent, so
every recipient is suppressed as `NO_CONSENT_FOUND`. The backend chain is
complete and covered by tests; the customer-facing consent request is the
missing piece.

## Consent data model

Customer consents live in the four tables of `SLT_Consent_Management_Data_Model.pdf`, defined in
[models/ConsentDataModel.js](models/ConsentDataModel.js). Columns are the PDF's, camelCased.

| Collection | PDF table | Key |
|---|---|---|
| `consent_categories` | CONSENT_CATEGORY | `categoryCode` |
| `consent_masters` | CONSENT_MASTER | `consentId` |
| `consent_scopes` | CONSENT_SCOPE | `consentScopeId` |
| `customer_consents` | CUSTOMER_CONSENT | `customerConsentId` |

Numeric keys come from `consent_counters`. `customerId` is the customer's MongoDB user id, so it holds
24 characters rather than the PDF's 20.

Everything that reads or writes a customer consent goes through
[services/customerConsentStore.js](services/customerConsentStore.js). Responses carry the PDF columns plus the
older field names (`id`, `partyId`, `purpose`, `status`), so screens written before the PDF still work.
`consentStatus` is stored as GRANTED / DENIED / WITHDRAWN / NOT_RESPONDED; the older `granted` / `declined` /
`revoked` / `pending` are still accepted as input. Consent types and versions are served by
`GET /api/v1/consent-scopes`.

The older `consents` collection is no longer read for customer consents. It still holds partner-campaign
and guardian consents, which have fields the PDF has no place for.

```bash
node scripts/backupConsentData.js                     # JSON dump of every consent collection to db-backup/
node scripts/seedConsentDataModel.js --yes            # drops and rebuilds the four tables with the PDF's sample data
                                                      # plus generated data for every customer (backs up first)
node scripts/restoreConsentData.js db-backup/<folder> --yes   # puts a backup back, replacing those collections
```

`db-backup/` is git-ignored because it holds personal data.

## Known issues

- Four routes are served by handlers backed by module-level arrays rather than
  MongoDB — `GET`/`POST /api/v1/preferences`, `POST /api/v1/dsar`,
  `PUT /api/v1/dsar/:id`. Writes are lost on restart.
- `backend/customer-service` and the other microservice scaffolds were removed;
  they never ran.
