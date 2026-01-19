# Simple MD Viewer

A minimalist markdown viewer with support for GitHub Flavored Markdown, Mermaid diagrams, syntax highlighting, and LaTeX math. Available as a Docker web app or Electron desktop application.

## Features

- **GitHub Flavored Markdown** - Tables, task lists, strikethrough, autolinks
- **Mermaid Diagrams** - Flowcharts, sequence diagrams, pie charts, git graphs, and more with zoom controls
- **Syntax Highlighting** - Code blocks with language-specific highlighting
- **LaTeX/KaTeX Math** - Inline and block math expressions
- **Remote File Access** - Connect via SSH/SFTP, SMB/CIFS, or NFS
- **Live File Watching** - Auto-reload when files change
- **Dark Theme** - Easy on the eyes
- **Drag & Drop** - Drop markdown files directly into the viewer
- **Keyboard Shortcuts** - Quick navigation and actions

## Quick Start

### Docker (Recommended for Web)

```bash
# Clone the repository
git clone https://github.com/frogg-app/simple-md-viewer.git
cd simple-md-viewer

# Build and run with Docker Compose
docker-compose up -d

# Access at http://localhost:3000
```

### Manual Setup

```bash
# Install dependencies
npm install

# Build web version
npm run build:web

# Start server
npm run start:server
```

### Electron (Desktop)

```bash
# Install dependencies
npm install

# Development mode
npm run dev:electron

# Build for Windows
npm run build:electron
```

## Configuration

### Docker Compose

```yaml
services:
  md-viewer:
    build: .
    ports:
      - "3000:3000"
    volumes:
      # Mount your markdown files directory
      - ./docs:/app/docs:ro
    environment:
      - DOCS_PATH=/app/docs
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `DOCS_PATH` | `/app/docs` | Path to markdown files directory |

## Usage

### Loading Files

1. **Docs Folder** - Place files in the mounted `docs/` directory
2. **Drag & Drop** - Drag `.md` files onto the browser window
3. **Remote Files** - Press `Ctrl+Shift+O` to connect to remote servers
4. **Direct URL** - Access files via `/api/file?path=filename.md`

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+O` | Open remote file |
| `Ctrl+R` | Reload file |
| `Ctrl++` | Zoom in |
| `Ctrl+-` | Zoom out |
| `Ctrl+0` | Reset zoom |
| `Ctrl+F` | Find in document |
| `Esc` | Go home / Close dialog |
| `F11` | Toggle fullscreen |

### Settings

Click the gear icon on the welcome screen to configure:
- Show/hide Docs Folder section
- Show/hide Recent Files section
- Change home shortcut key

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Web interface |
| `GET /api/files` | List files in docs folder |
| `GET /api/file?path=` | Get file content |
| `GET /health` | Health check |

## Development

```bash
# Run development server with hot reload
npm run dev

# Run tests
npm test

# Run E2E tests
npm run test:e2e
```

## Project Structure

```
md-viewer/
├── src/
│   ├── main/           # Electron main process
│   ├── renderer/       # Frontend (shared web/electron)
│   │   ├── js/         # JavaScript modules
│   │   ├── styles/     # CSS stylesheets
│   │   └── index.html  # Entry point
│   └── server/         # Express server for Docker
├── docs/               # Markdown files directory
├── dist/               # Build output
├── Dockerfile          # Docker image definition
└── docker-compose.yml  # Docker Compose config
```

## Tech Stack

- **Frontend**: Vanilla JS, Vite
- **Markdown**: marked, DOMPurify
- **Diagrams**: Mermaid
- **Math**: KaTeX
- **Syntax**: highlight.js
- **Desktop**: Electron
- **Server**: Express.js
- **Remote**: ssh2-sftp-client, smb2

## License

MIT
