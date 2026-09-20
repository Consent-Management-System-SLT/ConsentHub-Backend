// Dumps the consent collections to db-backup/<timestamp>/<collection>.json (extended JSON, so
// ObjectIds and dates survive a restore). Usage: node scripts/backupConsentData.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { EJSON } = require('bson');

const COLLECTIONS = [
  'consents',
  'consent_categories',
  'consent_masters',
  'consent_scopes',
  'customer_consents',
  'consent_counters',
  'external_party_mappings',
];

/** Needs an open mongoose connection. Returns the folder written. */
async function backup() {
  const dir = path.join(__dirname, '..', 'db-backup', new Date().toISOString().replace(/[:.]/g, '-'));
  fs.mkdirSync(dir, { recursive: true });
  const existing = new Set((await mongoose.connection.db.listCollections().toArray()).map((c) => c.name));
  for (const name of COLLECTIONS) {
    if (!existing.has(name)) continue;
    const docs = await mongoose.connection.db.collection(name).find({}).toArray();
    fs.writeFileSync(path.join(dir, `${name}.json`), EJSON.stringify(docs, null, 2, { relaxed: false }));
    console.log(`  backed up ${name}: ${docs.length} documents`);
  }
  console.log(`  backup folder: ${dir}`);
  return dir;
}

module.exports = { backup };

if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(backup)
    .then(() => mongoose.disconnect())
    .catch((e) => { console.error(e); process.exit(1); });
}
