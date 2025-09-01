#!/usr/bin/env node

/**
 * Environment Variable Encryption Script
 * Run this script to generate encrypted versions of sensitive environment variables
 * 
 * Usage: node encryptEnvVars.js
 */

const { encryptValue, getSecureEnvVar } = require('./utils/envEncryption');

// List of sensitive environment variables to encrypt
const SENSITIVE_VARS = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'SESSION_SECRET',
  'INTERNAL_API_KEY',
  'SMTP_USER',
  'SMTP_PASS',
  'FIREBASE_PRIVATE_KEY'
];

console.log('🔐 Environment Variable Encryption Tool');
console.log('=======================================\n');

// Set encryption base key if not already set
if (!process.env.ENCRYPTION_BASE_KEY) {
  process.env.ENCRYPTION_BASE_KEY = 'ConsentHub-Production-Key-2025';
}

console.log('Current environment variables that should be encrypted:\n');

SENSITIVE_VARS.forEach(varName => {
  const originalValue = process.env[varName];
  
  if (originalValue) {
    const encryptedValue = encryptValue(originalValue);
    console.log(`${varName}:`);
    console.log(`  Original: ${originalValue.substring(0, 20)}...`);
    console.log(`  Encrypted: ${encryptedValue}`);
    console.log(`  Verification: ${getSecureEnvVar(varName) === originalValue ? '✅ Valid' : '❌ Invalid'}`);
    console.log('');
  } else {
    console.log(`${varName}: Not set in current environment\n`);
  }
});

console.log('\n📋 Secure .env template with encrypted values:\n');
console.log('# ConsentHub Backend - Secure Environment Configuration');
console.log('# IMPORTANT: Set ENCRYPTION_BASE_KEY in production environment');
console.log('ENCRYPTION_BASE_KEY=ConsentHub-Production-Key-2025');
console.log('');

SENSITIVE_VARS.forEach(varName => {
  const originalValue = process.env[varName];
  if (originalValue) {
    const encryptedValue = encryptValue(originalValue);
    console.log(`${varName}=${encryptedValue}`);
  } else {
    console.log(`${varName}=your-encrypted-value-here`);
  }
});

console.log('\n🔒 Security Notes:');
console.log('1. Store ENCRYPTION_BASE_KEY in a secure environment variable');
console.log('2. Never commit unencrypted sensitive data to version control');
console.log('3. Use different ENCRYPTION_BASE_KEY for different environments');
console.log('4. Regularly rotate sensitive credentials');
