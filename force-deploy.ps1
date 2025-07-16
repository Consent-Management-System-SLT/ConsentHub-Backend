#!/usr/bin/env powershell

# Force deploy Swagger to GitHub Pages
Write-Host "🚀 Forcing GitHub Pages deployment..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "docs/index.html")) {
    Write-Host "❌ Error: docs/index.html not found. Please run from project root." -ForegroundColor Red
    exit 1
}

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not in a git repository." -ForegroundColor Red
    exit 1
}

# Create a temporary branch for deployment
Write-Host "📂 Creating temporary deployment branch..." -ForegroundColor Yellow
git checkout -b temp-gh-pages-deploy

# Remove any existing README.md in docs
if (Test-Path "docs/README.md") {
    Remove-Item "docs/README.md" -Force
    Write-Host "🗑️ Removed conflicting README.md from docs folder" -ForegroundColor Yellow
}

# Add and commit changes
git add -A
git commit -m "Force deploy Swagger UI to GitHub Pages"

# Push to main to trigger GitHub Actions
git checkout main
git merge temp-gh-pages-deploy
git push origin main

# Clean up temporary branch
git branch -d temp-gh-pages-deploy

Write-Host "✅ Deployment triggered! Check GitHub Actions tab for progress." -ForegroundColor Green
Write-Host "🌐 Your documentation will be available at:" -ForegroundColor Cyan
Write-Host "   https://consent-management-system-slt.github.io/ConsentHub-Backend/" -ForegroundColor Blue
Write-Host "⏰ Allow 2-3 minutes for deployment to complete." -ForegroundColor Yellow
