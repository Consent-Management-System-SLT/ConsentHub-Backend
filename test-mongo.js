const { MongoClient } = require('mongodb');

async function testMongoConnection() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('consenhub');
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📋 Collections:', collections.map(c => c.name));
    
    // Check consent collection
    const consentCollection = db.collection('privacyConsents');
    const consentCount = await consentCollection.countDocuments();
    console.log('🔐 Privacy consents count:', consentCount);
    
    if (consentCount > 0) {
      const sampleConsent = await consentCollection.findOne();
      console.log('📄 Sample consent:', JSON.stringify(sampleConsent, null, 2));
    }
    
    // Check parties collection
    const partyCollection = db.collection('parties');
    const partyCount = await partyCollection.countDocuments();
    console.log('👥 Parties count:', partyCount);
    
    // Check preferences collection
    const preferencesCollection = db.collection('privacyPreferences');
    const preferencesCount = await preferencesCollection.countDocuments();
    console.log('⚙️ Privacy preferences count:', preferencesCount);
    
    // Check DSAR collection
    const dsarCollection = db.collection('dsarRequests');
    const dsarCount = await dsarCollection.countDocuments();
    console.log('📋 DSAR requests count:', dsarCount);
    
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
  } finally {
    await client.close();
  }
}

testMongoConnection();
