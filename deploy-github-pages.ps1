# GitHub Pages Deployment Script for ConsentHub API Documentation
# Usage: .\deploy-github-pages.ps1

Write-Host "🚀 Deploying ConsentHub API Documentation to GitHub Pages..." -ForegroundColor Green

# Check if we're in a git repository
if (!(Test-Path ".git")) {
    Write-Host "❌ Error: Not in a git repository" -ForegroundColor Red
    Write-Host "Please run this script from the root of your git repository" -ForegroundColor Yellow
    exit 1
}

# Check if docs folder exists
if (!(Test-Path "docs")) {
    Write-Host "❌ Error: docs folder not found" -ForegroundColor Red
    exit 1
}

# Check if required files exist
$requiredFiles = @("docs/index.html", "docs/openapi.yaml", ".github/workflows/deploy-docs.yml")
foreach ($file in $requiredFiles) {
    if (!(Test-Path $file)) {
        Write-Host "❌ Error: Required file missing: $file" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ All required files found" -ForegroundColor Green

# Check git status
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "📝 Found uncommitted changes. Adding to git..." -ForegroundColor Yellow
    git add .
    git commit -m "Deploy API documentation to GitHub Pages"
    Write-Host "✅ Changes committed" -ForegroundColor Green
} else {
    Write-Host "✅ No uncommitted changes" -ForegroundColor Green
}

# Push to GitHub
Write-Host "🔄 Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 GitHub Pages deployment initiated!" -ForegroundColor Cyan
    Write-Host "📖 Your documentation will be available at:" -ForegroundColor White
    
    # Try to get the repository info
    $remoteUrl = git remote get-url origin
    if ($remoteUrl -match "github\.com[:/](.+)/(.+)\.git") {
        $owner = $matches[1]
        $repo = $matches[2]
        $pagesUrl = "https://$owner.github.io/$repo/"
        Write-Host "   $pagesUrl" -ForegroundColor Cyan
    } else {
        Write-Host "   https://YOUR_USERNAME.github.io/ConsentHub-Backend/" -ForegroundColor Cyan
    }
    
    Write-Host ""
    Write-Host "ℹ️  Next steps:" -ForegroundColor White
    Write-Host "1. Go to your repository settings" -ForegroundColor Gray
    Write-Host "2. Navigate to 'Pages' section" -ForegroundColor Gray
    Write-Host "3. Select 'GitHub Actions' as the source (if not already set)" -ForegroundColor Gray
    Write-Host "4. Wait for the deployment to complete (check Actions tab)" -ForegroundColor Gray
    Write-Host "5. Visit your documentation URL above" -ForegroundColor Gray
    
} else {
    Write-Host "❌ Error: Failed to push to GitHub" -ForegroundColor Red
    Write-Host "Please check your git configuration and try again" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔗 Useful links:" -ForegroundColor White
Write-Host "- Repository Actions: https://github.com/YOUR_USERNAME/ConsentHub-Backend/actions" -ForegroundColor Gray
Write-Host "- Repository Settings: https://github.com/YOUR_USERNAME/ConsentHub-Backend/settings/pages" -ForegroundColor Gray
