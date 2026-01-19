const chokidar = require('chokidar');
const crypto = require('crypto');
const fs = require('fs').promises;

class LocalFileWatcher {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
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

    this.watcher.on('change', async () => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(async () => {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          this.mainWindow.webContents.send('file-changed', {
            type: 'modified',
            content
          });
        } catch (error) {
          this.mainWindow.webContents.send('file-error', {
            message: error.message,
            path: filePath
          });
        }
      }, this.debounceMs);
    });

    this.watcher.on('unlink', () => {
      this.mainWindow.webContents.send('file-changed', { type: 'deleted' });
    });

    this.watcher.on('error', (error) => {
      console.error('File watcher error:', error);
    });
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}

class RemoteFileWatcher {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.pollInterval = null;
    this.lastHash = null;
    this.lastModified = null;
    this.pollIntervalMs = 2000;
    this.currentPath = null;
    this.remoteClient = null;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  async watch(remotePath, remoteClient, pollIntervalMs = 2000) {
    this.stop();
    this.currentPath = remotePath;
    this.remoteClient = remoteClient;
    this.pollIntervalMs = pollIntervalMs;
    this.retryCount = 0;

    try {
      // Get initial state
      const initialContent = await this.remoteClient.readFile(remotePath);
      this.lastHash = this.hashContent(initialContent);
      this.lastModified = await this.remoteClient.getModifiedTime(remotePath);

      // Start polling
      this.pollInterval = setInterval(() => this.checkForChanges(), this.pollIntervalMs);
    } catch (error) {
      console.error('Failed to start remote watcher:', error);
      this.mainWindow.webContents.send('file-error', {
        message: error.message,
        path: remotePath
      });
    }
  }

  async checkForChanges() {
    if (!this.remoteClient || !this.currentPath) return;

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
          this.mainWindow.webContents.send('file-changed', {
            type: 'modified',
            remote: true,
            content: content
          });
        }
      }

      // Reset retry count on successful check
      this.retryCount = 0;
    } catch (error) {
      if (error.code === 'ENOENT' || error.message.includes('not found')) {
        this.mainWindow.webContents.send('file-changed', { type: 'deleted', remote: true });
        this.stop();
      } else if (error.code === 'ECONNREFUSED' || error.message.includes('connection')) {
        this.retryCount++;
        this.mainWindow.webContents.send('remote-connection-lost', {
          path: this.currentPath,
          retryCount: this.retryCount,
          maxRetries: this.maxRetries
        });

        if (this.retryCount >= this.maxRetries) {
          this.stop();
          this.mainWindow.webContents.send('remote-connection-failed', {
            path: this.currentPath
          });
        }
      } else {
        console.error('Remote file check error:', error);
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

  setPollInterval(ms) {
    this.pollIntervalMs = Math.max(500, Math.min(30000, ms));
    if (this.currentPath && this.remoteClient) {
      this.stop();
      this.pollInterval = setInterval(() => this.checkForChanges(), this.pollIntervalMs);
    }
  }
}

class FileWatcherManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.localWatcher = new LocalFileWatcher(mainWindow);
    this.remoteWatcher = new RemoteFileWatcher(mainWindow);
    this.currentType = null;
  }

  watch(filePath) {
    this.stop();
    this.currentType = 'local';
    this.localWatcher.watch(filePath);
  }

  watchRemote(remotePath, remoteClient, pollIntervalMs) {
    this.stop();
    this.currentType = 'remote';
    this.remoteWatcher.watch(remotePath, remoteClient, pollIntervalMs);
  }

  stop() {
    this.localWatcher.stop();
    this.remoteWatcher.stop();
    this.currentType = null;
  }

  setPollInterval(ms) {
    if (this.currentType === 'remote') {
      this.remoteWatcher.setPollInterval(ms);
    }
  }

  setEnabled(enabled) {
    if (!enabled) {
      this.stop();
    }
  }
}

module.exports = { LocalFileWatcher, RemoteFileWatcher, FileWatcherManager };
