# 📚 ConsentHub Swagger Documentation Hosting Guide

This guide explains different ways to host the ConsentHub API documentation using Swagger UI.

## 🚀 Hosting Options

### 1. **Local Development (Current Setup)**
Each microservice already hosts its own Swagger documentation:

```bash
# Start all services with URL display
npm run start:all

# Individual service documentation URLs:
# - API Gateway: http://localhost:3000/api-docs
# - Consent Service: http://localhost:3001/api-docs
# - Preference Service: http://localhost:3002/api-docs
# - Privacy Notice Service: http://localhost:3003/api-docs
# - Agreement Service: http://localhost:3004/api-docs
# - Event Service: http://localhost:3005/api-docs
# - Party Service: http://localhost:3006/api-docs
# - Auth Service: http://localhost:3007/api-docs
# - DSAR Service: http://localhost:3008/api-docs
```

### 2. **Standalone Swagger Server** ⭐ *Recommended*
Host all API documentation in a single, unified interface:

```bash
# Start standalone documentation server
npm run swagger:standalone

# Access at: http://localhost:8080/api-docs
```

**Features:**
- ✅ Unified documentation for all services
- ✅ Multi-API dropdown selector
- ✅ Static file serving
- ✅ Health check endpoint
- ✅ Production-ready

### 3. **Docker Container**
Containerized documentation server for easy deployment:

```bash
# Build and run Docker container
npm run swagger:docker

# Or manually:
docker build -f swagger.dockerfile -t consenhub-swagger .
docker run -p 8080:8080 consenhub-swagger

# Access at: http://localhost:8080/api-docs
```

### 4. **GitHub Pages** (Free Static Hosting)
Automatically deploy documentation to GitHub Pages:

1. **Enable GitHub Pages** in your repository settings
2. **Push to main branch** - the workflow will automatically deploy
3. **Access at:** `https://your-username.github.io/your-repo-name`

**Features:**
- ✅ Free hosting
- ✅ Automatic deployment on push
- ✅ CDN-backed (fast loading)
- ✅ Custom domain support

### 5. **Vercel Deployment** (Serverless)
Deploy to Vercel for production hosting:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
npm run swagger:deploy

# Or manually:
vercel --prod -f vercel-swagger.json
```

**Features:**
- ✅ Serverless deployment
- ✅ Global CDN
- ✅ Custom domain support
- ✅ Free tier available

### 6. **Manual Static Hosting**
For any static hosting provider (Netlify, AWS S3, etc.):

```bash
# Generate static files
mkdir swagger-static
cp docs/index.html swagger-static/
cp docs/openapi.yaml swagger-static/

# Upload swagger-static folder to your hosting provider
```

## 🛠️ Configuration Options

### Environment Variables
```bash
# Standalone server port
SWAGGER_PORT=8080

# Service URLs for multi-API setup
API_GATEWAY_URL=http://localhost:3000
CONSENT_SERVICE_URL=http://localhost:3001
# ... etc
```

### Customization
Edit `swagger-standalone.js` to customize:
- **Theme and styling**
- **Additional API endpoints**
- **Authentication setup**
- **Custom plugins**

## 📦 Production Deployment

### For Production Use:
1. **Choose hosting method** (Vercel recommended for simplicity)
2. **Update server URLs** in `docs/openapi.yaml`
3. **Configure authentication** if needed
4. **Set up monitoring** and health checks

### Security Considerations:
- ✅ Use HTTPS in production
- ✅ Configure CORS properly
- ✅ Add rate limiting if needed
- ✅ Consider authentication for sensitive APIs

## 🔧 Troubleshooting

### Common Issues:
1. **Port conflicts:** Change `SWAGGER_PORT` environment variable
2. **CORS errors:** Update CORS configuration in services
3. **API not loading:** Check service URLs in configuration
4. **Build failures:** Ensure all dependencies are installed

### Debug Commands:
```bash
# Check service health
curl http://localhost:8080/health

# Test API endpoint
curl http://localhost:8080/api-docs/openapi.json

# View logs
npm run swagger:standalone --verbose
```

## 📋 Quick Start Checklist

- [ ] Choose hosting method
- [ ] Install dependencies: `npm install`
- [ ] Update API URLs in configuration
- [ ] Test locally: `npm run swagger:standalone`
- [ ] Deploy to chosen platform
- [ ] Verify all endpoints work
- [ ] Set up monitoring/alerts

## 🎯 Recommended Setup

For **development:** Use `npm run start:all` for individual service docs
For **production:** Use standalone server with Vercel deployment

```bash
# Development
npm run start:all

# Production
npm run swagger:standalone
# Then deploy to Vercel or your preferred platform
```

This setup provides the best balance of functionality, performance, and ease of use! 🚀
