# Markdown Viewer - Complete Development Specification

## 1. Project Overview

A minimalist, clean markdown file viewer built with Electron. The application supports two deployment modes:
- **Native Desktop**: Windows executable (.exe) for local file viewing
- **Web/Docker**: Containerized web application for browser-based access

### 1.1 Core Philosophy
- View-only (no editing capabilities)
- Minimal UI chrome - content is the focus
- Fast startup and rendering
- Support for diagrams (Mermaid) with zoom functionality

---

## 2. Technology Stack

### 2.1 Core Framework
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Desktop Runtime | Electron | ^28.0.0 | Cross-platform desktop app |
| UI Framework | Vanilla JS + HTML/CSS | - | Minimalist, no heavy frameworks |
| Build Tool | electron-builder | ^24.0.0 | Windows exe packaging |
| Bundler | Vite | ^5.0.0 | Fast development and bundling |

### 2.2 Markdown & Rendering
| Package | Purpose |
|---------|---------|
| marked | Markdown parsing (fast, GFM support) |
| highlight.js | Syntax highlighting for code blocks |
| mermaid | Diagram rendering (flowcharts, sequence, etc.) |
| katex | LaTeX/math formula rendering |
| DOMPurify | HTML sanitization for security |

### 2.3 Docker/Web Mode
| Component | Purpose |
|-----------|---------|
| Express.js | Lightweight web server |
| Alpine Node image | Minimal Docker footprint |

### 2.4 Remote File Access
| Package | Purpose |
|---------|---------|
| ssh2 | SSH/SFTP connections for remote files |
| ssh2-sftp-client | High-level SFTP operations |
| smb2 | SMB/CIFS Windows share access |
| Basic auth | Credential management (see 4.9) |

**Note:** NFS is accessed via OS-level mounts (no special npm package needed).

---

## 3. Application Architecture

### 3.1 Directory Structure
```
md-viewer/
├── package.json
├── vite.config.js
├── electron-builder.yml
├── Dockerfile
├── docker-compose.yml
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.js             # Main entry point
│   │   ├── file-watcher.js      # Local file system watching
│   │   ├── remote-watcher.js    # Remote file polling/watching
│   │   ├── menu.js              # Application menu
│   │   ├── ipc-handlers.js      # IPC communication
│   │   ├── window-manager.js    # Window creation/management
│   │   └── remote/              # Remote file access
│   │       ├── index.js         # Unified remote file interface
│   │       ├── ssh-client.js    # SSH/SFTP implementation
│   │       ├── smb-client.js    # SMB/CIFS implementation
│   │       ├── nfs-client.js    # NFS mount helper
│   │       ├── credentials.js   # Credential storage/retrieval
│   │       └── path-parser.js   # Remote path URL parsing
│   ├── preload/
│   │   └── preload.js           # Context bridge for renderer
│   ├── renderer/                # Frontend (shared web/electron)
│   │   ├── index.html           # Main HTML
│   │   ├── styles/
│   │   │   ├── main.css         # Core styles
│   │   │   ├── markdown.css     # Markdown content styles
│   │   │   ├── mermaid.css      # Diagram styles
│   │   │   └── themes/
│   │   │       ├── light.css
│   │   │       └── dark.css
│   │   ├── js/
│   │   │   ├── app.js           # Main renderer logic
│   │   │   ├── markdown-renderer.js
│   │   │   ├── mermaid-handler.js
│   │   │   ├── zoom-controller.js
│   │   │   ├── file-handler.js
│   │   │   └── theme-manager.js
│   │   └── assets/
│   │       └── icons/
│   └── server/                  # Web/Docker mode
│       ├── index.js             # Express server
│       └── routes.js            # API routes for file handling
├── scripts/
│   ├── build-electron.js
│   └── build-web.js
└── test/
    ├── sample-files/            # Test markdown files
    └── unit/
```

### 3.2 Process Architecture

#### Electron Mode
```
┌─────────────────────────────────────────────────────────┐
│                    Main Process                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ File Watcher │  │ Menu Handler │  │ IPC Handler  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────┬───────────────────────────────┘
                          │ IPC
┌─────────────────────────┴───────────────────────────────┐
│                  Renderer Process                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ MD Renderer  │  │ Mermaid      │  │ Zoom Control │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### Web/Docker Mode
```
┌─────────────────────────────────────────────────────────┐
│                   Express Server                         │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │ Static Files │  │ File API     │                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTP
┌─────────────────────────┴───────────────────────────────┐
│                      Browser                             │
│           (Same renderer code as Electron)               │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Feature Specifications

### 4.1 File Opening

#### 4.1.1 Electron Mode
| Method | Implementation |
|--------|----------------|
| Drag & Drop | Listen for `drop` event on window, read file path |
| File > Open | Native file dialog via `dialog.showOpenDialog()` |
| Double-click .md | Windows file association (configured in installer) |
| Command line | `md-viewer.exe path/to/file.md` |
| Recent Files | Store last 10 files in `electron-store`, show on startup |

#### 4.1.2 Web/Docker Mode
| Method | Implementation |
|--------|----------------|
| Drag & Drop | Read file content via FileReader API |
| Browse Button | `<input type="file" accept=".md,.markdown">` |
| URL Parameter | `?file=/path/to/file.md` (for mounted volumes) |
| Paste Content | Textarea to paste raw markdown |

#### 4.1.3 Edge Cases
- **Large files (>5MB)**: Show loading indicator, use streaming parser
- **Binary files**: Detect via magic bytes, show error message
- **Invalid encoding**: Attempt UTF-8, fallback to ISO-8859-1, show warning if garbled
- **File not found**: Display friendly error with file path
- **Permission denied**: Show specific error message
- **Empty file**: Render empty state with hint text

### 4.2 Markdown Rendering

#### 4.2.1 Supported Syntax (GitHub Flavored Markdown)
| Feature | Example | Implementation |
|---------|---------|----------------|
| Headings | `# H1` to `###### H6` | Standard marked |
| Bold/Italic | `**bold**` `*italic*` | Standard marked |
| Strikethrough | `~~text~~` | GFM extension |
| Code inline | `` `code` `` | Standard marked |
| Code blocks | ` ```lang ` | marked + highlight.js |
| Tables | `\| a \| b \|` | GFM extension |
| Task lists | `- [x] done` | GFM extension |
| Links | `[text](url)` | Standard marked |
| Images | `![alt](src)` | Custom renderer (see 4.2.2) |
| Blockquotes | `> quote` | Standard marked |
| Horizontal rules | `---` | Standard marked |
| Footnotes | `[^1]` | marked-footnote extension |
| Math/LaTeX | `$inline$` `$$block$$` | KaTeX integration |
| Mermaid | ` ```mermaid ` | Custom handler (see 4.3) |

#### 4.2.2 Image Handling
```javascript
// Custom image renderer
const imageRenderer = {
  image(href, title, text) {
    // Handle relative paths (resolve against .md file location)
    if (!href.startsWith('http') && !href.startsWith('data:')) {
      href = resolvePath(currentFileDir, href);
    }

    // Handle broken images
    return `<img src="${href}" alt="${text}" title="${title || ''}"
            onerror="this.classList.add('broken'); this.alt='Image not found: ${href}'">`;
  }
};
```

#### 4.2.3 Link Handling
- **External links**: Open in default browser (Electron) or new tab (Web)
- **Internal anchors**: Smooth scroll to heading
- **Relative .md links**: Load the linked file (if exists)
- **mailto: links**: Open default mail client

#### 4.2.4 Security
- All HTML output sanitized via DOMPurify
- Script tags stripped
- Event handlers removed
- Only safe CSS properties allowed

### 4.3 Mermaid Diagram Support

#### 4.3.1 Supported Diagram Types
| Type | Syntax Start | Notes |
|------|--------------|-------|
| Flowchart | `graph TD` or `flowchart TD` | Full support |
| Sequence | `sequenceDiagram` | Full support |
| Class | `classDiagram` | Full support |
| State | `stateDiagram-v2` | Full support |
| ER Diagram | `erDiagram` | Full support |
| Gantt | `gantt` | Full support |
| Pie Chart | `pie` | Full support |
| Git Graph | `gitGraph` | Full support |
| Mindmap | `mindmap` | Full support |

#### 4.3.2 Rendering Pipeline
```javascript
// 1. Detect mermaid code blocks during markdown parsing
// 2. Replace with placeholder divs
// 3. After DOM insertion, initialize mermaid
// 4. Wrap each diagram in zoom container

const renderMermaid = async () => {
  const mermaidBlocks = document.querySelectorAll('.mermaid-placeholder');

  for (const block of mermaidBlocks) {
    const code = block.getAttribute('data-mermaid');
    const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const { svg } = await mermaid.render(id, code);
      block.innerHTML = wrapWithZoomContainer(svg, id);
      block.classList.remove('mermaid-placeholder');
      block.classList.add('mermaid-rendered');
    } catch (error) {
      block.innerHTML = `<div class="mermaid-error">
        <span class="error-icon">⚠</span>
        <span>Diagram syntax error</span>
        <pre>${escapeHtml(error.message)}</pre>
      </div>`;
    }
  }
};
```

#### 4.3.3 Mermaid Configuration
```javascript
mermaid.initialize({
  startOnLoad: false,
  theme: getCurrentTheme() === 'dark' ? 'dark' : 'default',
  securityLevel: 'strict',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: 14,
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis'
  },
  sequence: {
    useMaxWidth: true,
    wrap: true
  }
});
```

### 4.4 Diagram Zoom Functionality

#### 4.4.1 Zoom UI Structure
```html
<div class="diagram-container" data-diagram-id="mermaid-xxx">
  <div class="diagram-toolbar">
    <button class="zoom-in" title="Zoom In (Ctrl++)">+</button>
    <span class="zoom-level">100%</span>
    <button class="zoom-out" title="Zoom Out (Ctrl+-)">−</button>
    <button class="zoom-reset" title="Reset Zoom (Ctrl+0)">↺</button>
    <button class="zoom-fit" title="Fit to Width">⤢</button>
    <button class="fullscreen" title="Fullscreen (F)">⛶</button>
  </div>
  <div class="diagram-viewport">
    <div class="diagram-content" style="transform: scale(1) translate(0, 0)">
      <!-- SVG content here -->
    </div>
  </div>
</div>
```

#### 4.4.2 Zoom Implementation
```javascript
class ZoomController {
  constructor(container) {
    this.container = container;
    this.viewport = container.querySelector('.diagram-viewport');
    this.content = container.querySelector('.diagram-content');
    this.scale = 1;
    this.minScale = 0.1;
    this.maxScale = 5;
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;
  }

  // Zoom methods
  zoomIn() { this.setScale(this.scale * 1.25); }
  zoomOut() { this.setScale(this.scale / 1.25); }
  resetZoom() { this.setScale(1); this.panX = 0; this.panY = 0; this.applyTransform(); }
  fitToWidth() {
    const viewportWidth = this.viewport.clientWidth;
    const contentWidth = this.content.querySelector('svg').getBBox().width;
    this.setScale(viewportWidth / contentWidth * 0.95);
  }

  setScale(newScale) {
    this.scale = Math.max(this.minScale, Math.min(this.maxScale, newScale));
    this.applyTransform();
    this.updateZoomDisplay();
  }

  applyTransform() {
    this.content.style.transform = `scale(${this.scale}) translate(${this.panX}px, ${this.panY}px)`;
  }

  // Mouse wheel zoom (zoom toward cursor position)
  handleWheel(e) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const rect = this.viewport.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.zoomAtPoint(x, y, delta);
    }
  }

  // Pan with mouse drag
  handleMouseDown(e) {
    if (e.button === 0) { // Left click
      this.isPanning = true;
      this.startX = e.clientX - this.panX;
      this.startY = e.clientY - this.panY;
      this.viewport.style.cursor = 'grabbing';
    }
  }

  handleMouseMove(e) {
    if (this.isPanning) {
      this.panX = e.clientX - this.startX;
      this.panY = e.clientY - this.startY;
      this.applyTransform();
    }
  }

  handleMouseUp() {
    this.isPanning = false;
    this.viewport.style.cursor = 'grab';
  }

  // Touch support for mobile/tablet
  handleTouchStart(e) { /* Pinch-to-zoom initialization */ }
  handleTouchMove(e) { /* Pinch-to-zoom calculation */ }
  handleTouchEnd(e) { /* Cleanup */ }

  // Fullscreen mode
  toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      this.container.requestFullscreen();
    }
  }
}
```

#### 4.4.3 Zoom Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl + +` / `Ctrl + =` | Zoom in |
| `Ctrl + -` | Zoom out |
| `Ctrl + 0` | Reset zoom to 100% |
| `F` (when diagram focused) | Toggle fullscreen |
| Arrow keys (when diagram focused) | Pan |

#### 4.4.4 Edge Cases
- **SVG without viewBox**: Calculate from content bounds
- **Very large diagrams**: Initial scale to fit viewport
- **Very small diagrams**: Center without scaling up
- **Touch devices**: Support pinch-to-zoom gesture
- **Fullscreen exit**: Restore previous zoom/pan state

### 4.5 Live File Updates & Watching

The application supports real-time updates for both local and remote files. When a file changes, the view automatically refreshes while preserving scroll position.

#### 4.5.1 Local File Watching (Electron)
```javascript
const chokidar = require('chokidar');

class LocalFileWatcher {
  constructor() {
    this.watcher = null;
    this.debounceTimer = null;
    this.debounceMs = 300;
  }

  watch(filePath) {
    this.stop();

    this.watcher = chokidar.watch(filePath, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50
      }
    });

    this.watcher.on('change', () => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        mainWindow.webContents.send('file-changed', { type: 'modified' });
      }, this.debounceMs);
    });

    this.watcher.on('unlink', () => {
      mainWindow.webContents.send('file-changed', { type: 'deleted' });
    });
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}
```

#### 4.5.2 Remote File Watching (Polling-Based)
Remote files cannot use native filesystem events. Instead, use polling with content hash comparison.

```javascript
const crypto = require('crypto');

class RemoteFileWatcher {
  constructor(remoteClient) {
    this.remoteClient = remoteClient;
    this.pollInterval = null;
    this.lastHash = null;
    this.lastModified = null;
    this.pollIntervalMs = 2000; // Default: 2 seconds
    this.currentPath = null;
  }

  async watch(remotePath, options = {}) {
    this.stop();
    this.currentPath = remotePath;
    this.pollIntervalMs = options.pollInterval || 2000;

    // Get initial state
    const initialContent = await this.remoteClient.readFile(remotePath);
    this.lastHash = this.hashContent(initialContent);
    this.lastModified = await this.remoteClient.getModifiedTime(remotePath);

    // Start polling
    this.pollInterval = setInterval(() => this.checkForChanges(), this.pollIntervalMs);
  }

  async checkForChanges() {
    try {
      // First check modification time (fast)
      const currentModified = await this.remoteClient.getModifiedTime(this.currentPath);

      if (currentModified !== this.lastModified) {
        // Modification time changed, verify with content hash
        const content = await this.remoteClient.readFile(this.currentPath);
        const currentHash = this.hashContent(content);

        if (currentHash !== this.lastHash) {
          this.lastHash = currentHash;
          this.lastModified = currentModified;
          mainWindow.webContents.send('file-changed', {
            type: 'modified',
            remote: true,
            content: content
          });
        }
      }
    } catch (error) {
      if (error.code === 'ENOENT' || error.message.includes('not found')) {
        mainWindow.webContents.send('file-changed', { type: 'deleted', remote: true });
        this.stop();
      } else if (error.code === 'ECONNREFUSED' || error.message.includes('connection')) {
        mainWindow.webContents.send('remote-connection-lost', { path: this.currentPath });
        // Don't stop - keep trying to reconnect
      }
    }
  }

  hashContent(content) {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  // Adjust polling frequency based on user activity
  setPollInterval(ms) {
    this.pollIntervalMs = Math.max(500, Math.min(30000, ms)); // 0.5s to 30s
    if (this.currentPath) {
      this.stop();
      this.pollInterval = setInterval(() => this.checkForChanges(), this.pollIntervalMs);
    }
  }
}
```

#### 4.5.3 Unified Watcher Manager
```javascript
class FileWatcherManager {
  constructor() {
    this.localWatcher = new LocalFileWatcher();
    this.remoteWatcher = new RemoteFileWatcher();
    this.currentType = null;
  }

  async watch(filePath, remoteClient = null) {
    this.stop();

    if (remoteClient) {
      this.currentType = 'remote';
      await this.remoteWatcher.watch(filePath, { remoteClient });
    } else {
      this.currentType = 'local';
      this.localWatcher.watch(filePath);
    }
  }

  stop() {
    this.localWatcher.stop();
    this.remoteWatcher.stop();
    this.currentType = null;
  }

  setEnabled(enabled) {
    if (!enabled) {
      this.stop();
    }
  }
}
```

#### 4.5.4 User Notification & Controls
| Event | UI Feedback |
|-------|-------------|
| File modified | Subtle toast: "File updated" with timestamp |
| File deleted | Warning banner: "File was deleted" with dismiss |
| Connection lost | Error banner: "Connection lost. Reconnecting..." with retry button |
| Reconnected | Toast: "Connection restored" |

**Live Update Toggle (Menu & UI):**
```
View > Live Updates > [✓] Enabled
                      [ ] Disabled
                      ─────────────
                      Poll Interval
                      [●] 1 second
                      [ ] 2 seconds (default)
                      [ ] 5 seconds
                      [ ] 10 seconds
```

#### 4.5.5 Scroll Position Preservation
```javascript
// Before reload
const scrollState = {
  scrollTop: contentElement.scrollTop,
  scrollHeight: contentElement.scrollHeight,
  // Track by heading anchor if possible
  nearestHeadingId: findNearestVisibleHeading()
};

// After reload
if (scrollState.nearestHeadingId) {
  // Scroll to same heading
  const heading = document.getElementById(scrollState.nearestHeadingId);
  if (heading) heading.scrollIntoView();
} else {
  // Restore approximate position
  const ratio = scrollState.scrollTop / scrollState.scrollHeight;
  contentElement.scrollTop = ratio * contentElement.scrollHeight;
}
```

### 4.6 Remote File Access

#### 4.6.1 Supported Protocols
| Protocol | URL Format | Example |
|----------|------------|---------|
| SSH/SFTP | `ssh://[user@]host[:port]/path` | `ssh://user@server.com/home/user/docs/file.md` |
| SMB/CIFS | `smb://[user@]host/share/path` | `smb://fileserver/docs/readme.md` |
| SMB (UNC) | `\\host\share\path` | `\\fileserver\docs\readme.md` |
| NFS | `nfs://host/export/path` | `nfs://nas.local/exports/docs/file.md` |

#### 4.6.2 Path Parser Implementation
```javascript
// src/main/remote/path-parser.js

class RemotePathParser {
  static parse(input) {
    // Handle Windows UNC paths: \\server\share\path
    if (input.startsWith('\\\\')) {
      const parts = input.slice(2).split('\\');
      return {
        protocol: 'smb',
        host: parts[0],
        share: parts[1],
        path: '/' + parts.slice(2).join('/'),
        port: 445,
        username: null,
        password: null
      };
    }

    // Handle URL-style paths
    try {
      const url = new URL(input);
      const protocol = url.protocol.replace(':', '');

      const result = {
        protocol,
        host: url.hostname,
        port: url.port || this.getDefaultPort(protocol),
        path: url.pathname,
        username: url.username || null,
        password: url.password || null
      };

      // SMB-specific: extract share from path
      if (protocol === 'smb') {
        const pathParts = url.pathname.split('/').filter(Boolean);
        result.share = pathParts[0];
        result.path = '/' + pathParts.slice(1).join('/');
      }

      return result;
    } catch {
      // Not a valid URL, treat as local path
      return { protocol: 'local', path: input };
    }
  }

  static getDefaultPort(protocol) {
    const ports = { ssh: 22, sftp: 22, smb: 445, nfs: 2049 };
    return ports[protocol] || null;
  }

  static isRemote(input) {
    return input.startsWith('ssh://') ||
           input.startsWith('sftp://') ||
           input.startsWith('smb://') ||
           input.startsWith('nfs://') ||
           input.startsWith('\\\\');
  }
}
```

#### 4.6.3 SSH/SFTP Client
```javascript
// src/main/remote/ssh-client.js

const SFTPClient = require('ssh2-sftp-client');

class SSHFileClient {
  constructor() {
    this.client = new SFTPClient();
    this.connected = false;
    this.connectionConfig = null;
  }

  async connect(config) {
    this.connectionConfig = {
      host: config.host,
      port: config.port || 22,
      username: config.username,
      // Support multiple auth methods
      password: config.password,
      privateKey: config.privateKey,
      passphrase: config.passphrase,
      // Connection settings
      readyTimeout: 10000,
      retries: 3,
      retry_factor: 2,
      retry_minTimeout: 1000
    };

    await this.client.connect(this.connectionConfig);
    this.connected = true;
  }

  async readFile(remotePath) {
    if (!this.connected) throw new Error('Not connected');

    const buffer = await this.client.get(remotePath);
    return buffer.toString('utf-8');
  }

  async getModifiedTime(remotePath) {
    if (!this.connected) throw new Error('Not connected');

    const stats = await this.client.stat(remotePath);
    return stats.modifyTime;
  }

  async exists(remotePath) {
    try {
      await this.client.stat(remotePath);
      return true;
    } catch {
      return false;
    }
  }

  async listDirectory(remotePath) {
    if (!this.connected) throw new Error('Not connected');

    const list = await this.client.list(remotePath);
    return list
      .filter(item => item.name.endsWith('.md') || item.name.endsWith('.markdown') || item.type === 'd')
      .map(item => ({
        name: item.name,
        path: `${remotePath}/${item.name}`,
        isDirectory: item.type === 'd',
        size: item.size,
        modified: item.modifyTime
      }));
  }

  async disconnect() {
    if (this.connected) {
      await this.client.end();
      this.connected = false;
    }
  }

  // Reconnect on connection loss
  async reconnect() {
    await this.disconnect();
    await this.connect(this.connectionConfig);
  }
}
```

#### 4.6.4 SMB Client
```javascript
// src/main/remote/smb-client.js

const SMB2 = require('smb2');

class SMBFileClient {
  constructor() {
    this.client = null;
    this.connected = false;
    this.connectionConfig = null;
  }

  async connect(config) {
    this.connectionConfig = config;

    return new Promise((resolve, reject) => {
      this.client = new SMB2({
        share: `\\\\${config.host}\\${config.share}`,
        domain: config.domain || 'WORKGROUP',
        username: config.username,
        password: config.password,
        port: config.port || 445,
        autoCloseTimeout: 0 // Keep connection alive
      });

      // Test connection by reading root
      this.client.exists('', (err) => {
        if (err) {
          reject(new Error(`SMB connection failed: ${err.message}`));
        } else {
          this.connected = true;
          resolve();
        }
      });
    });
  }

  async readFile(remotePath) {
    return new Promise((resolve, reject) => {
      // SMB2 uses backslashes
      const smbPath = remotePath.replace(/\//g, '\\').replace(/^\\/, '');

      this.client.readFile(smbPath, { encoding: 'utf8' }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  async getModifiedTime(remotePath) {
    return new Promise((resolve, reject) => {
      const smbPath = remotePath.replace(/\//g, '\\').replace(/^\\/, '');

      this.client.stat(smbPath, (err, stats) => {
        if (err) reject(err);
        else resolve(stats.mtime.getTime());
      });
    });
  }

  async exists(remotePath) {
    return new Promise((resolve) => {
      const smbPath = remotePath.replace(/\//g, '\\').replace(/^\\/, '');
      this.client.exists(smbPath, (err, exists) => resolve(!err && exists));
    });
  }

  async listDirectory(remotePath) {
    return new Promise((resolve, reject) => {
      const smbPath = remotePath.replace(/\//g, '\\').replace(/^\\/, '') || '';

      this.client.readdir(smbPath, (err, files) => {
        if (err) {
          reject(err);
        } else {
          resolve(files
            .filter(f => f.endsWith('.md') || f.endsWith('.markdown') || !f.includes('.'))
            .map(name => ({
              name,
              path: `${remotePath}/${name}`,
              isDirectory: !name.includes('.')
            }))
          );
        }
      });
    });
  }

  async disconnect() {
    if (this.client) {
      this.client.close();
      this.client = null;
      this.connected = false;
    }
  }
}
```

#### 4.6.5 NFS Access
NFS is handled via OS-level mounts. The application detects NFS mounts and treats them as local paths.

```javascript
// src/main/remote/nfs-client.js

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class NFSClient {
  constructor() {
    this.mountPoint = null;
    this.mounted = false;
  }

  async connect(config) {
    // Create temporary mount point
    this.mountPoint = path.join(os.tmpdir(), `mdviewer-nfs-${Date.now()}`);
    await fs.mkdir(this.mountPoint, { recursive: true });

    const nfsPath = `${config.host}:${config.export}`;

    return new Promise((resolve, reject) => {
      // Mount options for read-only access
      const mountCmd = process.platform === 'win32'
        ? `mount -o anon ${nfsPath} ${this.mountPoint}` // Windows NFS client
        : `mount -t nfs -o ro,soft,timeo=10 ${nfsPath} ${this.mountPoint}`;

      exec(mountCmd, (error) => {
        if (error) {
          reject(new Error(`NFS mount failed: ${error.message}`));
        } else {
          this.mounted = true;
          resolve();
        }
      });
    });
  }

  getLocalPath(remotePath) {
    return path.join(this.mountPoint, remotePath);
  }

  async readFile(remotePath) {
    const localPath = this.getLocalPath(remotePath);
    return fs.readFile(localPath, 'utf-8');
  }

  async getModifiedTime(remotePath) {
    const localPath = this.getLocalPath(remotePath);
    const stats = await fs.stat(localPath);
    return stats.mtimeMs;
  }

  async exists(remotePath) {
    try {
      await fs.access(this.getLocalPath(remotePath));
      return true;
    } catch {
      return false;
    }
  }

  async disconnect() {
    if (this.mounted && this.mountPoint) {
      return new Promise((resolve) => {
        const unmountCmd = process.platform === 'win32'
          ? `umount ${this.mountPoint}`
          : `umount ${this.mountPoint}`;

        exec(unmountCmd, () => {
          fs.rmdir(this.mountPoint).catch(() => {});
          this.mounted = false;
          resolve();
        });
      });
    }
  }
}
```

#### 4.6.6 Unified Remote Client Interface
```javascript
// src/main/remote/index.js

const { SSHFileClient } = require('./ssh-client');
const { SMBFileClient } = require('./smb-client');
const { NFSClient } = require('./nfs-client');
const { RemotePathParser } = require('./path-parser');
const { CredentialManager } = require('./credentials');

class RemoteFileManager {
  constructor() {
    this.clients = new Map(); // host -> client
    this.credentialManager = new CredentialManager();
  }

  async openFile(remotePath) {
    const parsed = RemotePathParser.parse(remotePath);

    if (parsed.protocol === 'local') {
      return { type: 'local', path: parsed.path };
    }

    const clientKey = `${parsed.protocol}://${parsed.host}:${parsed.port}`;
    let client = this.clients.get(clientKey);

    if (!client || !client.connected) {
      client = await this.createClient(parsed);
      this.clients.set(clientKey, client);
    }

    const content = await client.readFile(parsed.path);

    return {
      type: 'remote',
      protocol: parsed.protocol,
      path: parsed.path,
      fullPath: remotePath,
      content,
      client
    };
  }

  async createClient(parsed) {
    // Get credentials (from URL, stored, or prompt user)
    let credentials = {
      username: parsed.username,
      password: parsed.password
    };

    if (!credentials.username) {
      credentials = await this.credentialManager.getCredentials(parsed);
    }

    let client;

    switch (parsed.protocol) {
      case 'ssh':
      case 'sftp':
        client = new SSHFileClient();
        await client.connect({
          host: parsed.host,
          port: parsed.port,
          ...credentials
        });
        break;

      case 'smb':
        client = new SMBFileClient();
        await client.connect({
          host: parsed.host,
          share: parsed.share,
          port: parsed.port,
          ...credentials
        });
        break;

      case 'nfs':
        client = new NFSClient();
        await client.connect({
          host: parsed.host,
          export: parsed.path.split('/')[1], // First path component is export
          ...credentials
        });
        break;

      default:
        throw new Error(`Unsupported protocol: ${parsed.protocol}`);
    }

    return client;
  }

  async closeAll() {
    for (const client of this.clients.values()) {
      await client.disconnect();
    }
    this.clients.clear();
  }
}
```

#### 4.6.7 Credential Management
```javascript
// src/main/remote/credentials.js

const { safeStorage } = require('electron');
const Store = require('electron-store');

class CredentialManager {
  constructor() {
    this.store = new Store({ name: 'credentials', encryptionKey: 'md-viewer-creds' });
    this.sessionCredentials = new Map(); // Temporary, non-persisted
  }

  async getCredentials(parsed) {
    const key = `${parsed.protocol}://${parsed.host}`;

    // 1. Check session cache
    if (this.sessionCredentials.has(key)) {
      return this.sessionCredentials.get(key);
    }

    // 2. Check stored credentials
    const stored = this.getStoredCredentials(key);
    if (stored) {
      return stored;
    }

    // 3. Prompt user
    const credentials = await this.promptForCredentials(parsed);

    return credentials;
  }

  getStoredCredentials(key) {
    const encrypted = this.store.get(key);
    if (!encrypted) return null;

    try {
      const decrypted = safeStorage.decryptString(Buffer.from(encrypted, 'base64'));
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  }

  async saveCredentials(key, credentials, persist = false) {
    if (persist && safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(JSON.stringify(credentials));
      this.store.set(key, encrypted.toString('base64'));
    } else {
      this.sessionCredentials.set(key, credentials);
    }
  }

  async promptForCredentials(parsed) {
    // IPC call to renderer to show credential dialog
    return new Promise((resolve) => {
      mainWindow.webContents.send('request-credentials', {
        protocol: parsed.protocol,
        host: parsed.host,
        defaultUsername: parsed.username || process.env.USER || ''
      });

      ipcMain.once('credentials-response', (event, response) => {
        if (response.cancelled) {
          resolve(null);
        } else {
          const key = `${parsed.protocol}://${parsed.host}`;
          this.saveCredentials(key, response.credentials, response.remember);
          resolve(response.credentials);
        }
      });
    });
  }

  clearCredentials(key) {
    this.store.delete(key);
    this.sessionCredentials.delete(key);
  }

  clearAllCredentials() {
    this.store.clear();
    this.sessionCredentials.clear();
  }
}
```

#### 4.6.8 Credential Dialog UI
```html
<!-- Credential prompt dialog (renderer) -->
<dialog id="credentials-dialog" class="modal">
  <form method="dialog">
    <h3>Authentication Required</h3>
    <p class="connection-info">
      Connect to <strong id="cred-host"></strong> via <span id="cred-protocol"></span>
    </p>

    <div class="form-group">
      <label for="cred-username">Username</label>
      <input type="text" id="cred-username" required autocomplete="username">
    </div>

    <div class="form-group">
      <label for="cred-password">Password</label>
      <input type="password" id="cred-password" autocomplete="current-password">
    </div>

    <div class="form-group" id="ssh-key-group" style="display:none">
      <label for="cred-keyfile">SSH Private Key (optional)</label>
      <input type="file" id="cred-keyfile" accept=".pem,.ppk,.key,id_rsa,id_ed25519">
      <small>Leave empty to use password authentication</small>
    </div>

    <div class="form-group checkbox">
      <input type="checkbox" id="cred-remember">
      <label for="cred-remember">Remember credentials (encrypted)</label>
    </div>

    <div class="dialog-actions">
      <button type="button" class="btn-secondary" id="cred-cancel">Cancel</button>
      <button type="submit" class="btn-primary">Connect</button>
    </div>
  </form>
</dialog>
```

#### 4.6.9 Remote File Opening UX Flow
```
1. User enters remote path or uses "Open Remote..." menu

2. Parse path to determine protocol
   ├─ If SSH: Show credential dialog (username/password or key)
   ├─ If SMB: Show credential dialog (domain/username/password)
   └─ If NFS: Attempt mount (may require sudo on Linux)

3. Establish connection
   ├─ Success: Fetch file content
   └─ Failure: Show error with retry option

4. Display content
   └─ Start remote file watcher (polling)

5. On file change detected
   ├─ Fetch new content
   ├─ Update display (preserve scroll)
   └─ Show "File updated" toast

6. On connection loss
   ├─ Show "Connection lost" banner
   ├─ Attempt automatic reconnection (3 retries)
   └─ Offer manual retry button
```

#### 4.6.10 Remote Browser Dialog
For browsing remote directories:
```
┌─────────────────────────────────────────────────────────────┐
│ Open Remote File                                       [×]  │
├─────────────────────────────────────────────────────────────┤
│ Protocol: [SSH ▼]  Host: [____________]  Port: [22___]     │
│                                                             │
│ Path: /home/user/docs                           [Connect]   │
├─────────────────────────────────────────────────────────────┤
│ 📁 ..                                                       │
│ 📁 projects                                                 │
│ 📄 README.md                              2024-01-15  4.2KB │
│ 📄 notes.md                               2024-01-14  1.1KB │
│ 📄 todo.md                                2024-01-10  0.5KB │
│                                                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Recent Connections:                                         │
│ • ssh://user@server.com/home/user                          │
│ • smb://fileserver/docs                                    │
└─────────────────────────────────────────────────────────────┘
```

#### 4.6.11 Edge Cases & Error Handling
| Scenario | Handling |
|----------|----------|
| Invalid credentials | Show error, prompt to re-enter |
| Host unreachable | Show error with host/port, offer to check network |
| Connection timeout | Retry 3 times with exponential backoff |
| File not found (remote) | Show error with full remote path |
| Permission denied (remote) | Show error, suggest checking remote permissions |
| SSH host key verification | Show fingerprint, ask user to confirm (first connection) |
| SMB share not found | List available shares if possible |
| NFS mount requires sudo | Explain requirement, offer instructions |
| Connection dropped mid-read | Retry read, show partial content if available |
| Very slow connection | Show progress indicator, allow cancel |
| Large remote file | Stream content, show download progress |

#### 4.6.12 Security Considerations
- Never log passwords or private keys
- Use electron `safeStorage` for credential encryption
- Validate SSH host keys on first connection
- Clear session credentials on app close
- Support SSH agent forwarding (don't require key files)
- Warn about non-encrypted protocols (plain FTP not supported)
- Timeout idle connections after 5 minutes

### 4.7 Theme Support

#### 4.7.1 Themes
| Theme | Description |
|-------|-------------|
| Light | Clean white background, dark text |
| Dark | Dark gray background, light text |
| System | Follow OS preference |

#### 4.7.2 CSS Custom Properties
```css
:root {
  /* Light theme (default) */
  --bg-primary: #ffffff;
  --bg-secondary: #f6f8fa;
  --text-primary: #24292f;
  --text-secondary: #57606a;
  --border-color: #d0d7de;
  --link-color: #0969da;
  --code-bg: #f6f8fa;
  --code-text: #24292f;
  --blockquote-border: #d0d7de;
  --table-border: #d0d7de;
  --table-row-alt: #f6f8fa;
}

[data-theme="dark"] {
  --bg-primary: #0d1117;
  --bg-secondary: #161b22;
  --text-primary: #c9d1d9;
  --text-secondary: #8b949e;
  --border-color: #30363d;
  --link-color: #58a6ff;
  --code-bg: #161b22;
  --code-text: #c9d1d9;
  --blockquote-border: #3b434b;
  --table-border: #30363d;
  --table-row-alt: #161b22;
}
```

#### 4.7.3 System Theme Detection
```javascript
// Electron: nativeTheme.shouldUseDarkColors
// Web: window.matchMedia('(prefers-color-scheme: dark)')

const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
mediaQuery.addEventListener('change', (e) => {
  if (currentThemeSetting === 'system') {
    applyTheme(e.matches ? 'dark' : 'light');
  }
});
```

### 4.7 User Interface

#### 4.7.1 Layout (Minimalist)
```
┌────────────────────────────────────────────────────────────┐
│ [Drag to open or File > Open]              [☼/☽] [─ □ ×] │  <- Minimal titlebar
├────────────────────────────────────────────────────────────┤
│                                                            │
│                                                            │
│                    Markdown Content                        │
│                                                            │
│                    ┌─────────────────┐                    │
│                    │   ┌───────────┐ │                    │
│                    │   │ + 100% - ↺│ │  <- Diagram zoom   │
│                    │   └───────────┘ │                    │
│                    │   [Mermaid SVG] │                    │
│                    └─────────────────┘                    │
│                                                            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

#### 4.7.2 Empty State
```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                                                            │
│                        📄                                 │
│                                                            │
│              Drag a markdown file here                     │
│                  or press Ctrl+O                           │
│                                                            │
│               ─────── Recent Files ───────                │
│                                                            │
│               📝 README.md                                │
│               📝 notes/meeting-2024.md                    │
│               📝 docs/api.md                              │
│                                                            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

#### 4.7.3 Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl + O` | Open local file |
| `Ctrl + Shift + O` | Open remote file dialog |
| `Ctrl + W` | Close window |
| `Ctrl + R` | Reload file |
| `Ctrl + +` / `Ctrl + =` | Zoom in (page) |
| `Ctrl + -` | Zoom out (page) |
| `Ctrl + 0` | Reset zoom (page) |
| `Ctrl + F` | Find in document |
| `F11` | Toggle fullscreen |
| `Ctrl + Shift + T` | Toggle theme |
| `Ctrl + Shift + L` | Toggle live updates |
| `Escape` | Exit fullscreen / Close dialog / Cancel connection |

### 4.8 Application Menu (Electron)

```javascript
const menuTemplate = [
  {
    label: 'File',
    submenu: [
      { label: 'Open...', accelerator: 'CmdOrCtrl+O', click: openFile },
      { label: 'Open Remote...', accelerator: 'CmdOrCtrl+Shift+O', click: openRemoteDialog },
      { label: 'Open Recent', submenu: [] }, // Dynamically populated (includes remote paths)
      { type: 'separator' },
      { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: reloadFile },
      { type: 'separator' },
      { label: 'Disconnect', enabled: false, click: disconnectRemote }, // Enabled when remote file open
      { type: 'separator' },
      { label: 'Exit', accelerator: 'Alt+F4', role: 'quit' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', click: zoomIn },
      { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: zoomOut },
      { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', click: resetZoom },
      { type: 'separator' },
      { label: 'Toggle Fullscreen', accelerator: 'F11', role: 'togglefullscreen' },
      { type: 'separator' },
      { label: 'Live Updates', submenu: [
        { label: 'Enabled', type: 'checkbox', checked: true, click: toggleLiveUpdates },
        { type: 'separator' },
        { label: 'Poll Interval', submenu: [
          { label: '1 second', type: 'radio', click: () => setPollInterval(1000) },
          { label: '2 seconds', type: 'radio', checked: true, click: () => setPollInterval(2000) },
          { label: '5 seconds', type: 'radio', click: () => setPollInterval(5000) },
          { label: '10 seconds', type: 'radio', click: () => setPollInterval(10000) }
        ]}
      ]},
      { type: 'separator' },
      { label: 'Theme', submenu: [
        { label: 'Light', type: 'radio', click: () => setTheme('light') },
        { label: 'Dark', type: 'radio', click: () => setTheme('dark') },
        { label: 'System', type: 'radio', checked: true, click: () => setTheme('system') }
      ]}
    ]
  },
  {
    label: 'Connection',
    submenu: [
      { label: 'Manage Saved Credentials...', click: manageCredentials },
      { label: 'Clear All Saved Credentials', click: clearAllCredentials },
      { type: 'separator' },
      { label: 'Connection Status', enabled: false }, // Shows current connection info
    ]
  },
  {
    label: 'Help',
    submenu: [
      { label: 'About', click: showAbout },
      { label: 'Keyboard Shortcuts', click: showShortcuts }
    ]
  }
];
```

---

## 5. Docker/Web Deployment

### 5.1 Dockerfile
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build:web

# Production stage
FROM node:20-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Copy built files
COPY --from=builder /app/dist/web ./dist
COPY --from=builder /app/src/server ./server
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Set ownership
RUN chown -R appuser:appgroup /app

USER appuser

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "server/index.js"]
```

### 5.2 docker-compose.yml
```yaml
version: '3.8'

services:
  md-viewer:
    build: .
    image: md-viewer:latest
    container_name: md-viewer
    ports:
      - "3000:3000"
    volumes:
      # Mount directory containing markdown files (read-only)
      - ./docs:/app/docs:ro
    environment:
      - NODE_ENV=production
      - DOCS_PATH=/app/docs
    restart: unless-stopped
    # Resource limits
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
```

### 5.3 Web Server Implementation
```javascript
// server/index.js
const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;
const DOCS_PATH = process.env.DOCS_PATH || './docs';

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-eval'");
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, '../dist')));

// Health check endpoint
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// List available markdown files
app.get('/api/files', async (req, res) => {
  try {
    const files = await getMarkdownFiles(DOCS_PATH);
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Get file content
app.get('/api/file', async (req, res) => {
  const filePath = req.query.path;

  // Security: Prevent path traversal
  const resolvedPath = path.resolve(DOCS_PATH, filePath);
  if (!resolvedPath.startsWith(path.resolve(DOCS_PATH))) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Security: Only allow .md files
  if (!resolvedPath.endsWith('.md') && !resolvedPath.endsWith('.markdown')) {
    return res.status(403).json({ error: 'Only markdown files allowed' });
  }

  try {
    const content = await fs.readFile(resolvedPath, 'utf-8');
    res.json({ content, path: filePath });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else {
      res.status(500).json({ error: 'Failed to read file' });
    }
  }
});

// Serve index.html for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`MD Viewer running at http://localhost:${PORT}`);
});
```

### 5.4 Web Mode Differences
| Feature | Electron | Web/Docker |
|---------|----------|------------|
| File opening | Native dialog + drag/drop | Upload + mounted volume browsing |
| File watching | chokidar (real-time) | Polling (optional, configurable interval) |
| Recent files | Local storage (electron-store) | Browser localStorage |
| External links | Open in default browser | Open in new tab |
| File associations | Yes (.md) | N/A |
| Print | Native print dialog | Browser print |

---

## 6. Windows Deployment

### 6.1 electron-builder.yml
```yaml
appId: com.mdviewer.app
productName: MD Viewer
copyright: Copyright 2024

directories:
  output: dist/electron
  buildResources: build

files:
  - "dist/**/*"
  - "src/main/**/*"
  - "src/preload/**/*"
  - "package.json"

win:
  target:
    - target: nsis
      arch:
        - x64
  icon: build/icon.ico
  artifactName: "${productName}-Setup-${version}.${ext}"

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: "MD Viewer"
  include: build/installer.nsh
  # File associations
  fileAssociations:
    - ext: md
      name: Markdown
      description: Markdown Document
      icon: build/md-icon.ico
    - ext: markdown
      name: Markdown
      description: Markdown Document
      icon: build/md-icon.ico

publish: null
```

### 6.2 NSIS Installer Customization (build/installer.nsh)
```nsis
!macro customInstall
  ; Register file associations
  WriteRegStr HKCU "Software\Classes\.md" "" "MDViewer.Document"
  WriteRegStr HKCU "Software\Classes\.markdown" "" "MDViewer.Document"
  WriteRegStr HKCU "Software\Classes\MDViewer.Document" "" "Markdown Document"
  WriteRegStr HKCU "Software\Classes\MDViewer.Document\DefaultIcon" "" "$INSTDIR\resources\md-icon.ico"
  WriteRegStr HKCU "Software\Classes\MDViewer.Document\shell\open\command" "" '"$INSTDIR\MD Viewer.exe" "%1"'

  ; Refresh shell
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend

!macro customUninstall
  ; Remove file associations
  DeleteRegKey HKCU "Software\Classes\.md"
  DeleteRegKey HKCU "Software\Classes\.markdown"
  DeleteRegKey HKCU "Software\Classes\MDViewer.Document"

  ; Refresh shell
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend
```

### 6.3 Build Commands
```json
{
  "scripts": {
    "dev": "vite",
    "dev:electron": "concurrently \"vite\" \"electron .\"",
    "build:web": "vite build --config vite.config.web.js",
    "build:electron": "vite build && electron-builder --win",
    "build:all": "npm run build:web && npm run build:electron",
    "docker:build": "docker build -t md-viewer .",
    "docker:run": "docker-compose up -d"
  }
}
```

---

## 7. Configuration & Storage

### 7.1 User Preferences (Electron)
```javascript
// Using electron-store
const Store = require('electron-store');

const store = new Store({
  defaults: {
    theme: 'system',
    recentFiles: [],
    windowBounds: { width: 900, height: 700 },
    autoReload: true,
    fontSize: 16
  },
  schema: {
    theme: { type: 'string', enum: ['light', 'dark', 'system'] },
    recentFiles: { type: 'array', maxItems: 10 },
    windowBounds: {
      type: 'object',
      properties: {
        width: { type: 'number', minimum: 400 },
        height: { type: 'number', minimum: 300 },
        x: { type: 'number' },
        y: { type: 'number' }
      }
    },
    autoReload: { type: 'boolean' },
    fontSize: { type: 'number', minimum: 10, maximum: 32 }
  }
});
```

### 7.2 User Preferences (Web)
```javascript
// Using localStorage
const webStore = {
  get(key, defaultValue) {
    try {
      const value = localStorage.getItem(`mdviewer_${key}`);
      return value ? JSON.parse(value) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set(key, value) {
    localStorage.setItem(`mdviewer_${key}`, JSON.stringify(value));
  }
};
```

---

## 8. Error Handling

### 8.1 Error Types & Messages
| Error | User Message | Technical Action |
|-------|--------------|------------------|
| File not found | "File not found: {path}" | Show error state |
| Permission denied | "Cannot read file: Permission denied" | Show error state |
| Invalid markdown | (Render as-is, no error) | Best-effort rendering |
| Mermaid syntax error | "Diagram error: {message}" | Show error in diagram container |
| Network error (web) | "Network error. Check your connection." | Retry button |
| Large file warning | "Large file detected. This may take a moment." | Show progress |

### 8.2 Global Error Handler
```javascript
// Main process
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  // Log to file, don't crash
});

// Renderer process
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Renderer error:', { message, source, lineno, colno, error });
  return true; // Prevent default handling
};
```

---

## 9. Performance Requirements

### 9.1 Targets
| Metric | Target |
|--------|--------|
| Initial load | < 1 second |
| File render (< 100KB) | < 200ms |
| File render (< 1MB) | < 1 second |
| File render (< 5MB) | < 3 seconds |
| Mermaid diagram render | < 500ms per diagram |
| Memory usage (idle) | < 100MB |
| Memory usage (5MB file) | < 300MB |

### 9.2 Optimization Strategies
- Lazy-load Mermaid library (only when needed)
- Virtual scrolling for very long documents (> 10000 lines)
- Debounce file watching events
- Cache rendered HTML for recently viewed files
- Use requestIdleCallback for non-critical updates

---

## 10. Testing Strategy

### 10.1 Test Files
Create sample markdown files covering:
- All heading levels (h1-h6)
- All text formatting (bold, italic, strikethrough, code)
- Code blocks with various languages (js, python, rust, bash, etc.)
- Tables (simple and complex)
- Task lists
- Images (local, remote, broken)
- Links (external, internal, relative, mailto)
- Blockquotes (single and nested)
- Horizontal rules
- Math/LaTeX (inline and block)
- Mermaid diagrams (all types)
- Very long documents (10000+ lines)
- Large single code blocks
- Unicode and emoji
- Edge cases (empty file, binary file, huge single line)

### 10.2 Unit Tests
```javascript
// Example test structure
describe('Markdown Renderer', () => {
  test('renders headings correctly', () => {});
  test('handles GFM tables', () => {});
  test('sanitizes dangerous HTML', () => {});
  test('resolves relative image paths', () => {});
});

describe('Mermaid Handler', () => {
  test('renders flowchart', () => {});
  test('handles syntax errors gracefully', () => {});
  test('applies theme correctly', () => {});
});

describe('Zoom Controller', () => {
  test('zooms in correctly', () => {});
  test('zooms out correctly', () => {});
  test('respects min/max scale', () => {});
  test('pans with mouse drag', () => {});
});
```

### 10.3 E2E Tests (Playwright)
- Open file via dialog
- Open file via drag and drop
- Open file via command line argument
- Verify markdown renders correctly
- Verify mermaid diagrams render
- Test diagram zoom controls
- Test theme switching
- Test keyboard shortcuts
- Test file watching updates
- Test recent files functionality

---

## 11. Implementation Phases

### Phase 1: Core Foundation
1. Set up project with Vite + Electron
2. Implement basic main process (window creation, menu)
3. Implement preload script with context bridge
4. Create minimal HTML/CSS structure
5. Implement basic markdown rendering with marked

### Phase 2: Full Markdown Support
1. Add syntax highlighting (highlight.js)
2. Add KaTeX support for math
3. Implement custom renderers (images, links)
4. Add DOMPurify sanitization
5. Implement theme system (light/dark/system)

### Phase 3: Mermaid & Zoom
1. Integrate Mermaid library
2. Implement diagram detection and rendering
3. Create zoom UI components
4. Implement ZoomController class
5. Add keyboard shortcuts for zoom
6. Implement fullscreen mode for diagrams

### Phase 4: Local File Handling
1. Implement file opening (dialog, drag/drop, command line)
2. Implement local file watching with chokidar
3. Implement recent files with electron-store
4. Add error handling for all file operations
5. Implement scroll position preservation on reload

### Phase 5: Remote File Access
1. Implement RemotePathParser for URL parsing
2. Implement SSH/SFTP client with ssh2-sftp-client
3. Implement SMB client with smb2
4. Implement NFS mount helper
5. Create unified RemoteFileManager interface
6. Implement credential management with secure storage
7. Create credential prompt dialog UI
8. Create remote file browser dialog UI

### Phase 6: Live Updates
1. Implement RemoteFileWatcher with polling
2. Implement unified FileWatcherManager
3. Add poll interval configuration UI
4. Implement connection loss detection and reconnection
5. Add toast notifications for file updates
6. Add connection status indicators

### Phase 7: Polish & UX
1. Create empty state UI
2. Add loading indicators for remote connections
3. Implement find in document (Ctrl+F)
4. Add tooltips and keyboard shortcut hints
5. Implement print styling
6. Add connection menu and credential management UI

### Phase 8: Windows Build
1. Configure electron-builder
2. Create application icons
3. Set up NSIS installer
4. Test file associations
5. Create signed installer (optional)

### Phase 9: Docker/Web Mode
1. Create Express server
2. Implement file API endpoints
3. Adapt renderer for web environment
4. Create Dockerfile and docker-compose
5. Test container deployment
6. Note: Remote file access not available in web mode (security)

### Phase 10: Testing & Documentation
1. Write unit tests (including remote path parsing)
2. Write E2E tests with Playwright
3. Test with various markdown files
4. Test remote connections (SSH, SMB, NFS)
5. Test live update functionality
6. Performance testing and optimization
7. Create README with usage instructions

---

## 12. Dependencies (package.json)

```json
{
  "name": "md-viewer",
  "version": "1.0.0",
  "description": "Minimalist Markdown Viewer",
  "main": "src/main/index.js",
  "scripts": {
    "dev": "vite",
    "dev:electron": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "build:web": "vite build --config vite.config.web.js",
    "build:renderer": "vite build",
    "build:electron": "npm run build:renderer && electron-builder --win",
    "build:docker": "npm run build:web && docker build -t md-viewer .",
    "start:server": "node src/server/index.js",
    "test": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "chokidar": "^3.5.3",
    "dompurify": "^3.0.6",
    "electron-store": "^8.1.0",
    "express": "^4.18.2",
    "highlight.js": "^11.9.0",
    "katex": "^0.16.9",
    "marked": "^11.1.0",
    "marked-footnote": "^1.2.0",
    "mermaid": "^10.6.1",
    "ssh2-sftp-client": "^9.1.0",
    "smb2": "^0.2.12"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "concurrently": "^8.2.2",
    "electron": "^28.0.0",
    "electron-builder": "^24.9.1",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "wait-on": "^7.2.0"
  }
}
```

---

## 13. File Checklist

### Required Files

#### Configuration
- [ ] `package.json` - Dependencies and scripts
- [ ] `vite.config.js` - Vite configuration (electron)
- [ ] `vite.config.web.js` - Vite configuration (web)
- [ ] `electron-builder.yml` - Electron builder config
- [ ] `Dockerfile` - Docker build instructions
- [ ] `docker-compose.yml` - Docker compose config
- [ ] `.gitignore` - Git ignore rules

#### Main Process (Electron)
- [ ] `src/main/index.js` - Electron main process entry
- [ ] `src/main/menu.js` - Application menu
- [ ] `src/main/ipc-handlers.js` - IPC handlers
- [ ] `src/main/file-watcher.js` - Local file watching (chokidar)
- [ ] `src/main/remote-watcher.js` - Remote file polling
- [ ] `src/main/window-manager.js` - Window management

#### Remote File Access
- [ ] `src/main/remote/index.js` - Unified remote file interface
- [ ] `src/main/remote/path-parser.js` - Remote path URL parsing
- [ ] `src/main/remote/ssh-client.js` - SSH/SFTP client
- [ ] `src/main/remote/smb-client.js` - SMB/CIFS client
- [ ] `src/main/remote/nfs-client.js` - NFS mount helper
- [ ] `src/main/remote/credentials.js` - Credential management

#### Preload
- [ ] `src/preload/preload.js` - Context bridge for renderer

#### Renderer (Frontend)
- [ ] `src/renderer/index.html` - Main HTML
- [ ] `src/renderer/js/app.js` - Main renderer logic
- [ ] `src/renderer/js/markdown-renderer.js` - Markdown processing
- [ ] `src/renderer/js/mermaid-handler.js` - Mermaid integration
- [ ] `src/renderer/js/zoom-controller.js` - Zoom functionality
- [ ] `src/renderer/js/file-handler.js` - File operations
- [ ] `src/renderer/js/theme-manager.js` - Theme switching
- [ ] `src/renderer/js/remote-dialog.js` - Remote file browser UI
- [ ] `src/renderer/js/credentials-dialog.js` - Credential prompt UI
- [ ] `src/renderer/js/toast-notifications.js` - Toast/banner notifications

#### Styles
- [ ] `src/renderer/styles/main.css` - Core styles
- [ ] `src/renderer/styles/markdown.css` - Markdown content styles
- [ ] `src/renderer/styles/mermaid.css` - Diagram styles
- [ ] `src/renderer/styles/dialogs.css` - Dialog/modal styles
- [ ] `src/renderer/styles/themes/light.css` - Light theme
- [ ] `src/renderer/styles/themes/dark.css` - Dark theme

#### Web Server (Docker)
- [ ] `src/server/index.js` - Express server
- [ ] `src/server/routes.js` - API routes

#### Build Assets
- [ ] `build/icon.ico` - Windows icon
- [ ] `build/icon.png` - PNG icon (256x256)
- [ ] `build/md-icon.ico` - File association icon
- [ ] `build/installer.nsh` - NSIS installer script

#### Test Files
- [ ] `test/sample-files/basic.md` - Basic markdown
- [ ] `test/sample-files/mermaid.md` - Mermaid diagrams
- [ ] `test/sample-files/large.md` - Large file for performance
- [ ] `test/unit/markdown-renderer.test.js`
- [ ] `test/unit/zoom-controller.test.js`
- [ ] `test/unit/path-parser.test.js`
- [ ] `test/e2e/basic.spec.js`

---

## 14. Success Criteria

The application is complete when:

1. **Local File Viewing**
   - Can open .md files via all documented methods (dialog, drag/drop, command line, file association)
   - Renders all GFM markdown correctly
   - Handles edge cases gracefully (large files, encoding issues, missing files)

2. **Remote File Access**
   - Can connect to SSH/SFTP servers with password or key authentication
   - Can connect to SMB/CIFS shares with domain authentication
   - Can mount and read from NFS exports
   - Credentials can be saved securely and retrieved
   - Remote file browser allows navigating and selecting files
   - Connection errors are handled gracefully with retry options

3. **Live Updates**
   - Local files update in real-time via filesystem events
   - Remote files update via polling with configurable intervals
   - Scroll position is preserved on file updates
   - Connection loss is detected and auto-reconnection attempted
   - User is notified of file changes via toast notifications

4. **Mermaid Support**
   - All diagram types render correctly
   - Syntax errors show helpful messages
   - Theme matches application theme

5. **Zoom Functionality**
   - All zoom controls work (buttons, keyboard, mouse wheel)
   - Pan/drag works smoothly
   - Fullscreen mode works
   - Touch gestures work on supported devices

6. **Deployment**
   - Windows installer works and creates file associations
   - Docker container runs and serves local/mounted files correctly
   - Both modes are stable under normal use

7. **User Experience**
   - App loads in under 1 second
   - Theme switching is instant
   - File watching updates smoothly
   - Remote connections establish within 10 seconds
   - No crashes or freezes during normal operation

---

*End of Specification*
