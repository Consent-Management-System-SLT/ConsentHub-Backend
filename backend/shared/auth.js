const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  if (!admin.apps.length) {
    // Check if Firebase environment variables are properly configured
    if (!process.env.FIREBASE_PROJECT_ID || 
        !process.env.FIREBASE_PRIVATE_KEY || 
        !process.env.FIREBASE_CLIENT_EMAIL) {
      console.warn('Firebase environment variables not configured. Running without Firebase authentication.');
      return false;
    }

    try {
      const serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
        token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      
      console.log('Firebase Admin SDK initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Firebase:', error.message);
      return false;
    }
  }
  return true;
};

// Middleware to verify Firebase JWT token or handle demo tokens
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Handle demo tokens for development
    if (token.includes('demo-token')) {
      let role = 'customer';
      if (token.includes('admin-demo-token')) {
        role = 'admin';
      } else if (token.includes('csr-demo-token')) {
        role = 'csr';
      } else if (token.includes('customer-demo-token')) {
        role = 'customer';
      }
      
      req.user = {
        uid: `demo-user-${role}`,
        email: `${role}@demo.com`,
        role: role,
        isDemoUser: true,
      };
      
      console.log(`Demo authentication successful for role: ${role}`);
      return next();
    }
    
    // Try Firebase authentication for real tokens
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || 'customer', // Default role
    };

    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to check user roles
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

module.exports = {
  initializeFirebase,
  verifyFirebaseToken,
  checkRole,
};
