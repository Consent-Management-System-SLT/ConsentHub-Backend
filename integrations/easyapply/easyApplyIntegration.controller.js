const ExternalPartyMapping = require('../../models/ExternalPartyMapping');
const User = require('../../models/User');
const PrivacyNotice = require('../../models/PrivacyNoticeNew');
const Consent = require('../../models/Consent');
const AuditLog = require('../../models/AuditLog');
const crypto = require('crypto');

const logAudit = async (action, description, entityType, entityId, metadata = {}) => {
  try {
    const audit = new AuditLog({
      userId: 'EASYAPPLY_SYSTEM',
      userName: 'EasyApply Integration',
      userEmail: 'system@easyapply.local',
      userRole: 'system',
      action,
      category: 'Consent Management',
      description,
      entityType,
      entityId,
      ipAddress: '127.0.0.1',
      severity: 'medium',
      metadata
    });
    await audit.save();
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};

const resolveParty = async (req, res) => {
  try {
    const { externalCustomerId, name, phone, email } = req.body;
    const sourceSystem = 'EASYAPPLY';

    if (!externalCustomerId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'externalCustomerId is required' }
      });
    }

    // 1. Search mapping
    let mapping = await ExternalPartyMapping.findOne({ sourceSystem, externalCustomerId });
    if (mapping) {
      return res.status(200).json({
        success: true,
        data: {
          partyId: mapping.partyId,
          externalCustomerId,
          sourceSystem,
          resolution: 'existing'
        }
      });
    }

    // 2. Try to find existing User by email or phone
    let user = null;
    if (email) {
      user = await User.findOne({ email: email.toLowerCase() });
    }
    if (!user && phone) {
      user = await User.findOne({ phone });
    }

    let resolution = 'existing';
    // 3. Create if not found
    if (!user) {
      resolution = 'created';
      let firstName = name || 'EasyApply';
      let lastName = 'Customer';
      if (name && name.includes(' ')) {
        const parts = name.split(' ');
        firstName = parts[0];
        lastName = parts.slice(1).join(' ');
      }
      
      const defaultEmail = email || `easyapply_${externalCustomerId}@placeholder.local`;
      
      user = new User({
        email: defaultEmail,
        password: crypto.randomBytes(16).toString('hex'),
        firstName,
        lastName,
        phone: phone || '0000000000',
        role: 'customer',
        company: 'SLT-Mobitel',
        status: 'active',
        isActive: true
      });
      await user.save();
    }

    // 4. Create mapping
    mapping = new ExternalPartyMapping({
      sourceSystem,
      externalCustomerId,
      partyId: user._id.toString()
    });
    await mapping.save();

    await logAudit('user_created', `Resolved EasyApply customer ${externalCustomerId} to party ${user._id}`, 'user', user._id.toString(), { sourceSystem, externalCustomerId });

    return res.status(200).json({
      success: true,
      data: {
        partyId: mapping.partyId,
        externalCustomerId,
        sourceSystem,
        resolution
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      // Concurrent duplicate creation, retry fetching mapping
      const mapping = await ExternalPartyMapping.findOne({ sourceSystem: req.body.sourceSystem, externalCustomerId: req.body.externalCustomerId });
      if (mapping) {
        return res.status(200).json({
          success: true,
          data: {
            partyId: mapping.partyId,
            externalCustomerId: req.body.externalCustomerId,
            sourceSystem: req.body.sourceSystem,
            resolution: 'existing'
          }
        });
      }
    }
    console.error('Resolve Party Error:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
};

const getActivePrivacyNotice = async (req, res) => {
  try {
    const { serviceType, language = 'en' } = req.query;
    console.log(`[EasyApplyIntegration] GET /privacy-notices/active serviceType=${serviceType || '(none)'} language=${language}`);
    
    let filter = { status: 'active', language };
    if (serviceType) {
      filter.applicableServices = serviceType;
    }

    let notice = await PrivacyNotice.findOne(filter).sort({ effectiveDate: -1 });

    if (!notice) {
      console.log(`[EasyApplyIntegration] No active privacy notice found for serviceType=${serviceType || '(none)'} language=${language}`);
      return res.status(404).json({
        success: false,
        error: { code: 'PRIVACY_NOTICE_NOT_FOUND', message: 'No active privacy notice was found.' }
      });
    }

    console.log(`[EasyApplyIntegration] Found notice: id=${notice.noticeId} version=${notice.version}`);
    return res.status(200).json({
      success: true,
      data: {
        noticeId: notice.noticeId,
        version: notice.version,
        title: notice.title,
        content: notice.content,
        effectiveFrom: notice.effectiveDate,
        purposes: notice.purposes.map(p => ({
          purpose: p,
          label: `Consent for ${p}`,
          required: p === 'service'
        }))
      }
    });
  } catch (error) {
    console.error('Get Privacy Notice Error:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
};

const captureConsents = async (req, res) => {
  try {
    const { externalCustomerId, applicationReference, serviceType, privacyNoticeId, privacyNoticeVersion, channel, decisions } = req.body;
    const idempotencyKey = req.headers['idempotency-key'];

    if (!externalCustomerId || !decisions) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'externalCustomerId and decisions are required' } });
    }

    // Check mapping
    const mapping = await ExternalPartyMapping.findOne({ sourceSystem: 'EASYAPPLY', externalCustomerId });
    if (!mapping) {
      return res.status(404).json({ success: false, error: { code: 'MAPPING_NOT_FOUND', message: 'Customer mapping not found. Resolve party first.' } });
    }
    const partyId = mapping.partyId;

    if (idempotencyKey) {
      const existing = await Consent.findOne({ 'metadata.idempotencyKey': idempotencyKey });
      if (existing) {
        // Return original success by querying all consents for this ref
        const allConsents = await Consent.find({ applicationReference, partyId, sourceSystem: 'EASYAPPLY' });
        return res.status(200).json({
          success: true,
          data: {
            partyId,
            privacyNoticeId,
            privacyNoticeVersion,
            consents: allConsents.map(c => ({
              purpose: c.purpose,
              consentId: c.id,
              status: c.status
            }))
          }
        });
      }
    }

    const createdConsents = [];
    for (const decision of decisions) {
      const consentId = `CONSENT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const status = decision.granted ? 'granted' : 'revoked';
      
      const newConsent = new Consent({
        id: consentId,
        partyId,
        purpose: decision.purpose,
        status: status,
        channel: 'EASYAPPLY',
        privacyNoticeId,
        versionAccepted: privacyNoticeVersion,
        timestampGranted: decision.granted ? new Date() : undefined,
        timestampRevoked: !decision.granted ? new Date() : undefined,
        grantedAt: decision.granted ? new Date() : undefined,
        revokedAt: !decision.granted ? new Date() : undefined,
        applicationReference,
        sourceSystem: 'EASYAPPLY',
        metadata: {
          idempotencyKey,
          serviceType
        }
      });
      await newConsent.save();
      createdConsents.push({
        purpose: decision.purpose,
        consentId: newConsent.id,
        status: newConsent.status
      });

      await logAudit(
        decision.granted ? 'consent_granted' : 'consent_revoked',
        `Consent ${status} for ${decision.purpose} via EasyApply`,
        'consent',
        consentId,
        { partyId, applicationReference, sourceSystem: 'EASYAPPLY' }
      );
    }

    return res.status(201).json({
      success: true,
      data: {
        partyId,
        privacyNoticeId,
        privacyNoticeVersion,
        consents: createdConsents
      }
    });

  } catch (error) {
    console.error('Capture Consents Error:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
};

const getCustomerConsents = async (req, res) => {
  try {
    const { externalCustomerId } = req.params;
    
    const mapping = await ExternalPartyMapping.findOne({ sourceSystem: 'EASYAPPLY', externalCustomerId });
    if (!mapping) {
      return res.status(404).json({ success: false, error: { code: 'MAPPING_NOT_FOUND', message: 'Customer mapping not found.' } });
    }

    const consents = await Consent.find({ partyId: mapping.partyId });

    return res.status(200).json({
      success: true,
      data: consents.map(c => ({
        consentId: c.id,
        purpose: c.purpose,
        status: c.status,
        privacyNoticeId: c.privacyNoticeId,
        versionAccepted: c.versionAccepted,
        timestampGranted: c.timestampGranted,
        timestampRevoked: c.timestampRevoked,
        channel: c.channel
      }))
    });
  } catch (error) {
    console.error('Get Consents Error:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
};

const updateConsent = async (req, res) => {
  try {
    const { consentId } = req.params;
    const { status } = req.body;

    if (!['granted', 'revoked'].includes(status)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid status' } });
    }

    const consent = await Consent.findOne({ id: consentId });
    if (!consent) {
      return res.status(404).json({ success: false, error: { code: 'CONSENT_NOT_FOUND', message: 'Consent not found.' } });
    }

    if (consent.sourceSystem !== 'EASYAPPLY') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Cannot modify consents not owned by EasyApply.' } });
    }

    consent.status = status;
    if (status === 'granted') {
      consent.timestampGranted = new Date();
      consent.grantedAt = new Date();
    } else {
      consent.timestampRevoked = new Date();
      consent.revokedAt = new Date();
    }
    await consent.save();

    await logAudit(
      status === 'granted' ? 'consent_granted' : 'consent_revoked',
      `Consent ${consentId} updated to ${status} via EasyApply`,
      'consent',
      consentId,
      { partyId: consent.partyId, sourceSystem: 'EASYAPPLY' }
    );

    return res.status(200).json({
      success: true,
      data: {
        consentId: consent.id,
        purpose: consent.purpose,
        status: consent.status
      }
    });
  } catch (error) {
    console.error('Update Consent Error:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
};

const revokeConsent = async (req, res) => {
  req.body.status = 'revoked';
  return updateConsent(req, res);
};

module.exports = {
  resolveParty,
  getActivePrivacyNotice,
  captureConsents,
  getCustomerConsents,
  updateConsent,
  revokeConsent
};
