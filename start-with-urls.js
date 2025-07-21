const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const axios = require('axios').default;

/**
 * ConsentHub Backend Services Orchestrator
 * Starts all microservices in the correct order with health checks
 */

class ServiceOrchestrator {
  constructor() {
    this.services = [
      // Core infrastructure services (start first)
      { name: 'API Gateway', path: 'backend/api-gateway', port: 3001, priority: 1, color: '\x1b[34m' },
      { name: 'Auth Service', path: 'backend/auth-service', port: 3002, priority: 1, color: '\x1b[35m' },
      
      // Foundation services
      { name: 'Event Service', path: 'backend/event-service', port: 3008, priority: 2, color: '\x1b[33m' },
      { name: 'Party Service', path: 'backend/party-service', port: 3009, priority: 2, color: '\x1b[32m' },
      
      // Core business services
      { name: 'Consent Service', path: 'backend/consent-service', port: 3003, priority: 3, color: '\x1b[31m' },
      { name: 'Preference Service', path: 'backend/preference-service', port: 3004, priority: 3, color: '\x1b[36m' },
      { name: 'Privacy Notice Service', path: 'backend/privacy-notice-service', port: 3005, priority: 3, color: '\x1b[94m' },
      
      // Advanced services
      { name: 'Analytics Service', path: 'backend/analytics-service', port: 3006, priority: 4, color: '\x1b[95m' },
      { name: 'Agreement Service', path: 'backend/agreement-service', port: 3007, priority: 4, color: '\x1b[93m' },
      { name: 'DSAR Service', path: 'backend/dsar-service', port: 3010, priority: 4, color: '\x1b[96m' },
      
      // UI services (optional)
      { name: 'Customer Service', path: 'backend/customer-service', port: 3011, priority: 5, color: '\x1b[97m' },
      { name: 'CSR Service', path: 'backend/csr-service', port: 3012, priority: 5, color: '\x1b[90m' },
    ];
    
    this.runningServices = new Map();
    this.startTime = Date.now();
    this.maxStartupTime = 120000; // 2 minutes
  }

  log(message, color = '\x1b[0m') {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${color}[${timestamp}] ${message}\x1b[0m`);
  }

  async checkPort(port) {
    try {
      const response = await axios.get(`http://localhost:${port}/health`, { timeout: 2000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async waitForService(service, maxWait = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      if (await this.checkPort(service.port)) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return false;
  }

  startService(service) {
    return new Promise((resolve, reject) => {
      const servicePath = path.join(process.cwd(), service.path);
      
      // Check if service directory exists
      if (!fs.existsSync(servicePath)) {
        this.log(`❌ Service directory not found: ${servicePath}`, service.color);
        resolve(false);
        return;
      }

      // Check if package.json exists
      if (!fs.existsSync(path.join(servicePath, 'package.json'))) {
        this.log(`❌ package.json not found for ${service.name}`, service.color);
        resolve(false);
        return;
      }

      this.log(`🚀 Starting ${service.name}...`, service.color);

      // Start the service
      const child = spawn('npm', ['start'], {
        cwd: servicePath,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        env: { ...process.env, PORT: service.port }
      });

      // Store reference
      this.runningServices.set(service.name, {
        process: child,
        service: service,
        started: false,
        healthy: false
      });

      // Handle service output
      child.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          this.log(`${service.name}: ${output}`, service.color);
        }
      });

      child.stderr.on('data', (data) => {
        const error = data.toString().trim();
        if (error && !error.includes('ExperimentalWarning')) {
          this.log(`${service.name} Error: ${error}`, '\x1b[91m');
        }
      });

      child.on('close', (code) => {
        if (code !== 0) {
          this.log(`❌ ${service.name} exited with code ${code}`, '\x1b[91m');
          this.runningServices.delete(service.name);
        }
      });

      child.on('error', (error) => {
        this.log(`❌ Failed to start ${service.name}: ${error.message}`, '\x1b[91m');
        reject(error);
      });

      // Wait for service to be ready
      setTimeout(async () => {
        const isReady = await this.waitForService(service, 20000);
        
        if (isReady) {
          this.log(`✅ ${service.name} is ready on port ${service.port}`, '\x1b[92m');
          const serviceInfo = this.runningServices.get(service.name);
          if (serviceInfo) {
            serviceInfo.started = true;
            serviceInfo.healthy = true;
          }
        } else {
          this.log(`⚠️  ${service.name} started but health check failed`, '\x1b[93m');
        }
        
        resolve(isReady);
      }, 3000);
    });
  }

  async startServiceGroup(priority) {
    const servicesInGroup = this.services.filter(s => s.priority === priority);
    
    if (servicesInGroup.length === 0) return;

    this.log(`\n📦 Starting Priority ${priority} Services...`, '\x1b[96m');
    
    // Start all services in this priority group
    const startPromises = servicesInGroup.map(service => this.startService(service));
    const results = await Promise.all(startPromises);
    
    const successCount = results.filter(r => r).length;
    this.log(`✅ Priority ${priority}: ${successCount}/${servicesInGroup.length} services started`, '\x1b[92m');
    
    // Wait a bit between priority groups
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  async startAllServices() {
    this.log('🚀 ConsentHub Backend Services Starting...', '\x1b[96m');
    this.log(`📊 Total Services: ${this.services.length}`, '\x1b[94m');
    
    // Get unique priorities
    const priorities = [...new Set(this.services.map(s => s.priority))].sort();
    
    // Start services by priority
    for (const priority of priorities) {
      await this.startServiceGroup(priority);
    }
    
    // Final health check
    this.log('\n🔍 Performing final health checks...', '\x1b[96m');
    await this.performHealthChecks();
    
    // Display summary
    this.displaySummary();
    
    // Setup monitoring
    this.startMonitoring();
  }

  async performHealthChecks() {
    const healthPromises = this.services.map(async (service) => {
      const isHealthy = await this.checkPort(service.port);
      return { service: service.name, healthy: isHealthy, port: service.port };
    });

    const results = await Promise.all(healthPromises);
    
    const healthy = results.filter(r => r.healthy);
    const unhealthy = results.filter(r => !r.healthy);
    
    if (healthy.length > 0) {
      this.log(`\n✅ Healthy Services (${healthy.length}):`, '\x1b[92m');
      healthy.forEach(r => this.log(`   - ${r.service} (port ${r.port})`, '\x1b[92m'));
    }
    
    if (unhealthy.length > 0) {
      this.log(`\n⚠️  Unhealthy Services (${unhealthy.length}):`, '\x1b[93m');
      unhealthy.forEach(r => this.log(`   - ${r.service} (port ${r.port})`, '\x1b[93m'));
    }

    return { healthy: healthy.length, total: results.length };
  }

  displaySummary() {
    const runningCount = this.runningServices.size;
    const totalTime = Math.round((Date.now() - this.startTime) / 1000);
    
    this.log('\n' + '='.repeat(60), '\x1b[96m');
    this.log('🎉 ConsentHub Backend Services Summary', '\x1b[96m');
    this.log('='.repeat(60), '\x1b[96m');
    this.log(`📊 Services Running: ${runningCount}/${this.services.length}`, '\x1b[94m');
    this.log(`⏱️  Total Startup Time: ${totalTime}s`, '\x1b[94m');
    this.log('', '');
    this.log('🌐 Service URLs:', '\x1b[96m');
    
    this.services.forEach(service => {
      if (this.runningServices.has(service.name)) {
        this.log(`   - ${service.name}: http://localhost:${service.port}`, '\x1b[92m');
      }
    });
    
    this.log('', '');
    this.log('📚 Key Endpoints:', '\x1b[96m');
    this.log('   - API Gateway: http://localhost:3001', '\x1b[92m');
    this.log('   - Health Check: http://localhost:3001/health', '\x1b[92m');
    this.log('   - API Docs: http://localhost:3001/api-docs', '\x1b[92m');
    this.log('', '');
    this.log('⚡ Ready for frontend connection!', '\x1b[92m');
    this.log('   Start frontend with: npm run dev', '\x1b[94m');
    this.log('='.repeat(60), '\x1b[96m');
  }

  startMonitoring() {
    // Monitor services every 30 seconds
    const monitorInterval = setInterval(async () => {
      const healthStatus = await this.performHealthChecks();
      
      if (healthStatus.healthy < healthStatus.total) {
        this.log(`⚠️  ${healthStatus.total - healthStatus.healthy} services are unhealthy`, '\x1b[93m');
      }
    }, 30000);

    // Cleanup on exit
    process.on('SIGINT', () => {
      this.log('\n🛑 Shutting down services...', '\x1b[93m');
      clearInterval(monitorInterval);
      
      this.runningServices.forEach((serviceInfo, name) => {
        this.log(`   Stopping ${name}...`, '\x1b[93m');
        serviceInfo.process.kill('SIGTERM');
      });
      
      setTimeout(() => {
        this.log('👋 All services stopped. Goodbye!', '\x1b[92m');
        process.exit(0);
      }, 2000);
    });

    process.on('SIGTERM', () => {
      this.runningServices.forEach((serviceInfo) => {
        serviceInfo.process.kill('SIGTERM');
      });
      process.exit(0);
    });
  }
}

// Start the orchestrator if this file is run directly
if (require.main === module) {
  const orchestrator = new ServiceOrchestrator();
  orchestrator.startAllServices().catch(error => {
    console.error('❌ Failed to start services:', error);
    process.exit(1);
  });
}

module.exports = ServiceOrchestrator;
