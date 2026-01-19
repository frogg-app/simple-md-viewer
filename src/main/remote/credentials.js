const { safeStorage, ipcMain } = require('electron');
const Store = require('electron-store');

class CredentialManager {
  constructor() {
    this.store = new Store({ name: 'credentials', encryptionKey: 'md-viewer-creds' });
    this.sessionCredentials = new Map();
    this.pendingPrompts = new Map();
  }

  async getCredentials(parsed, mainWindow) {
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
    if (mainWindow) {
      const credentials = await this.promptForCredentials(parsed, mainWindow);
      return credentials;
    }

    return null;
  }

  getStoredCredentials(key) {
    const encrypted = this.store.get(key);
    if (!encrypted) return null;

    try {
      if (safeStorage.isEncryptionAvailable()) {
        const decrypted = safeStorage.decryptString(Buffer.from(encrypted, 'base64'));
        return JSON.parse(decrypted);
      } else {
        // Fallback if encryption not available
        return JSON.parse(Buffer.from(encrypted, 'base64').toString('utf-8'));
      }
    } catch {
      return null;
    }
  }

  async saveCredentials(key, credentials, persist = false) {
    if (persist) {
      try {
        let encrypted;
        if (safeStorage.isEncryptionAvailable()) {
          encrypted = safeStorage.encryptString(JSON.stringify(credentials));
        } else {
          encrypted = Buffer.from(JSON.stringify(credentials), 'utf-8');
        }
        this.store.set(key, encrypted.toString('base64'));
      } catch (error) {
        console.error('Failed to save credentials:', error);
        // Fall back to session storage
        this.sessionCredentials.set(key, credentials);
      }
    } else {
      this.sessionCredentials.set(key, credentials);
    }
  }

  async promptForCredentials(parsed, mainWindow) {
    return new Promise((resolve) => {
      const promptId = Date.now().toString();

      mainWindow.webContents.send('request-credentials', {
        id: promptId,
        protocol: parsed.protocol,
        host: parsed.host,
        defaultUsername: parsed.username || process.env.USER || process.env.USERNAME || ''
      });

      const handler = (event, response) => {
        if (response.id === promptId) {
          ipcMain.removeListener('credentials-response', handler);

          if (response.cancelled) {
            resolve(null);
          } else {
            const key = `${parsed.protocol}://${parsed.host}`;
            this.saveCredentials(key, response.credentials, response.remember);
            resolve(response.credentials);
          }
        }
      };

      ipcMain.on('credentials-response', handler);

      // Timeout after 5 minutes
      setTimeout(() => {
        ipcMain.removeListener('credentials-response', handler);
        resolve(null);
      }, 300000);
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

  listSavedCredentials() {
    const keys = [];
    for (const key of Object.keys(this.store.store)) {
      keys.push(key);
    }
    return keys;
  }
}

module.exports = { CredentialManager };
