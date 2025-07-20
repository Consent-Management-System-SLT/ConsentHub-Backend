# DSAR Service Quick Start Guide

## Overview
The DSAR (Data Subject Access Request) service implements TMF632 Extended API for handling data subject rights requests in compliance with GDPR, PDP Act, and other privacy regulations.

## Features
- **Request Types**: Access, Rectification, Erasure, Portability, Objection, Restriction, Withdraw Consent
- **Multi-format Export**: JSON, CSV, PDF, XML
- **Compliance Tracking**: Automated response time monitoring
- **Workflow Management**: Assignment, approvals, and status tracking
- **Audit Trail**: Complete request lifecycle logging

## API Endpoints

### Create DSAR Request
```http
POST /api/v1/dsar/dsarRequest
Authorization: Bearer <firebase-jwt-token>
Content-Type: application/json

{
  "partyId": "party-123",
  "requestType": "access",
  "requestDetails": {
    "description": "Request for complete personal data export",
    "dataCategories": ["personal_data", "consent_data", "preference_data"],
    "format": "json"
  },
  "urgentRequest": false,
  "contactPreference": "email"
}
```

### Get DSAR Requests by Party
```http
GET /api/v1/dsar/dsarRequest/party/{partyId}
Authorization: Bearer <firebase-jwt-token>
```

### Update Request Status (CSR/Admin)
```http
PATCH /api/v1/dsar/dsarRequest/{id}/status
Authorization: Bearer <firebase-jwt-token>
Content-Type: application/json

{
  "status": "in_progress",
  "processingNotes": "Identity verification completed, processing data extraction",
  "assignedTo": "csr-user-123"
}
```

### Process Data Access Request
```http
POST /api/v1/dsar/dsarRequest/{id}/process-access
Authorization: Bearer <firebase-jwt-token>
```

### Process Data Erasure Request
```http
POST /api/v1/dsar/dsarRequest/{id}/process-erasure
Authorization: Bearer <firebase-jwt-token>
Content-Type: application/json

{
  "confirmation": true
}
```

### Get Compliance Report
```http
GET /api/v1/dsar/dsarRequest/reports/compliance?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <firebase-jwt-token>
```

## Request Types

### Data Access (Article 15)
- **Purpose**: Provide copy of personal data
- **Response**: Structured data export in requested format
- **Timeline**: 30 days (7 days if urgent)

### Data Rectification (Article 16)
- **Purpose**: Correct inaccurate personal data
- **Response**: Confirmation of corrections made
- **Timeline**: 30 days

### Data Erasure (Article 17)
- **Purpose**: Delete personal data (Right to be Forgotten)
- **Response**: Confirmation of deletion
- **Timeline**: 30 days
- **Restrictions**: Legal obligations, public interest

### Data Portability (Article 20)
- **Purpose**: Transfer data to another controller
- **Response**: Structured, machine-readable format
- **Timeline**: 30 days

### Object to Processing (Article 21)
- **Purpose**: Stop processing for legitimate interests
- **Response**: Cessation of processing or compelling grounds
- **Timeline**: 30 days

### Restrict Processing (Article 18)
- **Purpose**: Temporarily halt processing
- **Response**: Confirmation of restriction
- **Timeline**: 30 days

### Withdraw Consent (Article 7)
- **Purpose**: Revoke previously given consent
- **Response**: Immediate cessation of consent-based processing
- **Timeline**: Immediate

## Status Workflow

```
pending → in_progress → completed
   ↓           ↓
rejected    cancelled
```

## Role-Based Access

### Customer
- Create DSAR requests for own data
- View own request status
- Download own data exports

### CSR (Customer Service Representative)
- View all DSAR requests
- Update request status
- Process data access requests
- Assign requests to team members

### Admin
- Full DSAR management access
- Process data erasure requests
- Generate compliance reports
- Configure system settings

## Data Collection

The DSAR service automatically collects data from:
- **Party Service**: Customer profiles and contact information
- **Consent Service**: All consent records and history
- **Preference Service**: Communication preferences and settings
- **Agreement Service**: Legal agreements and signatures
- **Event Service**: Activity logs and audit trails

## Compliance Features

### GDPR Compliance
- **Article 12**: Transparent information and communication
- **Article 13-14**: Information obligations
- **Article 15-22**: Data subject rights
- **Article 32**: Security of processing

### PDP Act Compliance
- **Section 28**: Data subject rights
- **Section 29**: Response timelines
- **Section 30**: Data portability

### Response Time Monitoring
- Automatic deadline calculation
- Escalation alerts for overdue requests
- Extension tracking with justification
- Compliance rate reporting

## Security Features

- **Identity Verification**: Multiple verification methods
- **Secure Data Export**: Encrypted downloads with expiry
- **Audit Logging**: Complete request lifecycle tracking
- **Access Control**: Role-based permissions
- **Data Anonymization**: Safe deletion processes

## Error Handling

### Common Error Codes
- `400`: Validation error (invalid request format)
- `401`: Unauthorized (invalid or missing JWT token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found (request or party not found)
- `429`: Too many requests (rate limiting)
- `500`: Internal server error

### Best Practices
1. Always verify identity before processing requests
2. Document all processing decisions
3. Maintain clear communication with requestors
4. Escalate complex cases to supervisors
5. Monitor compliance metrics regularly

## Testing

### Sample Test Cases
```bash
# Create test DSAR request
curl -X POST http://localhost:3000/api/v1/dsar/dsarRequest \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "partyId": "test-party-123",
    "requestType": "access",
    "requestDetails": {
      "description": "Test data access request",
      "format": "json"
    }
  }'

# Check service health
curl http://localhost:3008/health
```

## Configuration

### Environment Variables
- `MONGODB_URI`: Database connection string
- `PORT`: Service port (default: 3008)
- `NODE_ENV`: Environment (development/production)
- `EVENT_SERVICE_URL`: Event service URL
- `CONSENT_SERVICE_URL`: Consent service URL
- `PREFERENCE_SERVICE_URL`: Preference service URL
- `AGREEMENT_SERVICE_URL`: Agreement service URL
- `PARTY_SERVICE_URL`: Party service URL

### Database Indexes
The service automatically creates optimized indexes for:
- Request lookup by party ID
- Status-based filtering
- Date range queries
- Compliance reporting

## Monitoring

### Health Check
```http
GET /health
```

### API Documentation
```http
GET /api-docs
```

### Metrics to Monitor
- Request volume by type
- Average response time
- Compliance rate
- Overdue requests
- Error rates

## Support

For technical support or questions:
- **API Documentation**: http://localhost:3008/api-docs
- **Health Check**: http://localhost:3008/health
- **Technical Support**: api-support@slt.lk
