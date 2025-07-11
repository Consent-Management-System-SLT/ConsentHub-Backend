#!/bin/bash

# Build script for ConsentHub Backend on Render

echo "🚀 Starting ConsentHub Backend build process..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

echo "🔧 Installing service dependencies..."

# Install dependencies for each service
services=(
  "shared"
  "api-gateway"
  "consent-service"
  "preference-service"
  "privacy-notice-service"
  "agreement-service"
  "event-service"
  "party-service"
  "auth-service"
  "dsar-service"
)

for service in "${services[@]}"; do
  if [ -d "backend/$service" ]; then
    echo "📦 Installing dependencies for $service..."
    cd "backend/$service"
    npm install
    cd "../.."
  else
    echo "⚠️  Directory backend/$service not found, skipping..."
  fi
done

echo "✅ Build process completed successfully!"
