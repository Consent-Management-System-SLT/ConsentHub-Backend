const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://consentuser:12345@consentcluster.ylmrqgl.mongodb.net/consentDB?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI).then(async () => {
  console.log('Connected to MongoDB');
  
  // Get a customer from the database
  const Party = require('../csr-service/models/Party');
  const customer = await Party.findOne({ type: 'individual' });
  
  if (!customer) {
    console.log('No customer found in database');
    process.exit(1);
  }
  
  console.log('Found customer:', customer.name);
  
  // Generate a test JWT token
  const token = jwt.sign(
    { 
      id: customer._id.toString(), 
      name: customer.name,
      email: customer.contactMedium?.find(c => c.type === 'email')?.value || 'test@example.com',
      role: 'customer' 
    },
    process.env.JWT_SECRET || 'your-jwt-secret-key-here',
    { expiresIn: '24h' }
  );
  
  console.log('\n--- TEST CUSTOMER TOKEN ---');
  console.log('Customer ID:', customer._id.toString());
  console.log('Customer Name:', customer.name);
  console.log('Token:', token);
  console.log('\n--- TEST COMMANDS ---');
  console.log('Test health endpoint:');
  console.log('Invoke-WebRequest -Uri "http://localhost:3011/health" -Method GET\n');
  
  console.log('Test authenticated endpoint:');
  console.log(`Invoke-WebRequest -Uri "http://localhost:3011/api/v1/customer/dashboard/summary" -Method GET -Headers @{"Authorization"="Bearer ${token}"}\n`);
  
  console.log('Test get consents:');
  console.log(`Invoke-WebRequest -Uri "http://localhost:3011/api/v1/customer/consents" -Method GET -Headers @{"Authorization"="Bearer ${token}"}\n`);
  
  console.log('Test get preferences:');
  console.log(`Invoke-WebRequest -Uri "http://localhost:3011/api/v1/customer/preferences" -Method GET -Headers @{"Authorization"="Bearer ${token}"}\n`);
  
  process.exit(0);
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});
