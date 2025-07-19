const { MongoClient } = require('mongodb');

async function initializeTestData() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('consenhub');
    
    // Initialize collections with test data to prevent buffering timeout
    
    // Consent collection - Mongoose expects "privacyconsents" (lowercase, pluralized)
    const consentCollection = db.collection('privacyconsents');
    await consentCollection.insertMany([
      {
        id: 'consent-test-1',
        partyId: 'party-test-1',
        status: 'granted',
        purpose: 'marketing',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    console.log('✅ Created test consent records');
    
    // Preferences collection - Mongoose expects "privacypreferences" 
    const preferencesCollection = db.collection('privacypreferences');
    await preferencesCollection.insertMany([
      {
        id: 'pref-test-1',
        partyId: 'party-test-1',
        notificationPreferences: { email: true, sms: false },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    console.log('✅ Created test preference records');
    
    // Party collection - Mongoose expects "parties" (correct)
    const partyCollection = db.collection('parties');
    await partyCollection.insertMany([
      {
        id: 'party-test-1',
        partyType: 'individual',
        name: 'Test User',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    console.log('✅ Created test party records');
    
    // DSAR collection - Mongoose expects "dsarrequests"
    const dsarCollection = db.collection('dsarrequests');
    await dsarCollection.insertMany([
      {
        id: 'dsar-test-1',
        partyId: 'party-test-1',
        requestType: 'access',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    console.log('✅ Created test DSAR records');
    
    console.log('🎉 Test data initialization complete!');
    
  } catch (error) {
    console.error('❌ Error initializing test data:', error);
  } finally {
    await client.close();
  }
}

initializeTestData();
