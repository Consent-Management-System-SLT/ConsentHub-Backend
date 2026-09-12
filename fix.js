const fs = require('fs');
let p = fs.readFileSync('models/PrivacyNoticeNew.js', 'utf8');
p = p.replace("const PrivacyNotice = mongoose.model('PrivacyNotice', privacyNoticeSchema);", "const PrivacyNotice = mongoose.models.PrivacyNotice || mongoose.model('PrivacyNotice', privacyNoticeSchema);");
fs.writeFileSync('models/PrivacyNoticeNew.js', p);
