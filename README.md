# 🏗️ ConsentHub Backend

<div align="center">

![ConsentHub Backend](https://img.shields.io/badge/ConsentHub-Backend%20Services-orange?style=for-the-badge&logo=server&logoColor=white)

**Enterprise Microservices for Privacy & Consent Management**  
*TMF Forum Compliant • GDPR Ready • Production-Grade*

[![Version](https://img.shields.io/badge/version-1.0.0-green.svg?style=flat-square)](https://github.com/Consent-Management-System-SLT/ConsentHub-Backend)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg?style=flat-square)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg?style=flat-square)](https://www.mongodb.com/atlas)
[![TMF Forum](https://img.shields.io/badge/TMF%20Forum-632%2C%20641%2C%20669-blue.svg?style=flat-square)](https://www.tmforum.org/)

</div>

---

## 📋 **Table of Contents**

- [🎯 Overview](#-overview)
- [🏗️ Architecture](#️-architecture)
- [🔌 Microservices](#-microservices)
- [📡 API Endpoints](#-api-endpoints)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Configuration](#️-configuration)
- [🔒 Security](#-security)
- [📊 Monitoring](#-monitoring)
- [🚀 Deployment](#-deployment)
- [📚 Documentation](#-documentation)
- [🤝 Contributing](#-contributing)

---

## 🎯 **Overview**

ConsentHub Backend is a comprehensive microservices ecosystem designed for enterprise-grade privacy and consent management. Built following **TM Forum Open APIs** and **Open Digital Architecture (ODA)** principles, it provides robust, scalable, and compliant backend services for telecommunications and digital service providers.

### **🎯 Mission**
Deliver a production-ready, TMF Forum-compliant backend infrastructure that handles consent management, privacy governance, and data subject rights with enterprise-scale reliability and performance.

### **📊 System Metrics**
- **14 Microservices** with distinct responsibilities
- **200+ API Endpoints** across all services
- **TMF Forum APIs**: Complete TMF632, TMF641, TMF669 implementation
- **MongoDB Atlas Integration** with real-time data persistence
- **WebSocket Support** for real-time notifications
- **Enterprise Security** with JWT authentication and role-based access

---

## 🏗️ **Architecture**

### **🎯 Microservices Architecture**

```
ConsentHub Backend Ecosystem
├─ 🌐 API Gateway (Port 3001)          # Central routing & authentication
├─ 🔐 Auth Service (Port 3002)         # JWT authentication & user management
├─ 🛡️ Consent Service (Port 3003)      # TMF632 privacy consent management
├─ ⚙️ Preference Service (Port 3004)    # Communication preferences
├─ 📄 Privacy Notice Service (Port 3005) # Privacy policy management
├─ 📊 Analytics Service (Port 3006)     # Consent analytics & reporting
├─ 📋 Agreement Service (Port 3007)     # Digital agreements
├─ 🔔 Event Service (Port 3008)        # TMF669 event management
├─ 👥 Party Service (Port 3009)        # TMF641 party management
├─ 👨‍💼 Admin Service (Port 3010)         # Administrative operations
├─ 👩‍💼 CSR Service (Port 3011)          # Customer service representative tools
├─ 👤 Customer Service (Port 3012)      # Customer-facing operations
├─ 📋 DSAR Service (Port 3013)         # Data Subject Access Rights
└─ 📚 Shared Libraries                  # Common utilities & models
```

### **🔗 Communication Patterns**

#### **Inter-Service Communication**
- **HTTP/REST**: Primary communication protocol
- **Event-Driven**: TMF669 compliant event publishing
- **WebSocket**: Real-time notifications
- **Message Queues**: Asynchronous processing (MongoDB ChangeStreams)

#### **Data Flow Architecture**
```
Frontend → API Gateway → Microservices → MongoDB Atlas
    ↓              ↓           ↓             ↓
WebSocket ←── Event Service ←── Change Streams
```

---

## 🔌 **Microservices**

### **🌐 API Gateway (Core Infrastructure)**
**Port**: 3001 | **Responsibility**: Central routing, authentication, rate limiting

#### **Features**
- ✅ **Request Routing** - Intelligent service discovery
- ✅ **Authentication Gateway** - JWT token validation
- ✅ **Rate Limiting** - Request throttling and protection
- ✅ **CORS Management** - Cross-origin request handling
- ✅ **Load Balancing** - Traffic distribution
- ✅ **Request/Response Logging** - Comprehensive audit trail

#### **Key Endpoints**
```
GET  /health                    # Health check
GET  /api-docs                  # OpenAPI documentation
POST /api/v1/auth/login         # Authentication proxy
GET  /api/v1/services/status    # Service health status
```

### **🔐 Auth Service (Security)**
**Port**: 3002 | **Responsibility**: Authentication, authorization, user management

#### **Features**
- ✅ **JWT Authentication** - Stateless token-based auth
- ✅ **Role-Based Access Control** - Admin/CSR/Customer roles
- ✅ **User Registration** - Account creation and validation
- ✅ **Password Management** - Secure password handling
- ✅ **Session Management** - Token lifecycle management
- ✅ **Multi-Factor Authentication** - Enhanced security (ready)

#### **Key Endpoints**
```
POST /api/v1/auth/register      # User registration
POST /api/v1/auth/login         # User authentication
POST /api/v1/auth/logout        # Session termination
POST /api/v1/auth/refresh       # Token renewal
GET  /api/v1/auth/profile       # User profile
POST /api/v1/auth/verify-token  # Token validation
```

### **🛡️ Consent Service (TMF632 Core)**
**Port**: 3003 | **Responsibility**: Privacy consent lifecycle management

#### **Features**
- ✅ **TMF632 Compliance** - Complete privacy consent API
- ✅ **Consent Lifecycle** - Create, update, grant, revoke, expire
- ✅ **Granular Permissions** - Purpose, channel, duration-specific
- ✅ **Legal Basis Tracking** - GDPR Article 6 compliance
- ✅ **Version Management** - Consent term versioning
- ✅ **Audit Trail** - Complete consent change history

#### **Key Endpoints (TMF632)**
```
GET    /privacyConsent                    # List consents
POST   /privacyConsent                    # Create consent
GET    /privacyConsent/{id}               # Get consent by ID
PATCH  /privacyConsent/{id}               # Update consent
DELETE /privacyConsent/{id}               # Revoke consent
GET    /privacyConsent/party/{partyId}    # Get consents by party
PATCH  /privacyConsent/{id}/grant         # Grant consent
PATCH  /privacyConsent/{id}/revoke        # Revoke consent
GET    /privacyConsent/expired            # Get expired consents
```

### **⚙️ Preference Service (Communication Management)**
**Port**: 3004 | **Responsibility**: Communication preferences and channel management

#### **Features**
- ✅ **Channel Management** - Email, SMS, Push, Phone preferences
- ✅ **Topic Subscriptions** - Granular communication topics
- ✅ **Do Not Disturb** - Time-based communication blocking
- ✅ **Frequency Controls** - Daily, weekly, monthly limits
- ✅ **Real-time Sync** - Instant preference updates
- ✅ **Bulk Operations** - Mass preference management

#### **Key Endpoints**
```
GET    /privacyPreference                 # List preferences
POST   /privacyPreference                 # Create preference
GET    /privacyPreference/{id}            # Get preference by ID
PATCH  /privacyPreference/{id}            # Update preference
DELETE /privacyPreference/{id}            # Delete preference
GET    /privacyPreference/party/{partyId} # Get party preferences
POST   /privacyPreference/bulk            # Bulk preference operations
```

### **📄 Privacy Notice Service (Policy Management)**
**Port**: 3005 | **Responsibility**: Privacy policy and notice management

#### **Features**
- ✅ **Multi-language Support** - English, Sinhala, Tamil
- ✅ **Version Control** - Policy change tracking
- ✅ **Acknowledgment Tracking** - User acceptance records
- ✅ **Jurisdiction Support** - Region-specific notices
- ✅ **Template Management** - Reusable policy templates
- ✅ **Automated Distribution** - Policy update notifications

#### **Key Endpoints**
```
GET    /privacyNotice                     # List privacy notices
POST   /privacyNotice                     # Create privacy notice
GET    /privacyNotice/{id}                # Get notice by ID
PATCH  /privacyNotice/{id}                # Update notice
GET    /privacyNotice/language/{lang}     # Get notices by language
POST   /privacyNotice/{id}/acknowledge    # Acknowledge notice
```

### **👥 Party Service (TMF641 Core)**
**Port**: 3009 | **Responsibility**: Customer and party management

#### **Features**
- ✅ **TMF641 Compliance** - Complete party management API
- ✅ **Customer Profiles** - Comprehensive customer data
- ✅ **Relationship Management** - Party relationships and hierarchies
- ✅ **Contact Information** - Multi-channel contact management
- ✅ **Guardian Relationships** - Parent-child consent relationships
- ✅ **Data Validation** - Comprehensive data integrity checks

#### **Key Endpoints (TMF641)**
```
GET    /party                            # List parties
POST   /party                            # Create party
GET    /party/{id}                       # Get party by ID
PATCH  /party/{id}                       # Update party
DELETE /party/{id}                       # Delete party
GET    /party/{id}/relationships         # Get party relationships
POST   /party/{id}/relationships         # Create relationship
```

### **🔔 Event Service (TMF669 Core)**
**Port**: 3008 | **Responsibility**: Event management and notifications

#### **Features**
- ✅ **TMF669 Compliance** - Complete event management API
- ✅ **Webhook Management** - Event listener registration
- ✅ **Real-time Events** - WebSocket event distribution
- ✅ **Event Types** - Consent, preference, DSAR events
- ✅ **Event Filtering** - Subscription-based filtering
- ✅ **Event History** - Complete event audit trail

#### **Key Endpoints (TMF669)**
```
POST   /hub                              # Register event listener
GET    /hub                              # List event subscriptions
GET    /hub/{id}                         # Get subscription by ID
DELETE /hub/{id}                         # Unsubscribe from events
POST   /event                            # Publish event
GET    /event                            # List events
```

### **📋 DSAR Service (Data Subject Rights)**
**Port**: 3013 | **Responsibility**: GDPR/CCPA data subject access rights

#### **Features**
- ✅ **Request Management** - Data access, portability, erasure, rectification
- ✅ **Automated Processing** - AI-powered request handling
- ✅ **Deadline Tracking** - GDPR 30-day compliance
- ✅ **Data Export** - JSON, CSV, PDF formats
- ✅ **Request Status** - Real-time processing updates
- ✅ **Compliance Reporting** - Automated DSAR analytics

#### **Key Endpoints**
```
GET    /dsarRequest                      # List DSAR requests
POST   /dsarRequest                      # Create DSAR request
GET    /dsarRequest/{id}                 # Get request by ID
PATCH  /dsarRequest/{id}                 # Update request status
POST   /dsarRequest/{id}/process         # Process request
GET    /dsarRequest/{id}/download        # Download processed data
```

### **👨‍💼 Admin Service (Administrative Operations)**
**Port**: 3010 | **Responsibility**: System administration and management

#### **Features**
- ✅ **User Management** - Create, update, delete users
- ✅ **System Analytics** - Consent and preference statistics
- ✅ **Bulk Operations** - Mass data import/export
- ✅ **Compliance Reports** - Automated regulatory reporting
- ✅ **System Configuration** - Global system settings
- ✅ **Audit Log Management** - System activity monitoring

### **👩‍💼 CSR Service (Customer Service Tools)**
**Port**: 3011 | **Responsibility**: Customer service representative functionality

#### **Features**
- ✅ **Customer Search** - Advanced customer lookup
- ✅ **Consent Management** - CSR consent operations
- ✅ **DSAR Processing** - Customer service DSAR handling
- ✅ **Notification Center** - Multi-channel customer notifications
- ✅ **Activity Tracking** - Customer interaction logging
- ✅ **Guardian Approvals** - Minor consent management

---

## 📡 **API Endpoints**

### **🎯 TMF Forum API Implementation**

#### **TMF632 - Party Privacy Management (100% Compliant)**

```http
# Privacy Consent Management
GET    /privacyConsent                    # List privacy consents
POST   /privacyConsent                    # Create privacy consent
GET    /privacyConsent/{id}               # Retrieve privacy consent
PATCH  /privacyConsent/{id}               # Update privacy consent
DELETE /privacyConsent/{id}               # Delete privacy consent

# Privacy Preference Management  
GET    /privacyPreference                 # List privacy preferences
POST   /privacyPreference                 # Create privacy preference
GET    /privacyPreference/{id}            # Retrieve privacy preference
PATCH  /privacyPreference/{id}            # Update privacy preference
DELETE /privacyPreference/{id}            # Delete privacy preference

# Privacy Notice Management
GET    /privacyNotice                     # List privacy notices
POST   /privacyNotice                     # Create privacy notice
GET    /privacyNotice/{id}                # Retrieve privacy notice
PATCH  /privacyNotice/{id}                # Update privacy notice
```

#### **TMF641 - Party Management (100% Compliant)**

```http
# Party Operations
GET    /party                            # List parties
POST   /party                            # Create party
GET    /party/{id}                       # Retrieve party
PATCH  /party/{id}                       # Update party
DELETE /party/{id}                       # Delete party

# Party Relationships
GET    /party/{id}/relationships         # List party relationships
POST   /party/{id}/relationships         # Create party relationship
```

#### **TMF669 - Event Management (100% Compliant)**

```http
# Event Hub Management
POST   /hub                              # Register event listener
GET    /hub                              # List event subscriptions
GET    /hub/{id}                         # Retrieve event subscription
DELETE /hub/{id}                         # Unregister event listener

# Event Operations
POST   /event                            # Create event
GET    /event                            # List events
GET    /event/{id}                       # Retrieve event
```

### **📊 Extended API Endpoints**

#### **Authentication & Authorization**
```http
POST   /api/v1/auth/register             # User registration
POST   /api/v1/auth/login                # User authentication
POST   /api/v1/auth/logout               # User logout
POST   /api/v1/auth/refresh              # Token refresh
GET    /api/v1/auth/profile              # Get user profile
POST   /api/v1/auth/verify-token         # Verify JWT token
```

#### **DSAR Operations**
```http
GET    /api/v1/dsar/requests             # List DSAR requests
POST   /api/v1/dsar/requests             # Create DSAR request
GET    /api/v1/dsar/requests/{id}        # Get DSAR request
PATCH  /api/v1/dsar/requests/{id}        # Update DSAR request
POST   /api/v1/dsar/requests/{id}/process # Process DSAR request
```

#### **Analytics & Reporting**
```http
GET    /api/v1/analytics/consents        # Consent analytics
GET    /api/v1/analytics/preferences     # Preference analytics
GET    /api/v1/analytics/dsar            # DSAR analytics
GET    /api/v1/analytics/compliance      # Compliance reports
```

---

## 🚀 **Quick Start**

### **Prerequisites**
```bash
Node.js >= 18.0.0
npm >= 8.0.0
MongoDB Atlas account
Git
```

### **🔧 Installation & Setup**

#### **1. Clone Repository**
```bash
git clone https://github.com/Consent-Management-System-SLT/ConsentHub-Backend.git
cd ConsentHub-Backend
```

#### **2. Environment Configuration**
```bash
# Copy environment template
cp .env.example .env

# Configure MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/consentDB
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=7d

# Configure service ports
API_GATEWAY_PORT=3001
AUTH_SERVICE_PORT=3002
CONSENT_SERVICE_PORT=3003
PREFERENCE_SERVICE_PORT=3004
# ... other services
```

#### **3. Install Dependencies**
```bash
# Install root dependencies
npm install

# Install all microservice dependencies
npm run install:all
```

#### **4. Database Setup**
```bash
# Initialize MongoDB Atlas
npm run setup:atlas

# Seed initial data
node seedGuardians.js
```

#### **5. Start Services**

##### **Option A: All Services (Recommended)**
```bash
# Start all microservices with orchestrator
npm run start:all
```

##### **Option B: Individual Services**
```bash
# Start API Gateway
npm run start:gateway

# Start individual services (separate terminals)
npm run start:auth
npm run start:consent
npm run start:preference
# ... other services
```

##### **Option C: Development Mode**
```bash
# Start all services in development mode
npm run dev:all
```

### **🔍 Verification**

#### **Service Health Check**
```bash
# Check all services status
curl http://localhost:3001/health

# Check individual service
curl http://localhost:3002/health  # Auth Service
curl http://localhost:3003/health  # Consent Service
```

#### **API Documentation**
- **OpenAPI Docs**: http://localhost:3001/api-docs
- **Health Dashboard**: http://localhost:3001/health
- **Service Status**: http://localhost:3001/api/v1/services/status

---

## ⚙️ **Configuration**

### **🔧 Environment Variables**

#### **Database Configuration**
```bash
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://consentuser:password@cluster.mongodb.net/consentDB
MONGODB_DB_NAME=consentDB
MONGODB_OPTIONS=retryWrites=true&w=majority

# Database Connection Pool
DB_MAX_POOL_SIZE=10
DB_MIN_POOL_SIZE=5
DB_MAX_IDLE_TIME=30000
```

#### **Authentication Configuration**
```bash
# JWT Configuration
JWT_SECRET=your-256-bit-secret-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
JWT_ALGORITHM=HS256

# Authentication Settings
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME=15m
```

#### **Service Configuration**
```bash
# Service Ports
API_GATEWAY_PORT=3001
AUTH_SERVICE_PORT=3002
CONSENT_SERVICE_PORT=3003
PREFERENCE_SERVICE_PORT=3004
PRIVACY_NOTICE_SERVICE_PORT=3005
ANALYTICS_SERVICE_PORT=3006
AGREEMENT_SERVICE_PORT=3007
EVENT_SERVICE_PORT=3008
PARTY_SERVICE_PORT=3009
ADMIN_SERVICE_PORT=3010
CSR_SERVICE_PORT=3011
CUSTOMER_SERVICE_PORT=3012
DSAR_SERVICE_PORT=3013

# Service Discovery
SERVICE_REGISTRY_ENABLED=true
HEALTH_CHECK_INTERVAL=30s
SERVICE_TIMEOUT=10s
```

#### **Security Configuration**
```bash
# CORS Settings
CORS_ORIGIN=http://localhost:5174
CORS_CREDENTIALS=true
CORS_METHODS=GET,POST,PATCH,DELETE,OPTIONS

# Rate Limiting
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=100
RATE_LIMIT_SKIP_SUCCESSFUL=true

# Security Headers
HELMET_ENABLED=true
HTTPS_REDIRECT=false  # Set to true in production
```

### **📊 Monitoring Configuration**

#### **Logging Configuration**
```bash
# Winston Logger Settings
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE_ENABLED=true
LOG_FILE_PATH=./logs/combined.log
LOG_ERROR_FILE=./logs/error.log
LOG_MAX_SIZE=20m
LOG_MAX_FILES=14d
```

#### **Performance Monitoring**
```bash
# Application Performance
ENABLE_METRICS=true
METRICS_ENDPOINT=/metrics
ENABLE_TRACING=true
TRACE_SAMPLE_RATE=0.1

# Health Checks
HEALTH_CHECK_TIMEOUT=5s
HEALTH_CHECK_INTERVAL=30s
```

---

## 🔒 **Security**

### **🛡️ Authentication & Authorization**

#### **JWT Token Security**
- **Algorithm**: HMAC SHA-256 (HS256)
- **Token Expiry**: 7 days (configurable)
- **Refresh Tokens**: 30 days (configurable)
- **Automatic Renewal**: Before expiration
- **Secure Storage**: HTTP-only cookies (production)

#### **Role-Based Access Control (RBAC)**

| **Role** | **Permissions** | **Access Level** |
|----------|----------------|------------------|
| **Admin** | Full system access | Create, Read, Update, Delete |
| **CSR** | Customer management | Read, Update (limited) |
| **Customer** | Self-service only | Read own data, Update preferences |
| **Guardian** | Minor management | Manage child consents |

#### **API Security Middleware**
```javascript
// Authentication Middleware
app.use('/api/v1/protected', authenticateJWT);

// Authorization Middleware
app.use('/api/v1/admin', authorizeRole('admin'));
app.use('/api/v1/csr', authorizeRole(['admin', 'csr']));

// Rate Limiting
app.use('/api/v1', rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
```

### **🔐 Data Protection**

#### **Encryption Standards**
- **Data at Rest**: AES-256 encryption
- **Data in Transit**: TLS 1.2+ (HTTPS)
- **Password Hashing**: bcrypt (12 rounds)
- **PII Encryption**: Field-level encryption for sensitive data

#### **Input Validation & Sanitization**
```javascript
// Joi Validation Schemas
const consentSchema = Joi.object({
  partyId: Joi.string().uuid().required(),
  purpose: Joi.string().valid('marketing', 'analytics', 'essential').required(),
  status: Joi.string().valid('granted', 'revoked', 'pending').required(),
  expirationDate: Joi.date().iso().min('now').optional()
});

// Express Validator
app.use(express.json({ limit: '10mb' }));
app.use(mongoSanitize()); // NoSQL injection prevention
app.use(xss()); // XSS protection
```

### **🚫 Security Headers & Protection**

#### **Helmet.js Security Headers**
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));
```

#### **CORS Configuration**
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5174',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 📊 **Monitoring**

### **📈 Health Monitoring**

#### **Service Health Checks**
```javascript
// Health Check Endpoint
app.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    checks: {
      database: await checkDatabaseHealth(),
      memory: checkMemoryUsage(),
      cpu: checkCPUUsage()
    }
  };
  res.status(200).json(health);
});
```

#### **Database Monitoring**
```javascript
// MongoDB Connection Monitoring
mongoose.connection.on('connected', () => {
  logger.info('MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});
```

### **📊 Performance Metrics**

#### **Application Metrics**
- **Request Rate**: Requests per second
- **Response Time**: Average, 95th, 99th percentile
- **Error Rate**: 4xx and 5xx error percentages
- **Throughput**: Data transfer rates
- **Concurrent Users**: Active session tracking

#### **System Metrics**
- **CPU Usage**: Process and system CPU utilization
- **Memory Usage**: Heap and non-heap memory consumption
- **Database Performance**: Query execution times
- **Network I/O**: Inbound and outbound traffic

### **📋 Logging & Audit Trail**

#### **Winston Logger Configuration**
```javascript
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

#### **Audit Trail Events**
- **Authentication Events**: Login, logout, token refresh
- **Authorization Events**: Permission checks, role changes
- **Data Access Events**: CRUD operations on sensitive data
- **Consent Events**: Consent grants, revocations, updates
- **DSAR Events**: Request creation, processing, completion
- **System Events**: Service starts, stops, errors

---

## 🚀 **Deployment**

### **🌐 Production Deployment**

#### **Docker Deployment**

##### **Individual Service Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose service port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start service
CMD ["node", "server.js"]
```

##### **Docker Compose (All Services)**
```yaml
version: '3.8'

services:
  api-gateway:
    build:
      context: .
      dockerfile: Dockerfile.gateway
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
    depends_on:
      - mongodb
    restart: unless-stopped

  auth-service:
    build:
      context: ./backend/auth-service
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped

  consent-service:
    build:
      context: ./backend/consent-service
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
    restart: unless-stopped

  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

volumes:
  mongodb_data:
```

#### **Kubernetes Deployment**

##### **Service Deployment Manifest**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: consenthub-api-gateway
  labels:
    app: consenthub-api-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: consenthub-api-gateway
  template:
    metadata:
      labels:
        app: consenthub-api-gateway
    spec:
      containers:
      - name: api-gateway
        image: consenthub/api-gateway:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: consenthub-secrets
              key: mongodb-uri
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
```

### **☁️ Cloud Deployment Options**

#### **AWS Deployment**
- **ECS/Fargate**: Containerized microservices
- **EKS**: Kubernetes orchestration
- **Application Load Balancer**: Traffic distribution
- **RDS/DocumentDB**: Managed database options
- **CloudWatch**: Monitoring and logging

#### **Google Cloud Platform**
- **Cloud Run**: Serverless containers
- **GKE**: Kubernetes engine
- **Cloud Load Balancing**: Global load balancing
- **Cloud Firestore/MongoDB Atlas**: Database options
- **Cloud Logging**: Centralized logging

#### **Microsoft Azure**
- **Container Instances**: Quick container deployment
- **AKS**: Azure Kubernetes Service
- **Application Gateway**: Load balancing
- **Cosmos DB**: Multi-model database
- **Azure Monitor**: Application insights

### **🔧 CI/CD Pipeline**

#### **GitHub Actions Workflow**
```yaml
name: Deploy ConsentHub Backend

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    - run: npm ci
    - run: npm test
    - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Build Docker images
      run: |
        docker build -t consenthub/api-gateway:${{ github.sha }} .
        docker build -t consenthub/auth-service:${{ github.sha }} ./backend/auth-service
    - name: Push to registry
      run: |
        docker push consenthub/api-gateway:${{ github.sha }}
        docker push consenthub/auth-service:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - name: Deploy to Kubernetes
      run: |
        kubectl set image deployment/api-gateway api-gateway=consenthub/api-gateway:${{ github.sha }}
        kubectl rollout status deployment/api-gateway
```

---

## 📚 **Documentation**

### **📖 API Documentation**

#### **OpenAPI 3.0 Specification**
- **Interactive Docs**: http://localhost:3001/api-docs
- **Swagger UI**: Complete API exploration interface
- **Schema Definitions**: All request/response models
- **Authentication**: JWT bearer token examples
- **Error Codes**: Comprehensive error documentation

#### **Postman Collections**
```json
{
  "info": {
    "name": "ConsentHub Backend APIs",
    "description": "Complete API collection for ConsentHub Backend services"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{jwt_token}}",
        "type": "string"
      }
    ]
  }
}
```

### **🏗️ Architecture Documentation**

#### **Service Architecture Diagrams**
- **System Overview**: High-level architecture
- **Data Flow Diagrams**: Request/response flows
- **Database Schema**: Entity relationship diagrams
- **Security Architecture**: Authentication and authorization flows

#### **API Design Patterns**
- **RESTful Design**: Resource-based URL structure
- **HTTP Methods**: Proper verb usage (GET, POST, PATCH, DELETE)
- **Status Codes**: Appropriate HTTP status code usage
- **Error Handling**: Consistent error response format
- **Pagination**: Cursor-based pagination implementation
- **Versioning**: URL path versioning strategy

### **📋 Operational Documentation**

#### **Deployment Guides**
- **Local Development Setup**: Complete setup instructions
- **Docker Deployment**: Container orchestration
- **Kubernetes Deployment**: Production-grade orchestration
- **Cloud Deployment**: Platform-specific deployment guides

#### **Monitoring & Troubleshooting**
- **Health Check Guide**: Service health monitoring
- **Performance Tuning**: Optimization recommendations
- **Common Issues**: Troubleshooting guide
- **Log Analysis**: Log format and analysis techniques

---

## 🤝 **Contributing**

### **🛠️ Development Guidelines**

#### **Code Standards**
- **JavaScript Style**: ESLint + Prettier configuration
- **API Design**: RESTful conventions and OpenAPI documentation
- **Error Handling**: Consistent error response format
- **Logging**: Structured logging with Winston
- **Testing**: Unit tests with Jest, integration tests
- **Documentation**: JSDoc comments for all functions

#### **Branch Strategy**
```bash
main                    # Production branch
├── develop            # Development integration
├── feature/feature-name    # Feature branches
├── hotfix/fix-name    # Production hotfixes
└── release/version    # Release preparation
```

#### **Commit Convention**
```bash
feat: add new consent management endpoint
fix: resolve authentication token expiry issue
docs: update API documentation for TMF632
test: add unit tests for preference service
refactor: optimize database connection pooling
```

### **🔧 Development Setup**

#### **Local Development Environment**
```bash
# Clone repository
git clone https://github.com/Consent-Management-System-SLT/ConsentHub-Backend.git

# Install dependencies
npm install
npm run install:all

# Setup environment
cp .env.example .env

# Start development servers
npm run dev:all
```

#### **Testing**
```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage

# Run specific service tests
cd backend/auth-service && npm test
```

### **📋 Pull Request Process**

1. **Create Feature Branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Implement Changes**
- Follow coding standards
- Add appropriate tests
- Update documentation

3. **Commit Changes**
```bash
git commit -m "feat: implement your feature"
```

4. **Submit Pull Request**
- Complete PR template
- Request code review
- Ensure CI/CD passes

5. **Code Review Process**
- Peer review required
- Address feedback
- Maintain test coverage

---

### **🔧 Maintenance Schedule**

#### **Regular Maintenance**
- **Security Updates**: Monthly security patch updates
- **Dependency Updates**: Quarterly dependency reviews
- **Performance Optimization**: Bi-annual performance reviews
- **Database Maintenance**: Weekly database optimization
- **Backup Verification**: Daily backup integrity checks

#### **Monitoring & Alerts**
- **Service Health**: 24/7 monitoring with alerts
- **Performance Metrics**: Real-time performance tracking
- **Error Tracking**: Automated error detection and reporting
- **Capacity Planning**: Monthly capacity analysis
- **Security Scanning**: Weekly vulnerability assessments

---

## 🏆 **Achievement Summary**

### **✅ Technical Excellence**

ConsentHub Backend represents a comprehensive microservices ecosystem that delivers:

- **✅ Complete TMF Forum Compliance** - TMF632, TMF641, TMF669 implementation
- **✅ Enterprise-Grade Security** - JWT authentication, RBAC, encryption
- **✅ Scalable Architecture** - 14 microservices with clear separation of concerns
- **✅ Production-Ready Infrastructure** - Docker, Kubernetes, CI/CD ready
- **✅ Comprehensive API Coverage** - 200+ endpoints across all services
- **✅ Real-time Capabilities** - WebSocket integration for live updates
- **✅ Regulatory Compliance** - GDPR, CCPA, PDPA implementation
- **✅ Monitoring & Observability** - Complete logging, metrics, and health checks

### **🌟 Innovation Highlights**

- **🚀 Microservices Excellence** - Domain-driven design with clear service boundaries
- **🔒 Security-First Approach** - Zero-trust architecture with comprehensive protection
- **📊 Real-time Processing** - Event-driven architecture with instant notifications
- **🌍 Multi-tenant Ready** - Scalable design for multiple organizations
- **🛡️ Compliance Automation** - Automated GDPR, CCPA compliance workflows
- **📈 Performance Optimized** - Efficient database queries and caching strategies

---

<div align="center">

**🌟 Enterprise-Grade Microservices Architecture**

[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.0+-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/atlas)
[![JWT](https://img.shields.io/badge/JWT-Authentication-orange.svg)](https://jwt.io/)
[![TMF Forum](https://img.shields.io/badge/TMF%20Forum-Compliant-blue.svg)](https://www.tmforum.org/)

**SLT Mobitel ConsentHub Team** 🇱🇰

---

*© 2025 SLT Mobitel. All rights reserved. Built for enterprise privacy management.*

</div>
