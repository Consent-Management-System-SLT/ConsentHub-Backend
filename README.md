# ConsentHub Backend - TM Forum Compliant Consent Management System

ConsentHub is a comprehensive, TM Forum-compliant Consent Management System built for SLT Mobitel, following Open Digital Architecture (ODA) principles.

## 🏗️ Architecture

### Microservices Architecture
- **consent-service** (Port 3001) - TMF632 Party Privacy API
- **preference-service** (Port 3002) - Extended TMF632 for notification preferences
- **privacy-notice-service** (Port 3003) - TMF632 PrivacyNotice management
- **agreement-service** (Port 3004) - TMF651 Agreement API
- **event-service** (Port 3005) - TMF669 Event Schema with WebSocket support
- **party-service** (Port 3006) - TMF641 Party Management API
- **auth-service** (Port 3007) - Firebase-based authentication
- **dsar-service** (Port 3008) - TMF632 Extended Data Subject Access Request API
- **api-gateway** (Port 3000) - Single entry point with routing and rate limiting

### Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB 6.0+
- **Authentication**: Firebase Admin SDK
- **Documentation**: OpenAPI 3.0 (Swagger)
- **Containerization**: Docker & Docker Compose
- **Real-time**: WebSocket (for events)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6.0+
- Docker & Docker Compose
- Firebase project with service account

### 1. Clone and Setup
```bash
git clone <repository-url>
cd ConsentHub_Backend
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and configure:
```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/consenhub

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com

# Services
API_GATEWAY_PORT=3000
CONSENT_SERVICE_PORT=3001
PREFERENCE_SERVICE_PORT=3002
# ... other service ports
```

### 3. Database Setup

#### Option A: MongoDB Atlas (Recommended)
1. Create a free account at [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new cluster (M0 free tier for development)
3. Create a database user with read/write permissions
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string and update `.env`:
   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/consenhub?retryWrites=true&w=majority
   ```
6. Initialize the database:
   ```bash
   node setup-atlas.js
   ```

#### Option B: Local MongoDB
```bash
# Start MongoDB locally
docker run -d -p 27017:27017 --name consenhub-mongo mongo:6.0

# Initialize database
mongosh < mongodb-init/init.js
```

### 4. Start Services

#### Option A: Docker Compose (Recommended)
```bash
docker-compose up -d
```

#### Option B: Individual Services
```bash
# Start all services
npm run start:all

# Or start individually
npm run start:consent
npm run start:preference
npm run start:privacy-notice
npm run start:agreement
npm run start:event
npm run start:party
npm run start:auth
npm run start:gateway
```

### 5. Access APIs
- **API Gateway**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api-docs
- **Swagger UI**: http://localhost:8080
- **WebSocket Events**: ws://localhost:3005/ws

## 📋 API Endpoints

### Consent Management (TMF632)
```http
POST   /api/v1/consent/privacyConsent
GET    /api/v1/consent/privacyConsent/party/{partyId}
PATCH  /api/v1/consent/privacyConsent/{id}
PATCH  /api/v1/consent/privacyConsent/{id}/revoke
```

### Preference Management (Extended TMF632)
```http
POST   /api/v1/preference/privacyPreference
GET    /api/v1/preference/privacyPreference/party/{partyId}
PATCH  /api/v1/preference/privacyPreference/{id}
POST   /api/v1/preference/privacyPreference/party/{partyId}/device-token
```

### Privacy Notice Management (TMF632)
```http
POST   /api/v1/privacy-notice/privacyNotice
GET    /api/v1/privacy-notice/privacyNotice
GET    /api/v1/privacy-notice/privacyNotice/active/{category}
POST   /api/v1/privacy-notice/privacyNotice/{id}/version
```

### Agreement Management (TMF651)
```http
POST   /api/v1/agreement/agreement
GET    /api/v1/agreement/agreement/party/{partyId}
PATCH  /api/v1/agreement/agreement/{id}/sign
PATCH  /api/v1/agreement/agreement/{id}/terminate
```

### Event Management (TMF669)
```http
POST   /api/v1/event/events
GET    /api/v1/event/events
GET    /api/v1/event/events/{id}
POST   /api/v1/event/events/subscribe
```

### Party Management (TMF641)
```http
POST   /api/v1/party/party
GET    /api/v1/party/party/{id}
PATCH  /api/v1/party/party/{id}
```

### DSAR Management (TMF632 Extended)
```http
POST   /api/v1/dsar/dsarRequest
GET    /api/v1/dsar/dsarRequest/party/{partyId}
GET    /api/v1/dsar/dsarRequest/{id}
PATCH  /api/v1/dsar/dsarRequest/{id}/status
POST   /api/v1/dsar/dsarRequest/{id}/process-access
POST   /api/v1/dsar/dsarRequest/{id}/process-erasure
GET    /api/v1/dsar/dsarRequest/reports/compliance
```

## 🔐 Authentication & Authorization

### Firebase JWT Authentication
All protected endpoints require a valid Firebase JWT token:
```http
Authorization: Bearer <firebase-jwt-token>
```

### User Roles
- **customer**: Basic user, can manage own data
- **csr**: Customer Service Representative, can manage customer data
- **admin**: Full access to all operations

### Permission Matrix
| Endpoint | Customer | CSR | Admin |
|----------|----------|-----|-------|
| Create Consent | ✓ | ✓ | ✓ |
| View Own Data | ✓ | ✓ | ✓ |
| View All Data | ✗ | ✓ | ✓ |
| Create Privacy Notice | ✗ | ✓ | ✓ |
| Approve Privacy Notice | ✗ | ✗ | ✓ |
| System Admin | ✗ | ✗ | ✓ |

## 📊 Functional Scenarios

### 1. Customer Signup via MySLT
```javascript
// 1. Create party
POST /api/v1/party/party
{
  "partyType": "individual",
  "name": "John Doe",
  "contactInformation": [
    {
      "contactType": "email",
      "contactValue": "john@example.com",
      "isPrimary": true
    }
  ]
}

// 2. Create signup consent
POST /api/v1/consent/privacyConsent
{
  "partyId": "party-uuid",
  "purpose": "service_signup",
  "privacyNoticeId": "general-privacy-notice-id",
  "status": "granted"
}
```

### 2. Router Subsidy Agreement
```javascript
// 1. Create 12-month router agreement
POST /api/v1/agreement/agreement
{
  "name": "12-Month Router Subsidy Agreement",
  "agreementType": "subsidy",
  "partyId": "party-uuid",
  "agreementSpecification": {
    "name": "Router Subsidy Terms",
    "validFor": {
      "startDateTime": "2024-01-01",
      "endDateTime": "2024-12-31"
    },
    "terms": [
      {
        "name": "subsidy_amount",
        "type": "benefit",
        "value": "5000",
        "unit": "LKR"
      }
    ]
  }
}

// 2. Create consent for subsidized router
POST /api/v1/consent/privacyConsent
{
  "partyId": "party-uuid",
  "purpose": "subsidized_router",
  "validityPeriod": {
    "startDateTime": "2024-01-01",
    "endDateTime": "2024-12-31"
  },
  "status": "granted"
}
```

### 3. Colombo-Only Marketing Offer
```javascript
POST /api/v1/consent/privacyConsent
{
  "partyId": "party-uuid",
  "purpose": "location_based_marketing",
  "geoLocation": "LK-Western-Colombo",
  "status": "granted"
}
```

### 4. Consent Revocation
```javascript
PATCH /api/v1/consent/privacyConsent/{consent-id}/revoke
```

## 🎯 Event-Driven Architecture

### Real-time Events (TMF669)
ConsentHub emits events for all significant actions:

```javascript
// Event types
- PrivacyConsentCreated
- PrivacyConsentStatusChanged
- PrivacyConsentRevoked
- PrivacyPreferenceUpdated
- AgreementSigned
- AgreementTerminated
- PartyCreated
```

### WebSocket Integration
```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3005/ws');

// Subscribe to events
ws.send(JSON.stringify({
  type: 'subscribe',
  subscription: {
    eventType: 'PrivacyConsentRevoked'
  }
}));

// Handle events
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event received:', data);
};
```

## 🔍 Monitoring & Logging

### Health Checks
```bash
# Check all services
curl http://localhost:3000/health

# Check individual service
curl http://localhost:3001/health
```

### Audit Logs
All operations are logged in the `auditLogs` collection:
```javascript
{
  "id": "audit-uuid",
  "action": "CREATE_CONSENT",
  "userId": "user-uuid",
  "timestamp": "2024-01-01T10:00:00Z",
  "service": "consent-service",
  "details": {
    "consentId": "consent-uuid",
    "partyId": "party-uuid"
  }
}
```

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
npm test

# Run service-specific tests
cd backend/consent-service && npm test
```

### API Testing
```bash
# Test with curl
curl -X POST http://localhost:3000/api/v1/consent/privacyConsent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "partyId": "test-party-id",
    "purpose": "test_purpose",
    "status": "granted"
  }'
```

## 🐳 Docker Deployment

### Build Images
```bash
# Build all services
docker-compose build

# Build specific service
docker build -t consenhub-consent-service ./backend/consent-service
```

### Production Deployment
```bash
# Production environment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 🔧 Configuration

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/consenhub` |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Required |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | Required |
| `NODE_ENV` | Environment | `development` |
| `API_GATEWAY_PORT` | API Gateway port | `3000` |

### Service Configuration
Each service can be configured via environment variables:
- Database connections
- External service URLs
- Authentication settings
- Logging levels

## 📈 Performance & Scalability

### Database Indexing
- Optimized indexes for common queries
- Compound indexes for complex filters
- TTL indexes for automatic cleanup

### Caching Strategy
- Redis integration ready
- HTTP cache headers
- Database query optimization

### Load Balancing
- Stateless services
- Horizontal scaling ready
- Health check endpoints

## 🛡️ Security

### Data Protection
- Encryption at rest (MongoDB)
- Encryption in transit (HTTPS/WSS)
- Field-level encryption for sensitive data

### Access Control
- JWT-based authentication
- Role-based authorization
- API rate limiting

### Compliance
- GDPR compliance ready
- Data retention policies
- Audit logging
- Right to erasure support

## 🔮 Future Enhancements

### Planned Features
1. **Admin UI**: React-based admin dashboard
2. **Customer Portal**: Self-service portal
3. **Advanced Analytics**: Enhanced reporting and analytics
4. **Multi-tenancy**: Support for multiple organizations
5. **Machine Learning**: Predictive consent analytics

### Integration Points
- **MySLT App**: Mobile app integration
- **CRM Systems**: Customer relationship management
- **Billing Systems**: Invoice and payment integration
- **Marketing Platforms**: Campaign management

## 📞 Support

### Documentation
- OpenAPI/Swagger documentation at `/api-docs`
- Postman collection available
- Integration guides

### Troubleshooting
- Check service health endpoints
- Review audit logs
- Monitor WebSocket connections
- Validate JWT tokens

### Contact
- **Technical Support**: api-support@slt.lk
- **Business Inquiries**: business@slt.lk
- **Documentation**: docs@slt.lk

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/your-feature-name`)
3. Commit changes (`git commit -m 'Add feature name'`)
4. Push to branch (`git push origin feature/your-feature-name`)
5. Open Pull Request

---

**ConsentHub** - Empowering privacy-first digital experiences for SLT Mobitel customers.
