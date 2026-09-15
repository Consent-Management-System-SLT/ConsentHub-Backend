require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

mongoose.connect(MONGO_URI).then(async () => {
    console.log('Connected to DB');

    const EnterpriseOrganization = require('./models/EnterpriseOrganization');
    const Recipient = require('./models/Recipient');
    const Purpose = require('./models/Purpose');
    const Scope = require('./models/Scope');
    const ConsentTemplate = require('./models/ConsentTemplate');
    const ConsentTemplateVersion = require('./models/ConsentTemplateVersion');
    const User = require('./models/User');

    // Assume admin user exists
    const admin = await User.findOne({ role: 'admin' }) || await User.findOne();
    const adminId = admin ? admin._id : new mongoose.Types.ObjectId();

    // 1. Find HNB Org
    const hnbOrg = await EnterpriseOrganization.findOne({ legalName: 'HNB' });
    if (!hnbOrg) {
        console.error('HNB org not found!');
        process.exit(1);
    }

    // 2. Create Purposes
    const purpose1 = await Purpose.findOneAndUpdate(
        { purposeCode: 'PARTNER_MARKETING' },
        { name: 'Partner Promotional Marketing', status: 'ACTIVE', createdBy: adminId, approvedBy: adminId },
        { upsert: true, new: true }
    );
    const purpose2 = await Purpose.findOneAndUpdate(
        { purposeCode: 'FRAUD_PREVENTION' },
        { name: 'Fraud Prevention', status: 'ACTIVE', createdBy: adminId, approvedBy: adminId },
        { upsert: true, new: true }
    );

    // 3. Create Scopes
    const scope1 = await Scope.findOneAndUpdate(
        { scopeCode: 'marketing.sms' },
        { name: 'SMS Marketing', status: 'ACTIVE' },
        { upsert: true, new: true }
    );
    const scope2 = await Scope.findOneAndUpdate(
        { scopeCode: 'marketing.email' },
        { name: 'Email Marketing', status: 'ACTIVE' },
        { upsert: true, new: true }
    );
    const scope3 = await Scope.findOneAndUpdate(
        { scopeCode: 'myslt.push' },
        { name: 'MySLT Push', status: 'ACTIVE' },
        { upsert: true, new: true }
    );

    // 4. Create/Update Recipient
    let recipient = await Recipient.findOne({ organizationId: hnbOrg._id });
    if (!recipient) {
        recipient = new Recipient({
            organizationId: hnbOrg._id,
            recipientCode: 'REC-HNB',
            legalName: hnbOrg.legalName,
            status: 'ACTIVE',
            approvedPurposes: [purpose1._id, purpose2._id],
            approvedScopes: [scope1._id, scope2._id, scope3._id]
        });
        await recipient.save();
    } else {
        recipient.status = 'ACTIVE';
        recipient.approvedPurposes = [purpose1._id, purpose2._id];
        recipient.approvedScopes = [scope1._id, scope2._id, scope3._id];
        await recipient.save();
    }

    // 5. Create Consent Template
    let template = await ConsentTemplate.findOne({ recipientId: recipient._id, purposeId: purpose1._id });
    if (!template) {
        template = new ConsentTemplate({
            name: 'HNB Partner Marketing Template',
            recipientId: recipient._id,
            purposeId: purpose1._id,
            scopeIds: [scope1._id, scope2._id],
            status: 'ACTIVE',
            createdBy: adminId
        });
        await template.save();
    }

    let version = await ConsentTemplateVersion.findOne({ templateId: template._id, version: '1.0' });
    if (!version) {
        version = new ConsentTemplateVersion({
            templateId: template._id,
            version: '1.0',
            title: 'HNB Marketing Consent',
            content: 'Sampath Bank PLC would like permission to send you promotional communications through SLT.',
            status: 'APPROVED',
            createdBy: adminId,
            approvedBy: adminId
        });
        await version.save();
    }

    console.log('Seed completed successfully!');
    mongoose.disconnect();
}).catch(err => {
    console.error('Failed to connect or run seed:', err);
    process.exit(1);
});
