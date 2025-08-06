// csr-service/db/partyDb.js
const mongoose = require('mongoose');

const partyDb = mongoose.createConnection(process.env.PARTY_DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

module.exports = partyDb;
