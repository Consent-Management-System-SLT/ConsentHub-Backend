const fs = require('fs');
let c = fs.readFileSync('models/Consent.js', 'utf8');
c = c.replace("module.exports = mongoose.model('Consent', consentSchema);", "module.exports = mongoose.models.Consent || mongoose.model('Consent', consentSchema);\n");
fs.writeFileSync('models/Consent.js', c);
