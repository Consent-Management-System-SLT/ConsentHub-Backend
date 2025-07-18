const jwt = require('jsonwebtoken');

// Real customer ID from database
const testCustomerId = 'eea08c27-9f0f-4f8e-bba0-5a49f3fe8be5';

const token = jwt.sign(
  { 
    id: testCustomerId, 
    name: 'Robert Johnson',
    email: 'robert.johnson@example.com',
    role: 'customer' 
  },
  'your-jwt-secret-key-here',
  { expiresIn: '24h' }
);

console.log('Real Customer JWT Token:');
console.log(token);
console.log('\nCustomer ID:', testCustomerId);
console.log('\nTest commands:');
console.log(`Invoke-WebRequest -Uri "http://localhost:3011/api/v1/customer/dashboard/summary" -Method GET -Headers @{"Authorization"="Bearer ${token}"}`);
console.log(`Invoke-WebRequest -Uri "http://localhost:3011/api/v1/customer/consents" -Method GET -Headers @{"Authorization"="Bearer ${token}"}`);
console.log(`Invoke-WebRequest -Uri "http://localhost:3011/api/v1/customer/preferences" -Method GET -Headers @{"Authorization"="Bearer ${token}"}`);
