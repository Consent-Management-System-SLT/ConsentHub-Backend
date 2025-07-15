#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('\n🚀 Starting ConsentHub Backend Services...\n');

// Start concurrently with all services
const startServices = spawn('npx', [
    'concurrently', 
    '"npm run start:gateway"', 
    '"npm run start:consent"', 
    '"npm run start:preference"', 
    '"npm run start:privacy-notice"', 
    '"npm run start:agreement"', 
    '"npm run start:event"', 
    '"npm run start:party"', 
    '"npm run start:auth"', 
    '"npm run start:dsar"'
], { stdio: 'inherit', shell: true });

// Display URLs after a delay to ensure services have started
setTimeout(() => {
    console.log('\n' + '='.repeat(80));
    console.log('🌐 CONSENHUB BACKEND - ACCESS URLS');
    console.log('='.repeat(80));
    console.log('\n📊 MAIN ENDPOINTS:');
    console.log('   🔗 API Gateway:           http://localhost:3000');
    console.log('   📚 API Documentation:     http://localhost:3000/api-docs');
    console.log('   ❤️  Health Check:          http://localhost:3000/health');
    console.log('   📡 WebSocket Events:       ws://localhost:3005/ws');
    
    console.log('\n🔧 INDIVIDUAL SERVICE DOCUMENTATION:');
    console.log('   🔐 Consent Service:       http://localhost:3001/api-docs');
    console.log('   ⚙️  Preference Service:    http://localhost:3002/api-docs');
    console.log('   📝 Privacy Notice:        http://localhost:3003/api-docs');
    console.log('   📋 Agreement Service:     http://localhost:3004/api-docs');
    console.log('   🎯 Event Service:         http://localhost:3005/api-docs');
    console.log('   👥 Party Service:         http://localhost:3006/api-docs');
    console.log('   🔑 Auth Service:          http://localhost:3007/api-docs');
    console.log('   📊 DSAR Service:          http://localhost:3008/api-docs');
    
    console.log('\n🔍 HEALTH CHECK ENDPOINTS:');
    console.log('   📈 All Services:          http://localhost:3000/health');
    console.log('   🔐 Consent:               http://localhost:3001/health');
    console.log('   ⚙️  Preference:            http://localhost:3002/health');
    console.log('   📝 Privacy Notice:        http://localhost:3003/health');
    console.log('   📋 Agreement:             http://localhost:3004/health');
    console.log('   🎯 Event:                 http://localhost:3005/health');
    console.log('   👥 Party:                 http://localhost:3006/health');
    console.log('   🔑 Auth:                  http://localhost:3007/health');
    console.log('   📊 DSAR:                  http://localhost:3008/health');
    
    console.log('\n💡 QUICK COMMANDS:');
    console.log('   curl http://localhost:3000/health');
    console.log('   curl http://localhost:3000/api-docs');
    
    console.log('\n🛑 To stop all services: Press Ctrl+C');
    console.log('='.repeat(80));
    console.log('🎉 ConsentHub Backend is ready! Choose any URL above to get started.\n');
}, 5000);

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping all services...');
    startServices.kill('SIGINT');
    process.exit(0);
});

process.on('SIGTERM', () => {
    startServices.kill('SIGTERM');
    process.exit(0);
});

startServices.on('exit', (code) => {
    process.exit(code);
});
