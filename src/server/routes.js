const express = require('express');
const path = require('path');
const fs = require('fs').promises;

function routes(docsPath) {
  const router = express.Router();
  const resolvedDocsPath = path.resolve(docsPath);

  // Ensure docs path exists
  fs.mkdir(resolvedDocsPath, { recursive: true }).catch(() => {});

  // List available markdown files
  router.get('/files', async (req, res) => {
    try {
      const files = await getMarkdownFiles(resolvedDocsPath);
      res.json(files);
    } catch (error) {
      console.error('Error listing files:', error);
      res.status(500).json({ error: 'Failed to list files' });
    }
  });

  // Get file content
  router.get('/file', async (req, res) => {
    const filePath = req.query.path;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Security: Prevent path traversal
    const resolvedPath = path.resolve(resolvedDocsPath, filePath);
    if (!resolvedPath.startsWith(resolvedDocsPath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Security: Only allow .md files
    if (!resolvedPath.endsWith('.md') && !resolvedPath.endsWith('.markdown')) {
      return res.status(403).json({ error: 'Only markdown files allowed' });
    }

    try {
      const stat = await fs.stat(resolvedPath);
      const content = await fs.readFile(resolvedPath, 'utf-8');

      res.json({
        content,
        path: filePath,
        fileName: path.basename(filePath),
        size: stat.size,
        modified: stat.mtime.toISOString()
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.status(404).json({ error: 'File not found' });
      } else if (error.code === 'EACCES') {
        res.status(403).json({ error: 'Permission denied' });
      } else {
        console.error('Error reading file:', error);
        res.status(500).json({ error: 'Failed to read file' });
      }
    }
  });

  // Save file content
  router.put('/file', async (req, res) => {
    const { path: filePath, content } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    if (content === undefined || content === null) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Security: Prevent path traversal
    const resolvedPath = path.resolve(resolvedDocsPath, filePath);
    if (!resolvedPath.startsWith(resolvedDocsPath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Security: Only allow .md files
    if (!resolvedPath.endsWith('.md') && !resolvedPath.endsWith('.markdown')) {
      return res.status(403).json({ error: 'Only markdown files allowed' });
    }

    try {
      // Write content to file
      await fs.writeFile(resolvedPath, content, 'utf-8');
      const stat = await fs.stat(resolvedPath);

      res.json({
        success: true,
        path: filePath,
        fileName: path.basename(filePath),
        size: stat.size,
        modified: stat.mtime.toISOString()
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.status(404).json({ error: 'File not found' });
      } else if (error.code === 'EACCES') {
        res.status(403).json({ error: 'Permission denied' });
      } else {
        console.error('Error saving file:', error);
        res.status(500).json({ error: 'Failed to save file' });
      }
    }
  });

  // Check if file has been modified (for polling)
  router.get('/file/modified', async (req, res) => {
    const filePath = req.query.path;
    const since = req.query.since ? new Date(req.query.since) : null;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Security: Prevent path traversal
    const resolvedPath = path.resolve(resolvedDocsPath, filePath);
    if (!resolvedPath.startsWith(resolvedDocsPath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    try {
      const stat = await fs.stat(resolvedPath);
      const modified = stat.mtime > since;

      res.json({
        modified,
        lastModified: stat.mtime.toISOString()
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.json({ deleted: true });
      } else {
        res.status(500).json({ error: 'Failed to check file' });
      }
    }
  });

  // List directory contents
  router.get('/directory', async (req, res) => {
    const dirPath = req.query.path || '';

    // Security: Prevent path traversal
    const resolvedPath = path.resolve(resolvedDocsPath, dirPath);
    if (!resolvedPath.startsWith(resolvedDocsPath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    try {
      const entries = await fs.readdir(resolvedPath, { withFileTypes: true });

      const files = await Promise.all(
        entries
          .filter(entry => {
            if (entry.isDirectory()) return true;
            return entry.name.endsWith('.md') || entry.name.endsWith('.markdown');
          })
          .map(async entry => {
            const fullPath = path.join(resolvedPath, entry.name);
            const relativePath = path.relative(resolvedDocsPath, fullPath);
            const stat = await fs.stat(fullPath).catch(() => null);

            return {
              name: entry.name,
              path: relativePath.replace(/\\/g, '/'),
              isDirectory: entry.isDirectory(),
              size: stat ? stat.size : 0,
              modified: stat ? stat.mtime.toISOString() : null
            };
          })
      );

      // Sort: directories first, then alphabetically
      files.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });

      res.json({
        path: dirPath,
        files
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.status(404).json({ error: 'Directory not found' });
      } else {
        console.error('Error listing directory:', error);
        res.status(500).json({ error: 'Failed to list directory' });
      }
    }
  });

  return router;
}

async function getMarkdownFiles(dirPath, basePath = '', files = []) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.join(basePath, entry.name);

      if (entry.isDirectory()) {
        // Skip hidden directories and node_modules
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await getMarkdownFiles(fullPath, relativePath, files);
        }
      } else if (entry.name.endsWith('.md') || entry.name.endsWith('.markdown')) {
        const stat = await fs.stat(fullPath);
        files.push({
          name: entry.name,
          path: relativePath.replace(/\\/g, '/'),
          size: stat.size,
          modified: stat.mtime.toISOString()
        });
      }
    }
  } catch (error) {
    console.error('Error scanning directory:', dirPath, error);
  }

  return files;
}

module.exports = { routes };
