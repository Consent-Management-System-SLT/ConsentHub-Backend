# 🚀 GitHub Pages Deployment Guide

## Quick Deploy

Run this command in your repository root:

```powershell
.\deploy-github-pages.ps1
```

## Manual Steps

### 1. Enable GitHub Pages
1. Go to your repository on GitHub
2. Click on **Settings** tab
3. Scroll down to **Pages** section
4. Under **Source**, select **"GitHub Actions"**
5. Click **Save**

### 2. Deploy the Documentation
The documentation will automatically deploy when you push to the main branch.

```bash
git add .
git commit -m "Deploy API documentation to GitHub Pages"
git push origin main
```

### 3. Access Your Documentation
Your documentation will be available at:
```
https://consent-management-system-slt.github.io/ConsentHub-Backend/
```

## Files Created for GitHub Pages

```
docs/
├── index.html          # Swagger UI interface (GitHub Pages compatible)
├── openapi.yaml        # Your OpenAPI specification
└── README.md          # Documentation guide

.github/
└── workflows/
    └── deploy-docs.yml # GitHub Actions workflow
```

## Features

- ✅ **Automatic Deployment**: Updates automatically on push to main
- ✅ **CDN Delivery**: Fast global access via GitHub's CDN
- ✅ **HTTPS**: Secure connection by default
- ✅ **Interactive**: Full Swagger UI with "Try it out" functionality
- ✅ **Mobile Responsive**: Works on all devices
- ✅ **Free**: No hosting costs

## Troubleshooting

### Documentation Not Loading
1. Check the **Actions** tab in your repository
2. Ensure the workflow completed successfully
3. Verify GitHub Pages is enabled in repository settings
4. Wait 5-10 minutes for deployment to complete

### Changes Not Reflected
1. Clear your browser cache
2. Wait a few minutes for CDN to update
3. Check if the latest commit triggered the workflow

### Workflow Failures
1. Check the **Actions** tab for error details
2. Ensure the `docs/` folder contains all required files
3. Verify the workflow has proper permissions

## Next Steps

1. **Run the deployment script**: `.\deploy-github-pages.ps1`
2. **Enable GitHub Pages** in your repository settings
3. **Share the URL** with your team
4. **Update documentation** by editing `docs/openapi.yaml`

## Team Sharing

Share this URL with your team:
```
https://consent-management-system-slt.github.io/ConsentHub-Backend/
```

The documentation will always be up-to-date with your latest API changes!
