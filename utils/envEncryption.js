/**
 * Environment Variable Encryption Utility
 * Encrypts and decrypts sensitive environment variables
 */

const crypto = require('crypto');

// Use a key derived from a combination of environment-specific values
const getEncryptionKey = () => {
  // In production, this should come from a secure key management service
  const baseKey = process.env.ENCRYPTION_BASE_KEY || 'fallback-key-change-in-production';
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  // Create a consistent 32-byte key
  return crypto.createHash('sha256').update(`${baseKey}-${nodeEnv}`).digest('hex').substring(0, 32);
};

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Encrypts a sensitive value
 */
function encryptValue(text) {
  if (!text) return text;
  
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher(ALGORITHM, key);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV + encrypted data, both in hex
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    return text; // Return original if encryption fails
  }
}

/**
 * Decrypts a sensitive value
 */
function decryptValue(encryptedText) {
  if (!encryptedText || !encryptedText.includes(':')) {
    return encryptedText; // Return as-is if not encrypted format
  }
  
  try {
    const key = getEncryptionKey();
    const parts = encryptedText.split(':');
    
    if (parts.length !== 2) {
      return encryptedText; // Return as-is if invalid format
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];
    
    const decipher = crypto.createDecipher(ALGORITHM, key);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedText; // Return original if decryption fails
  }
}

/**
 * Safely gets an environment variable, decrypting if necessary
 */
function getSecureEnvVar(key, defaultValue = '') {
  const value = process.env[key] || defaultValue;
  
  // If the value looks encrypted (contains colon separator), decrypt it
  if (value.includes(':') && value.length > 32) {
    return decryptValue(value);
  }
  
  return value;
}

/**
 * Masks sensitive values for logging
 */
function maskForLogging(value, showChars = 4) {
  if (!value || value.length <= showChars * 2) {
    return '***MASKED***';
  }
  
  return `${value.substring(0, showChars)}***${value.substring(value.length - showChars)}`;
}

/**
 * Environment variable validator
 */
function validateRequiredEnvVars(requiredVars) {
  const missing = [];
  
  for (const varName of requiredVars) {
    const value = getSecureEnvVar(varName);
    if (!value) {
      missing.push(varName);
    }
  }
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    return false;
  }
  
  return true;
}

module.exports = {
  encryptValue,
  decryptValue,
  getSecureEnvVar,
  maskForLogging,
  validateRequiredEnvVars
};
