const { SSHFileClient } = require('./ssh-client');
const { SMBFileClient } = require('./smb-client');
const { NFSClient } = require('./nfs-client');
const { RemotePathParser } = require('./path-parser');
const { CredentialManager } = require('./credentials');

class RemoteFileManager {
  constructor() {
    this.clients = new Map();
    this.credentialManager = new CredentialManager();
    this.mainWindow = null;
  }

  setMainWindow(mainWindow) {
    this.mainWindow = mainWindow;
  }

  async openFile(remotePath, providedCredentials = null) {
    const parsed = RemotePathParser.parse(remotePath);

    if (parsed.protocol === 'local') {
      return { type: 'local', path: parsed.path };
    }

    const clientKey = `${parsed.protocol}://${parsed.host}:${parsed.port}`;
    let client = this.clients.get(clientKey);

    if (!client || !client.connected) {
      client = await this.createClient(parsed, providedCredentials);
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

  async createClient(parsed, providedCredentials = null) {
    // Get credentials (from provided, stored, or prompt user)
    let credentials = providedCredentials || {
      username: parsed.username,
      password: parsed.password
    };

    if (!credentials.username && this.mainWindow) {
      credentials = await this.credentialManager.getCredentials(parsed, this.mainWindow);
      if (!credentials) {
        throw new Error('Authentication cancelled');
      }
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
          export: parsed.path.split('/')[1],
          ...credentials
        });
        break;

      default:
        throw new Error(`Unsupported protocol: ${parsed.protocol}`);
    }

    return client;
  }

  async connect(config) {
    const { protocol, host, port, ...credentials } = config;
    const parsed = { protocol, host, port };

    const clientKey = `${protocol}://${host}:${port}`;
    let client = this.clients.get(clientKey);

    if (!client || !client.connected) {
      client = await this.createClient(parsed, credentials);
      this.clients.set(clientKey, client);
    }

    return client;
  }

  async listDirectory(remotePath) {
    const parsed = RemotePathParser.parse(remotePath);
    const clientKey = `${parsed.protocol}://${parsed.host}:${parsed.port}`;
    const client = this.clients.get(clientKey);

    if (!client || !client.connected) {
      throw new Error('Not connected');
    }

    return client.listDirectory(parsed.path);
  }

  getClient(remotePath) {
    const parsed = RemotePathParser.parse(remotePath);
    const clientKey = `${parsed.protocol}://${parsed.host}:${parsed.port}`;
    return this.clients.get(clientKey);
  }

  async closeClient(remotePath) {
    const parsed = RemotePathParser.parse(remotePath);
    const clientKey = `${parsed.protocol}://${parsed.host}:${parsed.port}`;
    const client = this.clients.get(clientKey);

    if (client) {
      await client.disconnect();
      this.clients.delete(clientKey);
    }
  }

  async closeAll() {
    for (const client of this.clients.values()) {
      try {
        await client.disconnect();
      } catch (error) {
        console.error('Error disconnecting client:', error);
      }
    }
    this.clients.clear();
  }

  isRemotePath(input) {
    return RemotePathParser.isRemote(input);
  }

  parsePath(input) {
    return RemotePathParser.parse(input);
  }
}

module.exports = { RemoteFileManager, RemotePathParser };
