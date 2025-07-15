# 🚀 GitHub Pages Configuration Guide

## Current Status
Your ConsentHub API documentation is now ready for GitHub Pages deployment!

## 📋 GitHub Pages Setup Steps

### 1. Enable GitHub Pages (If Not Already Done)
1. Go to your repository: https://github.com/Consent-Management-System-SLT/ConsentHub-Backend
2. Click on **Settings** tab
3. Scroll down to **Pages** section in the left sidebar
4. Under **Source**, select **Deploy from a branch**
5. Choose **main** branch
6. Choose **/ (root)** or **docs** folder (recommended)
7. Click **Save**

### 2. Configure GitHub Pages Source
**Option A: Serve from `/docs` folder (Recommended)**
- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `docs`

**Option B: Use GitHub Actions (Advanced)**
- Source: `GitHub Actions`
- The workflow in `.github/workflows/deploy-swagger.yml` will handle deployment

## 🔧 Current Configuration

### Files Updated:
- ✅ `docs/index.html` - Enhanced Swagger UI with custom styling
- ✅ `.github/workflows/deploy-swagger.yml` - GitHub Actions workflow
- ✅ `test-github-pages.js` - Local preview server

### Your GitHub Pages URL:
```
https://consent-management-system-slt.github.io/ConsentHub-Backend/
```

## 🧪 Testing

### Local Preview:
```bash
npm run docs:preview
# Opens: http://localhost:8081
```

### Verify Documentation:
- The documentation loads the OpenAPI spec from `docs/openapi.yaml`
- Service links are provided for local development
- Custom styling matches SLT Mobitel branding

## 📝 What Changed

### Enhanced `docs/index.html`:
1. **Custom Header**: ConsentHub branding with gradient background
2. **Service Links**: Grid layout showing all microservice documentation URLs
3. **Enhanced Styling**: SLT Mobitel color scheme (#2E8B57 green)
4. **Error Handling**: Graceful fallback if OpenAPI spec fails to load
5. **Responsive Design**: Works on mobile and desktop

### Features Added:
- 🎨 Custom SLT Mobitel branding and colors
- 📱 Responsive grid layout for service links
- 🔗 Direct links to individual service documentation
- ⚡ Fast loading with CDN-hosted Swagger UI
- 🛡️ Error handling and fallbacks

## 🔍 Troubleshooting

### If GitHub Pages shows README instead of docs:
1. Check GitHub Pages settings in repository
2. Ensure **Source** is set to **Deploy from a branch**
3. Ensure **Folder** is set to **docs** (not root)
4. Wait 5-10 minutes for deployment

### If documentation doesn't load:
1. Check if `docs/openapi.yaml` exists and is valid
2. Verify the OpenAPI spec is properly formatted
3. Check browser console for any errors
4. Test locally using `npm run docs:preview`

### Common Issues:
- **404 Error**: GitHub Pages source not configured correctly
- **Blank Page**: OpenAPI spec file missing or invalid
- **Service Links Don't Work**: Normal - they're for local development only

## 🎯 Next Steps

1. **Verify GitHub Pages is enabled** in repository settings
2. **Wait for deployment** (usually 5-10 minutes after push)
3. **Visit your GitHub Pages URL** to see the documentation
4. **Share the URL** with your team and stakeholders

## 💡 Pro Tips

- Use `npm run docs:preview` to test changes locally before pushing
- The service links only work when running services locally
- The OpenAPI spec is the main documentation source
- GitHub Pages updates automatically when you push to main branch

---

**Your documentation is now ready! 🎉**

Visit: https://consent-management-system-slt.github.io/ConsentHub-Backend/
