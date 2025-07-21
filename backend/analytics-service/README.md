# ConsentHub Analytics Service

## Overview

The ConsentHub Analytics Service is a comprehensive TMF669-compliant analytics and reporting microservice that provides real-time insights, compliance monitoring, and performance tracking for the ConsentHub Privacy Management Platform.

## Features

### 🎯 Core Analytics Capabilities
- **Consent Analytics Dashboard**: Real-time consent metrics, conversion rates, and purpose-based analysis
- **Compliance Monitoring**: GDPR, CCPA, PDP compliance scoring and audit readiness
- **Performance Tracking**: API response times, system health, and uptime monitoring
- **Trend Analysis**: Historical trends, seasonal patterns, and predictive insights
- **Real-time Metrics**: Live system status, active users, and current activity

### 🔧 Technical Features
- TMF669 Event Management API compliance
- Multi-jurisdiction support (GDPR, CCPA, PDP, PIPEDA, LGPD)
- Automated report generation (PDF, CSV, Excel)
- Role-based access control
- Rate limiting and security headers
- Comprehensive audit trails

### 📊 Dashboard Components
1. **Executive Summary**: Overall compliance scores and key metrics
2. **Consent Metrics**: Grant/revoke rates, channel performance, purpose analysis
3. **Compliance Status**: DSAR processing times, audit readiness, regulatory scores
4. **System Health**: API performance, uptime, resource utilization
5. **Predictive Analytics**: Trend forecasting and recommendation engine

## API Endpoints

### Analytics Dashboard
```
GET /analytics/consent          # Consent analytics dashboard
GET /analytics/compliance       # Compliance and audit metrics  
GET /analytics/performance      # System performance metrics
GET /analytics/trends          # Trend analysis over time
GET /analytics/realtime        # Real-time system metrics
GET /analytics/dashboard       # Consolidated dashboard data
```

### Reporting & Export
```
POST /analytics/report         # Generate custom reports
GET /analytics/export/:format  # Export data (CSV, JSON, Excel)
GET /analytics/health          # Service health status
```

### TMF669 Compliant Endpoints
```
GET /tmf-api/privacyManagement/v1/analytics/*  # All endpoints available via TMF path
```

## Data Models

### ConsentAnalytics
Stores aggregated consent metrics with TMF669 compliance:
- Consent conversion rates by purpose and channel
- Time-series data for trend analysis
- Dimensional filtering (jurisdiction, business unit, channel)
- Performance optimization through pre-calculated metrics

### ComplianceReport
Comprehensive compliance reporting with regulatory framework support:
- DSAR processing compliance (Articles 15-22)
- Cross-border transfer compliance
- Breach notification compliance
- Training and awareness metrics
- Third-party processor agreements

### PerformanceMetrics
System performance and health monitoring:
- Service-level metrics for all microservices
- Database performance tracking
- System resource utilization
- Health scoring and alerting
- Capacity planning recommendations

## Architecture

### Service Design
```
analytics-service/
├── controllers/
│   └── analyticsController.js      # Main analytics logic
├── models/
│   ├── ConsentAnalytics.js         # Analytics data model
│   ├── ComplianceReport.js         # Compliance reporting model
│   └── PerformanceMetrics.js       # Performance metrics model
├── routes/
│   └── analyticsRoutes.js          # API routing
├── server.js                       # Service entry point
├── package.json                    # Dependencies
└── README.md                       # Documentation
```

### Dependencies Integration
- **Event Service**: Consumes TMF669 events for real-time analytics
- **Consent Service**: Aggregates consent grant/revoke patterns
- **DSAR Service**: Tracks data subject request processing
- **Party Service**: Analyzes customer demographics and segments
- **Preference Service**: Communication preference analytics

## Installation & Setup

### Prerequisites
- Node.js 16.0.0 or higher
- MongoDB 4.4 or higher
- Redis (optional, for caching)

### Environment Variables
```bash
ANALYTICS_PORT=3006
MONGODB_URI=mongodb://localhost:27017/consenthub
NODE_ENV=development
JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:3000
```

### Installation
```bash
# Navigate to analytics service directory
cd backend/analytics-service

# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## Usage Examples

### Get Consent Analytics Dashboard
```javascript
GET /analytics/consent?timeframe=30d&jurisdiction=EU

{
  "timeframe": "30d",
  "jurisdiction": "EU",
  "generatedAt": "2024-01-15T10:00:00.000Z",
  "metrics": {
    "consent": {
      "summary": {
        "totalConsents": 15420,
        "grantedConsents": 12850,
        "revokedConsents": 2570,
        "conversionRate": 83
      },
      "byPurpose": [...],
      "channelPerformance": [...],
      "lifecycle": {...}
    }
  }
}
```

### Generate Compliance Report
```javascript
POST /analytics/report

{
  "reportType": "compliance",
  "timeframe": "90d",
  "format": "pdf",
  "filters": {
    "jurisdiction": "EU",
    "framework": "GDPR"
  }
}
```

### Export Analytics Data
```javascript
GET /analytics/export/csv?timeframe=30d&dataType=consent

# Returns CSV download with consent analytics data
```

## Security & Compliance

### Authentication & Authorization
- JWT-based authentication required for all endpoints
- Role-based access control (Admin, Manager, Compliance, Technical)
- Rate limiting: 100 requests per 15 minutes per IP

### Data Protection
- Helmet.js security headers
- CORS protection with whitelist
- Request/response logging with privacy considerations
- Audit trail for all analytics access

### Regulatory Compliance
- **GDPR Article 5(2)**: Accountability through comprehensive audit trails
- **GDPR Article 30**: Records of processing activities
- **CCPA Section 1798.185**: Consumer privacy audits
- **PDP Act**: Data protection compliance monitoring

## Performance Optimization

### Caching Strategy
- Redis caching for frequently accessed metrics
- Pre-calculated aggregations for dashboard performance
- Efficient MongoDB indexes for time-series queries

### Monitoring & Alerting
- Real-time system health monitoring
- Performance threshold alerting
- Compliance deviation notifications
- Capacity planning recommendations

## Development

### Testing
```bash
npm test                # Run test suite
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

### Code Quality
```bash
npm run lint           # ESLint checking
npm run lint:fix       # Auto-fix linting issues
```

### API Documentation
Access comprehensive API documentation at `/api-docs` endpoint when service is running.

## Support & Maintenance

### Monitoring Endpoints
- `GET /health`: Service health check
- `GET /analytics/realtime`: Current system status
- Performance metrics available via `/analytics/performance`

### Troubleshooting
1. **High Response Times**: Check database connection and index efficiency
2. **Memory Issues**: Monitor aggregation pipeline complexity
3. **Compliance Alerts**: Review DSAR processing times and consent expiry tracking

## Contributing

Please refer to the main ConsentHub project guidelines for contributing to the analytics service.

## License

MIT License - see the main project LICENSE file for details.

---

**ConsentHub Analytics Service** - Comprehensive privacy analytics and compliance reporting for the modern data-driven enterprise.
