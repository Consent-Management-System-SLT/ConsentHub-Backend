#!/usr/bin/env node

/**
 * Script to test GitHub Pages deployment locally
 * This serves the docs folder to simulate GitHub Pages
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = 8081;

// Serve static files from docs directory
app.use(express.static(path.join(__dirname, 'docs')));

// Handle SPA routing - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`📚 GitHub Pages Preview Server running on port ${PORT}`);
  console.log(`🌐 Open: http://localhost:${PORT}`);
  console.log(`📖 This simulates how your docs will look on GitHub Pages`);
  console.log(`🚀 GitHub Pages URL: https://consent-management-system-slt.github.io/ConsentHub-Backend/`);
  console.log(`\n💡 Open the URL above in your browser to preview the documentation!`);
});
