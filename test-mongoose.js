const mongoose = require('mongoose');

async function testSimpleConnection() {
  try {
    console.log('🔧 Testing simple Mongoose connection...');
    
    // Connect directly to MongoDB with minimal options
    await mongoose.connect('mongodb://localhost:27017/consenhub', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Mongoose connected successfully');
    
    // Test a simple find operation
    const TestSchema = new mongoose.Schema({ name: String });
    const TestModel = mongoose.model('Test', TestSchema);
    
    console.log('🔍 Testing database query...');
    const result = await TestModel.find().limit(1);
    console.log('✅ Query successful:', result.length, 'results');
    
    // Test actual collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Available collections:', collections.map(c => c.name));
    
    // Test privacyconsents collection specifically
    const PrivacyConsentSchema = new mongoose.Schema({
      id: String,
      partyId: String,
      status: String
    });
    const PrivacyConsent = mongoose.model('PrivacyConsent', PrivacyConsentSchema);
    
    console.log('🔍 Testing privacyconsents collection...');
    const consents = await PrivacyConsent.find().limit(1);
    console.log('✅ Privacy consents found:', consents.length);
    if (consents.length > 0) {
      console.log('📄 Sample consent:', consents[0]);
    }
    
    await mongoose.connection.close();
    console.log('🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testSimpleConnection();
