const fs = require('fs');

let code = fs.readFileSync('routes/enterpriseRoutes.js', 'utf8');

const updatedRegisterLogic = \
router.post('/register', upload.single('document'), async (req, res) => {
  try {
    const { 
      legalName, tradingName, registrationNumber, organizationType, industry, 
      website, registeredAddress, country, authRepName, authRepEmail, 
      authRepPhone, authRepDesignation, authRepDepartment, 
      privacyName, privacyEmail, privacyPhone, privacyDesignation,
      requestedCapabilities, requestedChannels
    } = req.body;

    const org = new EnterpriseOrganization({
      legalName,
      tradingName,
      registrationNumber,
      organizationType,
      industry,
      website,
      registeredAddress,
      country,
      status: 'SUBMITTED',
      authorizedRepresentative: {
        name: authRepName,
        email: authRepEmail,
        phone: authRepPhone,
        designation: authRepDesignation,
        department: authRepDepartment
      },
      privacyContact: {
        name: privacyName,
        email: privacyEmail,
        phone: privacyPhone,
        designation: privacyDesignation
      },
      requestedCapabilities: requestedCapabilities ? JSON.parse(requestedCapabilities) : []
    });

    await org.save();

    if (req.file) {
      const doc = new EnterpriseDocument({
        organizationId: org._id,
        documentType: 'BUSINESS_REGISTRATION',
        originalFilename: req.file.originalname,
        storedFilename: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        storagePath: req.file.path
      });
      await doc.save();
    }

    // Send email notification - we don't have a user yet, but deliver takes customer object. 
    // Wait, deliver expects customer.email
    try {
      const NodemailerProvider = require('../services/messaging/NodemailerProvider');
      await NodemailerProvider.deliver({
        customer: { email: authRepEmail },
        subject: 'Enterprise Registration Received',
        content: 'We have received your application for ' + legalName + '. Our team is reviewing it.'
      });
    } catch (err) {
      console.error('Failed to send registration email', err);
    }

    res.status(201).json({ success: true, organizationId: org._id, message: 'Application submitted for review' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: true, message: 'Registration failed' });
  }
});
\;

// We replace the current /register router.post entirely.
// Find where it starts and ends
const startIndex = code.indexOf("router.post('/register', upload.single('document')");
const endIndex = code.indexOf("router.get('/application/status', verifyToken");
const alternativeEndIndex = code.indexOf("router.post('/application/resubmit', verifyToken");
const actualEndIndex = (endIndex > -1 && endIndex < alternativeEndIndex) ? endIndex : alternativeEndIndex;

if (startIndex > -1 && actualEndIndex > -1) {
  code = code.substring(0, startIndex) + updatedRegisterLogic + "\\n\\n" + code.substring(actualEndIndex);
  fs.writeFileSync('routes/enterpriseRoutes.js', code);
  console.log("Updated enterpriseRoutes.js");
} else {
  console.log("Failed to find boundaries in enterpriseRoutes.js");
}
