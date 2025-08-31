const mongoose = require('mongoose');
const User = require('./models/User');
const Consent = require('./models/Consent');
const PrivacyNotice = require('./models/PrivacyNoticeNew');
const DSARRequest = require('./models/DSARRequest');
const { UserPreference } = require('./models/Preference');

/**
 * Enhanced Customer Data Provisioning Service
 * Creates isolated default data for new customers
 */

// Default consent templates for new customers
const DEFAULT_CONSENT_TEMPLATES = [
    {
        purpose: "marketing",
        type: "marketing",
        status: "pending",
        channel: "email",
        description: "Marketing communications and promotional offers",
        category: "marketing",
        legalBasis: "consent",
        required: false,
        expiresInMonths: 24
    },
    {
        purpose: "analytics",
        type: "analytics", 
        status: "pending",
        channel: "web",
        description: "Website analytics and usage improvement",
        category: "analytics",
        legalBasis: "consent",
        required: false,
        expiresInMonths: 12
    },
    {
        purpose: "dataProcessing",
        type: "essential",
        status: "granted",
        channel: "all",
        description: "Essential data processing for service delivery",
        category: "essential",
        legalBasis: "contract",
        required: true,
        expiresInMonths: null
    },
    {
        purpose: "personalization",
        type: "personalization",
        status: "pending", 
        channel: "web",
        description: "Personalized content and recommendations",
        category: "enhancement",
        legalBasis: "consent",
        required: false,
        expiresInMonths: 18
    },
    {
        purpose: "research",
        type: "research",
        status: "pending",
        channel: "all", 
        description: "Product improvement and research",
        category: "research",
        legalBasis: "legitimate_interest",
        required: false,
        expiresInMonths: 36
    }
];

// Default preference templates
const DEFAULT_PREFERENCE_TEMPLATES = [
    {
        category: "communication",
        type: "email",
        enabled: true,
        frequency: "weekly",
        description: "Email communication preferences"
    },
    {
        category: "communication", 
        type: "sms",
        enabled: false,
        frequency: "never",
        description: "SMS communication preferences"
    },
    {
        category: "communication",
        type: "push",
        enabled: true,
        frequency: "immediate",
        description: "Push notification preferences"
    },
    {
        category: "privacy",
        type: "data_sharing",
        enabled: false,
        frequency: "never",
        description: "Third-party data sharing preferences"
    },
    {
        category: "system",
        type: "language",
        enabled: true,
        frequency: "always",
        value: "en",
        description: "System language preference"
    }
];

// Default privacy notice templates
const DEFAULT_PRIVACY_NOTICES = [
    {
        title: "Welcome to ConsentHub",
        content: "This privacy notice explains how we collect, use, and protect your personal data when you use our consent management services.",
        category: "general",
        status: "active",
        priority: "high",
        version: "1.0",
        effectiveDate: new Date(),
        language: "en"
    },
    {
        title: "Data Processing Notice",
        content: "We process your personal data to provide our services, improve user experience, and comply with legal obligations.",
        category: "data_processing",
        status: "active", 
        priority: "medium",
        version: "1.0",
        effectiveDate: new Date(),
        language: "en"
    },
    {
        title: "Marketing Communications",
        content: "Learn how we may contact you with marketing materials and how to opt-out at any time.",
        category: "marketing",
        status: "active",
        priority: "low", 
        version: "1.0",
        effectiveDate: new Date(),
        language: "en"
    }
];

/**
 * Create default consents for a new customer
 */
async function createDefaultConsentsForCustomer(userId, userEmail) {
    console.log(`🎯 Creating default consents for customer: ${userEmail} (${userId})`);
    
    const createdConsents = [];
    const userIdString = userId.toString();
    
    for (const template of DEFAULT_CONSENT_TEMPLATES) {
        try {
            const consentData = {
                id: `consent_${userIdString}_${template.type}_${Date.now()}`,
                partyId: userIdString,
                customerId: userIdString,
                purpose: template.purpose,
                type: template.type,
                status: template.status,
                channel: template.channel,
                validFrom: new Date(),
                validTo: template.expiresInMonths ? 
                    new Date(Date.now() + template.expiresInMonths * 30 * 24 * 60 * 60 * 1000) : null,
                expiresAt: template.expiresInMonths ?
                    new Date(Date.now() + template.expiresInMonths * 30 * 24 * 60 * 60 * 1000) : null,
                grantedAt: template.status === 'granted' ? new Date() : null,
                deniedAt: template.status === 'denied' ? new Date() : null,
                geoLocation: "Sri Lanka",
                privacyNoticeId: `notice_${template.category}`,
                versionAccepted: "1.0",
                recordSource: "auto_provisioned",
                metadata: {
                    description: template.description,
                    category: template.category,
                    legalBasis: template.legalBasis,
                    required: template.required,
                    customerEmail: userEmail,
                    createdBy: "system"
                }
            };
            
            const consent = new Consent(consentData);
            await consent.save();
            createdConsents.push(consent);
            
            console.log(`✅ Created consent: ${template.purpose} (${template.status})`);
        } catch (error) {
            console.error(`❌ Failed to create consent ${template.purpose}:`, error.message);
        }
    }
    
    console.log(`🎉 Created ${createdConsents.length} default consents for ${userEmail}`);
    return createdConsents;
}

/**
 * Create default preferences for a new customer
 */
async function createDefaultPreferencesForCustomer(userId, userEmail) {
    console.log(`🎯 Creating default preferences for customer: ${userEmail} (${userId})`);
    
    const createdPreferences = [];
    const userIdString = userId.toString();
    
    for (const template of DEFAULT_PREFERENCE_TEMPLATES) {
        try {
            const preferenceData = {
                userId: userIdString,
                category: template.category,
                type: template.type,
                enabled: template.enabled,
                frequency: template.frequency,
                value: template.value || template.enabled,
                metadata: {
                    description: template.description,
                    customerEmail: userEmail,
                    source: "auto_provisioned",
                    createdBy: "system"
                }
            };
            
            const preference = new UserPreference(preferenceData);
            await preference.save();
            createdPreferences.push(preference);
            
            console.log(`✅ Created preference: ${template.category}/${template.type} (${template.enabled ? 'enabled' : 'disabled'})`);
        } catch (error) {
            console.error(`❌ Failed to create preference ${template.category}/${template.type}:`, error.message);
        }
    }
    
    console.log(`🎉 Created ${createdPreferences.length} default preferences for ${userEmail}`);
    return createdPreferences;
}

/**
 * Create default privacy notices acknowledgments for a new customer
 */
async function createDefaultPrivacyNoticesForCustomer(userId, userEmail) {
    console.log(`🎯 Creating default privacy notices for customer: ${userEmail} (${userId})`);
    
    const createdNotices = [];
    const userIdString = userId.toString();
    
    for (const template of DEFAULT_PRIVACY_NOTICES) {
        try {
            // First check if this notice already exists globally
            let existingNotice = await PrivacyNotice.findOne({ 
                title: template.title,
                category: template.category 
            });
            
            if (!existingNotice) {
                // Create the global privacy notice
                const noticeData = {
                    noticeId: `notice_${template.category}_${Date.now()}`,
                    title: template.title,
                    content: template.content,
                    category: template.category,
                    status: template.status,
                    priority: template.priority,
                    version: template.version,
                    effectiveDate: template.effectiveDate,
                    language: template.language,
                    metadata: {
                        createdBy: "system",
                        global: true,
                        autoCreated: true
                    }
                };
                
                existingNotice = new PrivacyNotice(noticeData);
                await existingNotice.save();
                console.log(`✅ Created global privacy notice: ${template.title}`);
            }
            
            // Create customer-specific acknowledgment record
            const customerNotice = new PrivacyNotice({
                noticeId: `${existingNotice.noticeId}_customer_${userIdString}`,
                title: template.title,
                content: template.content,
                category: template.category,
                status: "pending_acknowledgment",
                priority: template.priority,
                version: template.version,
                effectiveDate: template.effectiveDate,
                language: template.language,
                customerId: userIdString,
                acknowledged: false,
                acknowledgedAt: null,
                metadata: {
                    customerEmail: userEmail,
                    globalNoticeId: existingNotice._id,
                    requiresAction: true,
                    createdBy: "system"
                }
            });
            
            await customerNotice.save();
            createdNotices.push(customerNotice);
            
            console.log(`✅ Created customer notice: ${template.title} (pending acknowledgment)`);
        } catch (error) {
            console.error(`❌ Failed to create privacy notice ${template.title}:`, error.message);
        }
    }
    
    console.log(`🎉 Created ${createdNotices.length} default privacy notices for ${userEmail}`);
    return createdNotices;
}

/**
 * Main function to provision all default data for a new customer
 */
async function provisionDefaultDataForNewCustomer(userId, userEmail, userName) {
    console.log(`\n🚀 PROVISIONING DEFAULT DATA FOR NEW CUSTOMER`);
    console.log(`📧 Email: ${userEmail}`);
    console.log(`👤 Name: ${userName}`);
    console.log(`🆔 User ID: ${userId}`);
    console.log(`⏰ Time: ${new Date().toISOString()}\n`);
    
    try {
        // Create all default data in parallel for better performance
        const [consents, preferences, notices] = await Promise.all([
            createDefaultConsentsForCustomer(userId, userEmail),
            createDefaultPreferencesForCustomer(userId, userEmail),
            createDefaultPrivacyNoticesForCustomer(userId, userEmail)
        ]);
        
        console.log(`\n✅ PROVISIONING COMPLETE FOR ${userEmail}`);
        console.log(`📊 Summary:`);
        console.log(`   🔒 Consents: ${consents.length}`);
        console.log(`   ⚙️  Preferences: ${preferences.length}`);
        console.log(`   📋 Privacy Notices: ${notices.length}`);
        console.log(`   🎯 Total Items: ${consents.length + preferences.length + notices.length}\n`);
        
        return {
            success: true,
            data: {
                consents: consents.length,
                preferences: preferences.length,
                notices: notices.length,
                total: consents.length + preferences.length + notices.length
            }
        };
        
    } catch (error) {
        console.error(`❌ PROVISIONING FAILED FOR ${userEmail}:`, error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Ensure data isolation - Get customer-specific data only
 */
async function getCustomerIsolatedData(userId, dataType) {
    const userIdString = userId.toString();
    
    try {
        let result;
        switch (dataType) {
            case 'consents':
                result = await Consent.find({
                    $or: [
                        { partyId: userIdString },
                        { customerId: userIdString }
                    ]
                }).sort({ createdAt: -1 });
                console.log(`🔍 Consents query for ${userIdString}: Found ${result.length} records`);
                break;
                
            case 'preferences':
                result = await UserPreference.find({ 
                    userId: userIdString 
                }).sort({ createdAt: -1 });
                console.log(`🔍 Preferences query for ${userIdString}: Found ${result.length} records`);
                console.log(`   Query: UserPreference.find({ userId: "${userIdString}" })`);
                if (result.length > 0) {
                    console.log(`   Sample record:`, JSON.stringify(result[0], null, 2));
                }
                break;
                
            case 'privacy_notices':
            case 'privacyNotices': // Support both naming conventions
                // For new customers, return only a subset of relevant notices, not all global ones
                // This prevents overwhelming new users with 19+ notices
                result = await PrivacyNotice.find({
                    $or: [
                        { customerId: userIdString }, // User-specific notices
                        { 
                            status: 'active', 
                            customerId: { $exists: false },
                            $or: [
                                { category: 'general' },
                                { category: 'essential' },
                                { category: 'marketing' },
                                { category: 'data_processing' }
                            ]
                        } // Only key global notices
                    ]
                }).limit(4).sort({ priority: 1, createdAt: -1 }); // Reduced from 10 to 4
                console.log(`🔍 Privacy Notices query for ${userIdString}: Found ${result.length} records`);
                console.log(`   Global notices included: ${result.filter(n => !n.customerId).length}`);
                console.log(`   User-specific notices: ${result.filter(n => n.customerId === userIdString).length}`);
                break;
                
            case 'dsar_requests':
            case 'dsarRequests': // Support both naming conventions
                result = await DSARRequest.find({ 
                    $or: [
                        { userId: userIdString },
                        { partyId: userIdString },
                        { customerId: userIdString },
                        { requesterId: userIdString } // Add this missing field!
                    ]
                }).sort({ createdAt: -1 });
                console.log(`🔍 DSAR Requests query for ${userIdString}: Found ${result.length} records`);
                console.log(`   Query included: userId, partyId, customerId, requesterId = "${userIdString}"`);
                if (result.length > 0) {
                    console.log(`   Sample record:`, {
                        _id: result[0]._id,
                        requesterId: result[0].requesterId,
                        requesterEmail: result[0].requesterEmail,
                        status: result[0].status
                    });
                }
                break;
                
            default:
                throw new Error(`Unknown data type: ${dataType}`);
        }
        
        return result;
    } catch (error) {
        console.error(`❌ Error getting isolated data for ${userId} (${dataType}):`, error.message);
        throw error;
    }
}

module.exports = {
    provisionDefaultDataForNewCustomer,
    getCustomerIsolatedData,
    createDefaultConsentsForCustomer,
    createDefaultPreferencesForCustomer,
    createDefaultPrivacyNoticesForCustomer
};
