#!/usr/bin/env node

/**
 * MongoDB Atlas Cleanup Script for ConsentHub
 * This script removes unnecessary collections and keeps only the core ConsentHub collections
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function cleanupDatabase() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'consentDB';

  if (!uri) {
    console.error('❌ MONGODB_URI environment variable is required');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const db = client.db(dbName);

    // Core collections that should be kept
    const coreCollections = [
      'privacyConsents',
      'privacyPreferences', 
      'privacyNotices',
      'privacyAgreements',
      'parties',
      'events',
      'dsarRequests',
      'auditLogs'
    ];

    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log(`🔍 Found ${collections.length} collections in database`);

    // Collections to remove (duplicates and unnecessary ones)
    const collectionsToRemove = collections
      .map(col => col.name)
      .filter(name => !coreCollections.includes(name));

    console.log(`\n📋 Core collections to keep (${coreCollections.length}):`);
    for (const collection of coreCollections) {
      const exists = collections.some(col => col.name === collection);
      console.log(`  ${exists ? '✅' : '❌'} ${collection}`);
    }

    console.log(`\n🗑️  Collections to remove (${collectionsToRemove.length}):`);
    for (const collection of collectionsToRemove) {
      console.log(`  🔸 ${collection}`);
    }

    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will permanently delete the above collections!');
    console.log('💡 Make sure you have backups if needed.');
    
    // For safety, we'll just list what would be removed
    // Uncomment the lines below if you want to actually delete
    
    /*
    console.log('\n🔄 Starting cleanup...');
    
    for (const collectionName of collectionsToRemove) {
      try {
        await db.collection(collectionName).drop();
        console.log(`✅ Dropped collection: ${collectionName}`);
      } catch (error) {
        console.log(`⚠️  Could not drop collection ${collectionName}: ${error.message}`);
      }
    }
    */

    console.log('\n🎉 Cleanup analysis completed!');
    console.log('\n📝 To actually perform the cleanup:');
    console.log('1. Uncomment the cleanup section in cleanup-atlas.js');
    console.log('2. Run the script again: node cleanup-atlas.js');
    console.log('\n💡 Or manually delete collections from Atlas UI');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the cleanup
cleanupDatabase().catch(console.error);
