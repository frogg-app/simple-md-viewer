const SMB2 = require('@marsaud/smb2');

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
        autoCloseTimeout: 0
      });

      // Test connection by checking if root exists
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
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  async getModifiedTime(remotePath) {
    return new Promise((resolve, reject) => {
      const smbPath = remotePath.replace(/\//g, '\\').replace(/^\\/, '');

      // SMB2 doesn't have a direct stat method, we'll use exists and file metadata
      this.client.readFile(smbPath, { encoding: 'utf8' }, (err) => {
        if (err) {
          reject(err);
        } else {
          // Return current time as a fallback since SMB2 package doesn't provide mtime
          resolve(Date.now());
        }
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
          resolve(
            files
              .filter(f => {
                const isMarkdown = f.endsWith('.md') || f.endsWith('.markdown');
                const isDirectory = !f.includes('.');
                return isMarkdown || isDirectory;
              })
              .map(name => ({
                name,
                path: `${remotePath}/${name}`.replace(/\/+/g, '/'),
                isDirectory: !name.includes('.')
              }))
              .sort((a, b) => {
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                return a.name.localeCompare(b.name);
              })
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

  async reconnect() {
    await this.disconnect();
    await this.connect(this.connectionConfig);
  }

  getProtocol() {
    return 'smb';
  }
}

module.exports = { SMBFileClient };
