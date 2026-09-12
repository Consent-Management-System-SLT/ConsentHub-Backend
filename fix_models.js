const fs = require('fs');
['models/User.js', 'models/Consent.js', 'models/PrivacyNoticeNew.js', 'models/AuditLog.js', 'models/ExternalPartyMapping.js'].forEach(f => {
  if (!fs.existsSync(f)) return;
  let lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
  let out = lines.map(l => {
    if (l.includes('module.exports = mongoose.model')) {
      return l.replace(/module\.exports = mongoose\.model\(['"]([^'"]+)['"],\s*([^)]+)\);/, "module.exports = mongoose.models.$1 || mongoose.model('$1', $2);");
    }
    return l;
  });
  fs.writeFileSync(f, out.join('\n'));
});
