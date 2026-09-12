const fs = require('fs');
let c = fs.readFileSync('render-server.js', 'utf8');
c = c.replace(/\\/\\/ User Schema for MongoDB[\\s\\S]*?const User = mongoose\.model\(\'User\', UserSchema\);/, "const User = require('./models/User');");
c = c.replace(/\\/\\/ Consent Schema for MongoDB[\\s\\S];*?const Consent = mongoose\.model\(\'Consent\', ConsentSchema\);/, "const Consent = require('./models/Consent');");
c = c.replace(/\\/\\/ Preference Schema for MongoDB[\\s\\S]*?const Preference = mongoose\.model\(\'Preference\', PreferenceSchema\);/, "const { UserPreference: Preference } = require('./models/Preference');");
c = c.replace(/\\/\\/ Privacy Notice Schema for MongoDB[\\s\\S];*?const PrivacyNotice = mongoose\.model\(\'PrivacyNotice\', PrivacyNoticeSchema\);/, "const PrivacyNotice = require('./models/PrivacyNoticeNew');");
c = c.replace(/\\/\\/ DSAR Request Schema for MongoDB[\\s\\S]*?const DSARRequest = mongoose\.model\(\'DSARRequest\', DSARRequestSchema\);/, "const DSARRequest = require('./models/DSARRequest');");
fs.writeFileSync('render-server.js', c);