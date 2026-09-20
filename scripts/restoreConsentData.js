// Restores collections from a backup folder made by backupConsentData.js. It REPLACES the current
// contents of every collection that has a .json file in the folder. Indexes are not restored;
// the app (or Model.syncIndexes) recreates the ones it needs.
// Usage: node scripts/restoreConsentData.js db-backup/<timestamp> --yes
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { EJSON } = require('bson');

const dir = process.argv[2];
if (!dir || !process.argv.includes('--yes')) {
  console.error('Usage: node scripts/restoreConsentData.js db-backup/<timestamp> --yes   (replaces the collections in that folder)');
  process.exit(1);
}

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const name = path.basename(file, '.json');
    const docs = EJSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const col = mongoose.connection.db.collection(name);
    await col.drop().catch(() => {}); // also drops the current indexes, which may not suit the old documents
    if (docs.length) await col.insertMany(docs);
    console.log(`restored ${name}: ${docs.length} documents`);
  }
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
