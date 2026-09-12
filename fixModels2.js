const fs = require('fs');
['models/User.js', 'models/Consent.js', 'models/PrivacyNoticeNew.js', 'models/AuditLog.js', 'models/ExternalPartyMapping.js'].forEach(f => {
  if(!fs.existsSync(f)) return;
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/mongoose\.model\(['"]([^'"]+)['"]\s*,/g, "(mongoose.models['$1'] || mongoose.model('$1',");
  fs.writeFileSync(f, c);
});
