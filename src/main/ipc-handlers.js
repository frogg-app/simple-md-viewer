const { nativeTheme, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;

function setupIpcHandlers(ipcMain, context) {
  const {
    store,
    openFile,
    openRemoteFile,
    showOpenDialog,
    showRemoteDialog,
    reloadFile,
    setTheme,
    toggleLiveUpdates,
    disconnectRemote,
    getRemoteFileManager
  } = context;

  // Get initial state
  ipcMain.handle('get-initial-state', () => {
    return {
      theme: store.get('theme'),
      recentFiles: store.get('recentFiles'),
      fontSize: store.get('fontSize'),
      liveUpdates: store.get('liveUpdates'),
      pollInterval: store.get('pollInterval'),
      systemTheme: nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
    };
  });

  // File operations
  ipcMain.handle('open-file-dialog', showOpenDialog);

  ipcMain.handle('open-file', async (event, filePath) => {
    await openFile(filePath);
  });

  ipcMain.handle('open-remote-file', async (event, { remotePath, credentials }) => {
    await openRemoteFile(remotePath, credentials);
  });

  ipcMain.handle('reload-file', reloadFile);

  // Read file for drag and drop
  ipcMain.handle('read-dropped-file', async (event, filePath) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return {
        success: true,
        content,
        path: filePath,
        fileName: path.basename(filePath)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Theme
  ipcMain.handle('set-theme', (event, theme) => {
    setTheme(theme);
  });

  ipcMain.handle('get-system-theme', () => {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  });

  // Listen for system theme changes
  nativeTheme.on('updated', () => {
    const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    // Send to all windows
    const { BrowserWindow } = require('electron');
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('system-theme-changed', theme);
    });
  });

  // Settings
  ipcMain.handle('get-setting', (event, key) => {
    return store.get(key);
  });

  ipcMain.handle('set-setting', (event, key, value) => {
    store.set(key, value);
  });

  // Recent files
  ipcMain.handle('get-recent-files', () => {
    return store.get('recentFiles');
  });

  ipcMain.handle('clear-recent-files', () => {
    store.set('recentFiles', []);
  });

  // Remote file operations
  ipcMain.handle('connect-remote', async (event, { protocol, host, port, credentials }) => {
    const remoteFileManager = getRemoteFileManager();
    try {
      const client = await remoteFileManager.connect({ protocol, host, port, ...credentials });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('list-remote-directory', async (event, { remotePath }) => {
    const remoteFileManager = getRemoteFileManager();
    try {
      const files = await remoteFileManager.listDirectory(remotePath);
      return { success: true, files };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('disconnect-remote', disconnectRemote);

  // Credential management
  ipcMain.on('credentials-response', (event, response) => {
    // This is handled by the credential manager
  });

  ipcMain.handle('save-credentials', async (event, { key, credentials, persist }) => {
    const remoteFileManager = getRemoteFileManager();
    await remoteFileManager.credentialManager.saveCredentials(key, credentials, persist);
  });

  ipcMain.handle('get-saved-credentials', async (event, key) => {
    const remoteFileManager = getRemoteFileManager();
    return remoteFileManager.credentialManager.getStoredCredentials(key);
  });

  ipcMain.handle('clear-all-credentials', async () => {
    const remoteFileManager = getRemoteFileManager();
    remoteFileManager.credentialManager.clearAllCredentials();
  });

  // External links
  ipcMain.handle('open-external', (event, url) => {
    shell.openExternal(url);
  });

  // Resolve relative paths
  ipcMain.handle('resolve-path', (event, basePath, relativePath) => {
    const baseDir = path.dirname(basePath);
    return path.resolve(baseDir, relativePath);
  });
}

module.exports = { setupIpcHandlers };
