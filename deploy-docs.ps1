# ConsentHub API Documentation Deployment Script (PowerShell)
# Usage: .\deploy-docs.ps1 [platform]
# Platforms: local, docker, vercel, heroku, netlify

param(
    [string]$Platform = "local"
)

Write-Host "🚀 Deploying ConsentHub API Documentation to $Platform..." -ForegroundColor Green

switch ($Platform) {
    "local" {
        Write-Host "📱 Starting local development server..." -ForegroundColor Yellow
        npm install
        npm run start:docs
    }
    
    "docker" {
        Write-Host "🐳 Building and running Docker container..." -ForegroundColor Blue
        docker build -t consenhub-docs -f swagger.dockerfile .
        docker run -d -p 8080:8080 --name consenhub-docs consenhub-docs
        Write-Host "✅ Docker container running at http://localhost:8080" -ForegroundColor Green
    }
    
    "vercel" {
        Write-Host "▲ Deploying to Vercel..." -ForegroundColor Magenta
        npx vercel --prod
    }
    
    "heroku" {
        Write-Host "🟪 Deploying to Heroku..." -ForegroundColor DarkMagenta
        # Create a temporary package.json for Heroku
        Copy-Item swagger-package.json package.json
        git add .
        git commit -m "Deploy docs to Heroku"
        $timestamp = Get-Date -Format "yyyyMMddHHmmss"
        heroku create "consenhub-api-docs-$timestamp"
        git push heroku main
        # Restore original package.json
        git checkout package.json
    }
    
    "netlify" {
        Write-Host "🌊 Deploying to Netlify..." -ForegroundColor Cyan
        npx netlify deploy --prod --dir=.
    }
    
    default {
        Write-Host "❌ Unknown platform: $Platform" -ForegroundColor Red
        Write-Host "Available platforms: local, docker, vercel, heroku, netlify"
        exit 1
    }
}

Write-Host "✅ Deployment complete!" -ForegroundColor Green
