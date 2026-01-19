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
      password: config.password,
      privateKey: config.privateKey,
      passphrase: config.passphrase,
      readyTimeout: 10000,
      retries: 3,
      retry_factor: 2,
      retry_minTimeout: 1000
    };

    // Remove undefined values
    Object.keys(this.connectionConfig).forEach(key => {
      if (this.connectionConfig[key] === undefined) {
        delete this.connectionConfig[key];
      }
    });

    await this.client.connect(this.connectionConfig);
    this.connected = true;
  }

  async readFile(remotePath) {
    if (!this.connected) {
      throw new Error('Not connected');
    }

    const buffer = await this.client.get(remotePath);
    return buffer.toString('utf-8');
  }

  async getModifiedTime(remotePath) {
    if (!this.connected) {
      throw new Error('Not connected');
    }

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
    if (!this.connected) {
      throw new Error('Not connected');
    }

    const list = await this.client.list(remotePath);
    return list
      .filter(item =>
        item.name.endsWith('.md') ||
        item.name.endsWith('.markdown') ||
        item.type === 'd'
      )
      .map(item => ({
        name: item.name,
        path: `${remotePath}/${item.name}`.replace(/\/+/g, '/'),
        isDirectory: item.type === 'd',
        size: item.size,
        modified: item.modifyTime
      }))
      .sort((a, b) => {
        // Directories first, then alphabetically
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
  }

  async disconnect() {
    if (this.connected) {
      await this.client.end();
      this.connected = false;
    }
  }

  async reconnect() {
    await this.disconnect();
    await this.connect(this.connectionConfig);
  }

  getProtocol() {
    return 'ssh';
  }
}

module.exports = { SSHFileClient };
