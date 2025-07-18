const jwt = require('jsonwebtoken');

// Generate a test JWT token with a known customer ID
const testCustomerId = '67399b7f8e7c2f2d4a1e5678'; // Sample customer ID

const token = jwt.sign(
  { 
    id: testCustomerId, 
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'customer' 
  },
  'your-jwt-secret-key-here',
  { expiresIn: '24h' }
);

console.log('Test Customer JWT Token:');
console.log(token);
console.log('\nTest with PowerShell:');
console.log(`Invoke-WebRequest -Uri "http://localhost:3011/api/v1/customer/dashboard/summary" -Method GET -Headers @{"Authorization"="Bearer ${token}"}`);
