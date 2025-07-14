# ConsentHub API Documentation

Live API Documentation: [https://consent-management-system-slt.github.io/ConsentHub-Backend/](https://consent-management-system-slt.github.io/ConsentHub-Backend/)

## GitHub Pages Deployment

This repository automatically deploys the Swagger/OpenAPI documentation to GitHub Pages using GitHub Actions.

### Setup Instructions

1. **Enable GitHub Pages**:
   - Go to your repository settings
   - Navigate to "Pages" section
   - Select "GitHub Actions" as the source
   - The workflow will automatically deploy on push to main branch

2. **Access Documentation**:
   - Main documentation: `https://YOUR_USERNAME.github.io/ConsentHub-Backend/`
   - OpenAPI spec: `https://YOUR_USERNAME.github.io/ConsentHub-Backend/openapi.yaml`

### Files Structure

```
docs/
├── index.html          # Swagger UI interface
├── openapi.yaml        # OpenAPI specification
└── README.md          # This documentation
```

### Features

- ✅ Interactive API documentation
- ✅ Try-it-out functionality
- ✅ Authentication testing
- ✅ Mobile responsive
- ✅ Fast CDN delivery
- ✅ Automatic deployment on code changes

### Manual Deployment

If you need to deploy manually:

```bash
# Commit and push changes
git add .
git commit -m "Update API documentation"
git push origin main
```

The GitHub Action will automatically deploy the updated documentation.

### Local Development

To test the documentation locally:

```bash
# Serve the docs folder with any static server
cd docs
python -m http.server 8000
# or
npx serve .
```

Then visit `http://localhost:8000`

### Customization

To customize the documentation:
1. Edit `docs/index.html` for UI changes
2. Edit `docs/openapi.yaml` for API specification changes
3. Changes will be automatically deployed on push to main

### Troubleshooting

If deployment fails:
1. Check the Actions tab in your repository
2. Ensure GitHub Pages is enabled in repository settings
3. Verify the workflow has proper permissions
4. Check that the `docs/` folder contains the required files
