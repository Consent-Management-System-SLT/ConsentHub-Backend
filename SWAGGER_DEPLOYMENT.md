# ConsentHub API Documentation Deployment

This directory contains the deployment setup for ConsentHub's Swagger/OpenAPI documentation.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install --package-lock-only --save express swagger-ui-express yamljs cors
   ```

2. **Start the documentation server:**
   ```bash
   npm run start:docs
   ```

3. **Access the documentation:**
   - Swagger UI: http://localhost:8080/api-docs
   - OpenAPI YAML: http://localhost:8080/openapi.yaml
   - OpenAPI JSON: http://localhost:8080/openapi.json

## Deployment Options

### 1. Local Development
```bash
# Start with nodemon for development
npm run dev:docs
```

### 2. Production Deployment
```bash
# Use PM2 for production
npm install -g pm2
pm2 start swagger-server.js --name "consenhub-docs"
```

### 3. Docker Deployment
```bash
# Build and run with Docker
docker build -t consenhub-docs -f swagger.dockerfile .
docker run -p 8080:8080 consenhub-docs
```

### 4. Cloud Deployment

#### Heroku
```bash
# Deploy to Heroku
heroku create consenhub-api-docs
git subtree push --prefix=. heroku main
```

#### Vercel
```bash
# Deploy to Vercel
vercel --prod
```

#### Netlify
```bash
# Deploy to Netlify
netlify deploy --prod --dir=.
```

## Sharing with Team

### Option 1: Local Network
- Start the server: `npm run start:docs`
- Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Share: `http://YOUR_IP:8080`

### Option 2: Cloud Deployment
- Deploy to any cloud platform above
- Share the public URL

### Option 3: GitHub Pages
- Push to a separate branch
- Enable GitHub Pages
- Share the GitHub Pages URL

## Environment Variables

- `SWAGGER_PORT`: Port for the documentation server (default: 8080)
- `NODE_ENV`: Environment (development/production)

## Features

- ✅ Clean, modern UI
- ✅ Try-it-out functionality
- ✅ Authentication support
- ✅ Downloadable specs (YAML/JSON)
- ✅ Mobile responsive
- ✅ Search functionality
- ✅ CORS enabled
- ✅ Health check endpoint

## Customization

The Swagger UI can be customized in `swagger-server.js`:
- Custom CSS styling
- Logo and branding
- Color scheme
- Layout options
