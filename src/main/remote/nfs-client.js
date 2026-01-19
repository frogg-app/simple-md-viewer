const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class NFSClient {
  constructor() {
    this.mountPoint = null;
    this.mounted = false;
    this.connectionConfig = null;
  }

  async connect(config) {
    this.connectionConfig = config;

    // Create temporary mount point
    this.mountPoint = path.join(os.tmpdir(), `mdviewer-nfs-${Date.now()}`);
    await fs.mkdir(this.mountPoint, { recursive: true });

    const nfsPath = `${config.host}:${config.export}`;

    return new Promise((resolve, reject) => {
      // Mount options for read-only access
      const mountCmd =
        process.platform === 'win32'
          ? `mount -o anon ${nfsPath} ${this.mountPoint}`
          : `mount -t nfs -o ro,soft,timeo=10 ${nfsPath} ${this.mountPoint}`;

      exec(mountCmd, (error) => {
        if (error) {
          // Clean up mount point on failure
          fs.rmdir(this.mountPoint).catch(() => {});
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

  async listDirectory(remotePath) {
    const localPath = this.getLocalPath(remotePath);
    const entries = await fs.readdir(localPath, { withFileTypes: true });

    return entries
      .filter(entry => {
        if (entry.isDirectory()) return true;
        return entry.name.endsWith('.md') || entry.name.endsWith('.markdown');
      })
      .map(entry => ({
        name: entry.name,
        path: `${remotePath}/${entry.name}`.replace(/\/+/g, '/'),
        isDirectory: entry.isDirectory()
      }))
      .sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
  }

  async disconnect() {
    if (this.mounted && this.mountPoint) {
      return new Promise((resolve) => {
        const unmountCmd =
          process.platform === 'win32'
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

  async reconnect() {
    await this.disconnect();
    await this.connect(this.connectionConfig);
  }

  getProtocol() {
    return 'nfs';
  }
}

module.exports = { NFSClient };
