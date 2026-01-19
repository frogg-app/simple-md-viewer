export class FileHandler {
  constructor() {
    this.currentFile = null;
    this.isRemote = false;
  }

  isElectron() {
    return window.electronAPI && window.electronAPI.isElectron;
  }

  async openLocalFile(filePath) {
    if (this.isElectron()) {
      await window.electronAPI.openFile(filePath);
    }
  }

  async openRemoteFile(remotePath, credentials) {
    if (this.isElectron()) {
      await window.electronAPI.openRemoteFile(remotePath, credentials);
    }
  }

  async reload() {
    if (this.isElectron()) {
      await window.electronAPI.reloadFile();
    }
  }

  setCurrentFile(file) {
    this.currentFile = file.path;
    this.isRemote = file.isRemote || false;
  }

  getCurrentFile() {
    return {
      path: this.currentFile,
      isRemote: this.isRemote
    };
  }

  async getRecentFiles() {
    if (this.isElectron()) {
      return await window.electronAPI.getRecentFiles();
    }
    // Web mode: use localStorage
    try {
      const stored = localStorage.getItem('mdviewer_recentFiles');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  addToRecentFiles(filePath) {
    if (!this.isElectron()) {
      // Web mode: save to localStorage
      try {
        let recentFiles = JSON.parse(localStorage.getItem('mdviewer_recentFiles') || '[]');
        recentFiles = recentFiles.filter(f => f !== filePath);
        recentFiles.unshift(filePath);
        recentFiles = recentFiles.slice(0, 10);
        localStorage.setItem('mdviewer_recentFiles', JSON.stringify(recentFiles));
      } catch {
        // Ignore localStorage errors
      }
    }
  }

  detectEncoding(buffer) {
    // Check for BOM
    if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
      return 'utf-8';
    }
    if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
      return 'utf-16be';
    }
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
      return 'utf-16le';
    }

    // Default to UTF-8
    return 'utf-8';
  }

  isBinaryFile(buffer) {
    // Check first 512 bytes for null bytes
    const checkLength = Math.min(buffer.length, 512);
    for (let i = 0; i < checkLength; i++) {
      if (buffer[i] === 0) {
        return true;
      }
    }
    return false;
  }

  getFileName(filePath) {
    const parts = filePath.split(/[/\\]/);
    return parts[parts.length - 1];
  }

  getDirectory(filePath) {
    const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
    return lastSlash > 0 ? filePath.substring(0, lastSlash) : '';
  }

  isMarkdownFile(filePath) {
    const lower = filePath.toLowerCase();
    return lower.endsWith('.md') || lower.endsWith('.markdown');
  }

  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }
}
