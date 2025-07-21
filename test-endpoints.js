#!/usr/bin/env node

/**
 * Quick test script for render-server.js endpoints
 * Run this to test all the endpoints your frontend needs
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = 'eyJpZCI6IjYiLCJlbWFpbCI6Im9qaXRoYXJhamFwYWs';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'x-correlation-id': 'test-correlation-id'
};

async function testEndpoint(method, endpoint, data = null) {
  try {
    console.log(`\n🧪 Testing ${method} ${endpoint}`);
    
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    console.log(`✅ Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
    
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status || error.code} - ${error.message}`);
    if (error.response?.data) {
      console.log(`📄 Error Response:`, error.response.data);
    }
  }
}

async function runTests() {
  console.log('🚀 Testing ConsentHub Backend Endpoints');
  console.log('=' .repeat(50));
  
  // Health checks
  await testEndpoint('GET', '/health');
  await testEndpoint('GET', '/api-docs');
  
  // Service health checks
  await testEndpoint('GET', '/api/v1/consent/health');
  await testEndpoint('GET', '/api/v1/party/health');
  
  // Customer dashboard endpoints (the ones that were failing)
  await testEndpoint('GET', '/api/v1/customer/dashboard/overview');
  await testEndpoint('GET', '/api/v1/customer/dashboard/profile');
  await testEndpoint('GET', '/api/v1/customer/dashboard/consents');
  
  // Consent endpoints
  await testEndpoint('GET', '/api/v1/consent');
  await testEndpoint('GET', '/api/v1/consent?status=granted&category=marketing');
  await testEndpoint('GET', '/api/v1/consent/consent_1');
  
  // Test POST consent
  await testEndpoint('POST', '/api/v1/consent', {
    customerId: '6',
    category: 'test',
    purpose: 'Testing consent creation',
    status: 'granted'
  });
  
  // Test PUT consent
  await testEndpoint('PUT', '/api/v1/consent/consent_1', {
    status: 'withdrawn'
  });
  
  console.log('\n✅ All tests completed!');
  console.log('\nIf you see mostly ✅ marks, your backend is ready for deployment!');
  console.log('If you see ❌ marks, check the server is running: npm start');
}

// Run the tests
runTests().catch(console.error);
