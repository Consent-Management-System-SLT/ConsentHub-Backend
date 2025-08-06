const admin = require('firebase-admin');
const UserProfile = require('../models/UserProfile');
const { createAuditLog } = require('../../shared/utils/auditLogger');
const { publishEvent } = require('../../shared/utils/eventPublisher');

class AuthController {
  // Initialize Firebase Admin SDK
  async initializeFirebase() {
    try {
      if (!admin.apps.length) {
        const serviceAccount = {
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        };

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
      }
      return { success: true };
    } catch (error) {
      console.error('Firebase initialization error:', error);
      return { success: false, error: error.message };
    }
  }

  // Verify Firebase ID token and sync user profile
  async verifyToken(req, res) {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({
          error: {
            code: 'MISSING_TOKEN',
            message: 'ID token is required'
          }
        });
      }

      // Verify the Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const { uid, email, email_verified, phone_number } = decodedToken;

      // Get or create user profile
      let userProfile = await UserProfile.findByFirebaseUid(uid);
      
      if (!userProfile) {
        // Create new user profile
        userProfile = new UserProfile({
          firebaseUid: uid,
          email: email,
          emailVerified: email_verified || false,
          phoneNumber: phone_number,
          phoneVerified: !!phone_number,
          displayName: decodedToken.name,
          photoURL: decodedToken.picture,
          status: 'active',
          lastLoginAt: new Date(),
          lastLoginIP: req.ip
        });

        await userProfile.save();

        // Create audit log
        await createAuditLog({
          action: 'USER_REGISTRATION',
          userId: uid,
          service: 'auth-service',
          details: {
            email: email,
            registrationMethod: 'firebase'
          }
        });

        // Publish event
        await publishEvent({
          eventType: 'UserRegistered',
          source: 'auth-service',
          correlationId: req.headers['x-correlation-id'],
          data: {
            userId: uid,
            email: email,
            role: userProfile.role
          }
        });
      } else {
        // Update existing profile
        userProfile.lastLoginAt = new Date();
        userProfile.lastLoginIP = req.ip;
        userProfile.emailVerified = email_verified || userProfile.emailVerified;
        
        if (phone_number && !userProfile.phoneNumber) {
          userProfile.phoneNumber = phone_number;
          userProfile.phoneVerified = true;
        }

        await userProfile.save();
        await userProfile.resetLoginAttempts();

        // Create audit log
        await createAuditLog({
          action: 'USER_LOGIN',
          userId: uid,
          service: 'auth-service',
          details: {
            email: email,
            loginMethod: 'firebase',
            ip: req.ip
          }
        });
      }

      // Set custom claims if needed
      const customClaims = {
        role: userProfile.role,
        partyId: userProfile.partyId,
        status: userProfile.status
      };

      await admin.auth().setCustomUserClaims(uid, customClaims);

      // Generate session information
      const sessionData = {
        uid: uid,
        email: email,
        role: userProfile.role,
        partyId: userProfile.partyId,
        status: userProfile.status,
        emailVerified: userProfile.emailVerified,
        preferences: userProfile.preferences
      };

      res.json({
        success: true,
        user: sessionData,
        customClaims: customClaims
      });

    } catch (error) {
      console.error('Token verification error:', error);
      
      if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'ID token has expired'
          }
        });
      }

      if (error.code === 'auth/id-token-revoked') {
        return res.status(401).json({
          error: {
            code: 'TOKEN_REVOKED',
            message: 'ID token has been revoked'
          }
        });
      }

      res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid ID token'
        }
      });
    }
  }

  // Create new user account
  async createUser(req, res) {
    try {
      const { email, password, displayName, phoneNumber, role = 'customer' } = req.body;

      // Validate admin permissions for creating CSR/admin users
      if (role !== 'customer' && (!req.user || req.user.role !== 'admin')) {
        return res.status(403).json({
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Only administrators can create CSR or admin accounts'
          }
        });
      }

      // Create Firebase user
      const userRecord = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: displayName,
        phoneNumber: phoneNumber,
        emailVerified: false
      });

      // Create user profile
      const userProfile = new UserProfile({
        firebaseUid: userRecord.uid,
        email: email,
        emailVerified: false,
        phoneNumber: phoneNumber,
        phoneVerified: !!phoneNumber,
        displayName: displayName,
        role: role,
        status: 'pending_verification',
        createdBy: req.user?.uid
      });

      await userProfile.save();

      // Set custom claims
      const customClaims = {
        role: role,
        status: 'pending_verification'
      };

      await admin.auth().setCustomUserClaims(userRecord.uid, customClaims);

      // Create audit log
      await createAuditLog({
        action: 'USER_CREATED',
        userId: req.user?.uid || 'system',
        service: 'auth-service',
        details: {
          createdUserId: userRecord.uid,
          email: email,
          role: role
        }
      });

      // Publish event
      await publishEvent({
        eventType: 'UserCreated',
        source: 'auth-service',
        correlationId: req.headers['x-correlation-id'],
        data: {
          userId: userRecord.uid,
          email: email,
          role: role,
          createdBy: req.user?.uid
        }
      });

      res.status(201).json({
        success: true,
        user: {
          uid: userRecord.uid,
          email: email,
          displayName: displayName,
          role: role,
          status: 'pending_verification'
        }
      });

    } catch (error) {
      console.error('User creation error:', error);

      if (error.code === 'auth/email-already-exists') {
        return res.status(409).json({
          error: {
            code: 'EMAIL_EXISTS',
            message: 'An account with this email already exists'
          }
        });
      }

      if (error.code === 'auth/invalid-email') {
        return res.status(400).json({
          error: {
            code: 'INVALID_EMAIL',
            message: 'Invalid email address'
          }
        });
      }

      res.status(500).json({
        error: {
          code: 'USER_CREATION_FAILED',
          message: 'Failed to create user account'
        }
      });
    }
  }

  // Update user profile
  async updateUserProfile(req, res) {
    try {
      const { uid } = req.params;
      const updateData = req.body;

      // Authorization check
      if (req.user.uid !== uid && req.user.role !== 'admin') {
        return res.status(403).json({
          error: {
            code: 'ACCESS_DENIED',
            message: 'You can only update your own profile'
          }
        });
      }

      const userProfile = await UserProfile.findByFirebaseUid(uid);
      if (!userProfile) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User profile not found'
          }
        });
      }

      // Restrict role changes to admins only
      if (updateData.role && req.user.role !== 'admin') {
        delete updateData.role;
      }

      // Update user profile
      Object.assign(userProfile, updateData);
      userProfile.updatedBy = req.user.uid;
      await userProfile.save();

      // Update Firebase user if needed
      const firebaseUpdateData = {};
      if (updateData.displayName) firebaseUpdateData.displayName = updateData.displayName;
      if (updateData.phoneNumber) firebaseUpdateData.phoneNumber = updateData.phoneNumber;

      if (Object.keys(firebaseUpdateData).length > 0) {
        await admin.auth().updateUser(uid, firebaseUpdateData);
      }

      // Update custom claims if role changed
      if (updateData.role || updateData.status) {
        const customClaims = {
          role: userProfile.role,
          partyId: userProfile.partyId,
          status: userProfile.status
        };
        await admin.auth().setCustomUserClaims(uid, customClaims);
      }

      // Create audit log
      await createAuditLog({
        action: 'USER_PROFILE_UPDATED',
        userId: req.user.uid,
        service: 'auth-service',
        details: {
          targetUserId: uid,
          updatedFields: Object.keys(updateData)
        }
      });

      res.json({
        success: true,
        user: {
          uid: userProfile.firebaseUid,
          email: userProfile.email,
          displayName: userProfile.displayName,
          role: userProfile.role,
          status: userProfile.status,
          preferences: userProfile.preferences
        }
      });

    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({
        error: {
          code: 'PROFILE_UPDATE_FAILED',
          message: 'Failed to update user profile'
        }
      });
    }
  }

  // Get user profile
  async getUserProfile(req, res) {
    try {
      const { uid } = req.params;

      // Authorization check
      if (req.user.uid !== uid && req.user.role === 'customer') {
        return res.status(403).json({
          error: {
            code: 'ACCESS_DENIED',
            message: 'You can only view your own profile'
          }
        });
      }

      const userProfile = await UserProfile.findByFirebaseUid(uid);
      if (!userProfile) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User profile not found'
          }
        });
      }

      res.json({
        uid: userProfile.firebaseUid,
        email: userProfile.email,
        emailVerified: userProfile.emailVerified,
        phoneNumber: userProfile.phoneNumber,
        phoneVerified: userProfile.phoneVerified,
        displayName: userProfile.displayName,
        photoURL: userProfile.photoURL,
        partyId: userProfile.partyId,
        role: userProfile.role,
        status: userProfile.status,
        preferences: userProfile.preferences,
        lastLoginAt: userProfile.lastLoginAt,
        createdAt: userProfile.createdAt
      });

    } catch (error) {
      console.error('Profile retrieval error:', error);
      res.status(500).json({
        error: {
          code: 'PROFILE_RETRIEVAL_FAILED',
          message: 'Failed to retrieve user profile'
        }
      });
    }
  }

  // Revoke user sessions
  async revokeUserSessions(req, res) {
    try {
      const { uid } = req.params;

      // Only admin or self can revoke sessions
      if (req.user.uid !== uid && req.user.role !== 'admin') {
        return res.status(403).json({
          error: {
            code: 'ACCESS_DENIED',
            message: 'Insufficient permissions to revoke sessions'
          }
        });
      }

      // Revoke all refresh tokens for the user
      await admin.auth().revokeRefreshTokens(uid);

      // Create audit log
      await createAuditLog({
        action: 'USER_SESSIONS_REVOKED',
        userId: req.user.uid,
        service: 'auth-service',
        details: {
          targetUserId: uid
        }
      });

      res.json({
        success: true,
        message: 'All user sessions have been revoked'
      });

    } catch (error) {
      console.error('Session revocation error:', error);
      res.status(500).json({
        error: {
          code: 'SESSION_REVOCATION_FAILED',
          message: 'Failed to revoke user sessions'
        }
      });
    }
  }

  // Delete user account
  async deleteUser(req, res) {
    try {
      const { uid } = req.params;

      // Only admin can delete users
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          error: {
            code: 'ACCESS_DENIED',
            message: 'Only administrators can delete user accounts'
          }
        });
      }

      // Delete from Firebase
      await admin.auth().deleteUser(uid);

      // Delete user profile
      await UserProfile.findOneAndDelete({ firebaseUid: uid });

      // Create audit log
      await createAuditLog({
        action: 'USER_DELETED',
        userId: req.user.uid,
        service: 'auth-service',
        details: {
          deletedUserId: uid
        }
      });

      // Publish event
      await publishEvent({
        eventType: 'UserDeleted',
        source: 'auth-service',
        correlationId: req.headers['x-correlation-id'],
        data: {
          deletedUserId: uid,
          deletedBy: req.user.uid
        }
      });

      res.json({
        success: true,
        message: 'User account deleted successfully'
      });

    } catch (error) {
      console.error('User deletion error:', error);
      res.status(500).json({
        error: {
          code: 'USER_DELETION_FAILED',
          message: 'Failed to delete user account'
        }
      });
    }
  }

  // List users (admin only)
  async listUsers(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          error: {
            code: 'ACCESS_DENIED',
            message: 'Only administrators can list users'
          }
        });
      }

      const {
        offset = 0,
        limit = 20,
        role,
        status,
        search
      } = req.query;

      // Build filter
      const filter = {};
      if (role) filter.role = role;
      if (status) filter.status = status;
      if (search) {
        filter.$or = [
          { email: { $regex: search, $options: 'i' } },
          { displayName: { $regex: search, $options: 'i' } }
        ];
      }

      const users = await UserProfile.find(filter)
        .select('-customClaims -failedLoginAttempts -accountLockedUntil')
        .skip(parseInt(offset))
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

      const totalCount = await UserProfile.countDocuments(filter);

      res.json({
        totalCount,
        rangeStart: parseInt(offset) + 1,
        rangeEnd: Math.min(parseInt(offset) + parseInt(limit), totalCount),
        users: users
      });

    } catch (error) {
      console.error('User listing error:', error);
      res.status(500).json({
        error: {
          code: 'USER_LISTING_FAILED',
          message: 'Failed to retrieve user list'
        }
      });
    }
  }
}

module.exports = new AuthController();
