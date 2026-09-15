const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: true,
            message: 'No valid token provided'
        });
    }
    
    try {
        const token = authHeader.substring(7);
        // Using the same env var logic
        const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-2023';
        const payload = jwt.verify(token, secret);
        req.user = payload;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({
            error: true,
            message: 'Invalid or expired token'
        });
    }
}

function requireRole(roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                error: true,
                message: 'Insufficient permissions. Required roles: ' + roles.join(', ')
            });
        }
        next();
    };
}

function requireEnterpriseTenantWithStatus(allowedStatuses = ['ACTIVE']) {
    return async (req, res, next) => {
        try {
            if (!req.user || req.user.role !== 'enterprise') {
                return res.status(403).json({ error: true, message: 'Must be an enterprise user' });
            }

            const EnterpriseUser = require('../models/EnterpriseUser');
            const EnterpriseOrganization = require('../models/EnterpriseOrganization');

            const eu = await EnterpriseUser.findOne({ userId: req.user.id }).populate('organizationId');
            if (!eu || !eu.organizationId) {
                return res.status(403).json({ error: true, message: 'User is not associated with an enterprise organization' });
            }

            const org = eu.organizationId;
            if (!allowedStatuses.includes(org.status)) {
                return res.status(403).json({ 
                    error: true, 
                    message: `Enterprise organization is not allowed. Current status: ${org.status}` 
                });
            }

            req.enterprise = {
                organizationId: org._id,
                organization: org,
                membership: eu
            };
            
            next();
        } catch (error) {
            console.error('Enterprise Tenant Verification Error:', error);
            res.status(500).json({ error: true, message: 'Failed to verify enterprise tenant' });
        }
    };
}

const requireEnterpriseTenant = requireEnterpriseTenantWithStatus(['ACTIVE']);

module.exports = { verifyToken, requireRole, requireEnterpriseTenant, requireEnterpriseTenantWithStatus };
