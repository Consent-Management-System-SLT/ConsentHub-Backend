#!/bin/bash

# ConsentHub API Documentation Deployment Script
# Usage: ./deploy-docs.sh [platform]
# Platforms: local, docker, vercel, heroku, netlify

PLATFORM=${1:-local}

echo "🚀 Deploying ConsentHub API Documentation to $PLATFORM..."

case $PLATFORM in
  "local")
    echo "📱 Starting local development server..."
    npm install
    npm run start:docs
    ;;
    
  "docker")
    echo "🐳 Building and running Docker container..."
    docker build -t consenhub-docs -f swagger.dockerfile .
    docker run -d -p 8080:8080 --name consenhub-docs consenhub-docs
    echo "✅ Docker container running at http://localhost:8080"
    ;;
    
  "vercel")
    echo "▲ Deploying to Vercel..."
    npx vercel --prod
    ;;
    
  "heroku")
    echo "🟪 Deploying to Heroku..."
    # Create a temporary package.json for Heroku
    cp swagger-package.json package.json
    git add .
    git commit -m "Deploy docs to Heroku"
    heroku create consenhub-api-docs-$(date +%s)
    git push heroku main
    # Restore original package.json
    git checkout package.json
    ;;
    
  "netlify")
    echo "🌊 Deploying to Netlify..."
    npx netlify deploy --prod --dir=.
    ;;
    
  *)
    echo "❌ Unknown platform: $PLATFORM"
    echo "Available platforms: local, docker, vercel, heroku, netlify"
    exit 1
    ;;
esac

echo "✅ Deployment complete!"
