const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { routes } = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;
const DOCS_PATH = process.env.DOCS_PATH || './docs';

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-eval'; img-src 'self' data: https:; font-src 'self' data:;"
  );
  next();
});

// Parse JSON bodies
app.use(express.json());

// Serve static files from the dist directory
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Also serve from dist/web for Docker builds
const distWebPath = path.join(__dirname, '../../dist/web');
app.use(express.static(distWebPath));

// API routes
app.use('/api', routes(DOCS_PATH));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve index.html for all other routes (SPA)
app.get('*', async (req, res) => {
  // Try dist first, then dist/web
  let indexPath = path.join(distPath, 'index.html');
  try {
    await fs.access(indexPath);
  } catch {
    indexPath = path.join(distWebPath, 'index.html');
  }

  try {
    await fs.access(indexPath);
    res.sendFile(indexPath);
  } catch {
    res.status(404).send('Application not found. Run npm run build:web first.');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`MD Viewer server running at http://localhost:${PORT}`);
  console.log(`Serving markdown files from: ${path.resolve(DOCS_PATH)}`);
});

module.exports = app;
