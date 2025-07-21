#!/usr/bin/env node

/**
 * Test script for render-server.js
 * Validates that the server starts and responds correctly
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testServer() {
  console.log('🧪 Testing ConsentHub Render Server...\n');

  const tests = [
    { name: 'Health Check', url: '/health' },
    { name: 'API Docs', url: '/api-docs' },
    { name: 'Consent Service', url: '/api/v1/consent' },
    { name: 'Party Service', url: '/api/v1/party' },
    { name: 'Consent Health', url: '/api/v1/consent/health' },
    { name: 'Party Health', url: '/api/v1/party/health' },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const response = await axios.get(`${BASE_URL}${test.url}`, { timeout: 5000 });
      if (response.status === 200) {
        console.log(`✅ ${test.name}: PASSED (${response.status})`);
        passed++;
      } else {
        console.log(`❌ ${test.name}: FAILED (${response.status})`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Server is ready for deployment.');
    process.exit(0);
  } else {
    console.log('⚠️ Some tests failed. Please check the server configuration.');
    process.exit(1);
  }
}

// Handle server not running
process.on('unhandledRejection', (error) => {
  if (error.code === 'ECONNREFUSED') {
    console.log('❌ Server not running. Please start the server first:');
    console.log('   npm start');
    process.exit(1);
  } else {
    console.error('Test error:', error.message);
    process.exit(1);
  }
});

testServer();
