const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Initial state
  getInitialState: () => ipcRenderer.invoke('get-initial-state'),

  // File operations
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  openRemoteFile: (remotePath, credentials) =>
    ipcRenderer.invoke('open-remote-file', { remotePath, credentials }),
  readDroppedFile: (filePath) => ipcRenderer.invoke('read-dropped-file', filePath),
  reloadFile: () => ipcRenderer.invoke('reload-file'),
  resolvePath: (basePath, relativePath) =>
    ipcRenderer.invoke('resolve-path', basePath, relativePath),

  // Remote operations
  connectRemote: (config) => ipcRenderer.invoke('connect-remote', config),
  listRemoteDirectory: (remotePath) =>
    ipcRenderer.invoke('list-remote-directory', { remotePath }),
  disconnectRemote: () => ipcRenderer.invoke('disconnect-remote'),

  // Credentials
  saveCredentials: (key, credentials, persist) =>
    ipcRenderer.invoke('save-credentials', { key, credentials, persist }),
  getSavedCredentials: (key) => ipcRenderer.invoke('get-saved-credentials', key),
  clearAllCredentials: () => ipcRenderer.invoke('clear-all-credentials'),
  sendCredentialsResponse: (response) =>
    ipcRenderer.send('credentials-response', response),

  // Theme
  setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
  getSystemTheme: () => ipcRenderer.invoke('get-system-theme'),

  // Settings
  getSetting: (key) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),

  // Recent files
  getRecentFiles: () => ipcRenderer.invoke('get-recent-files'),
  clearRecentFiles: () => ipcRenderer.invoke('clear-recent-files'),

  // External links
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Event listeners
  onFileOpened: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('file-opened', handler);
    return () => ipcRenderer.removeListener('file-opened', handler);
  },

  onFileReloaded: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('file-reloaded', handler);
    return () => ipcRenderer.removeListener('file-reloaded', handler);
  },

  onFileChanged: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('file-changed', handler);
    return () => ipcRenderer.removeListener('file-changed', handler);
  },

  onFileError: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('file-error', handler);
    return () => ipcRenderer.removeListener('file-error', handler);
  },

  onThemeChanged: (callback) => {
    const handler = (event, theme) => callback(theme);
    ipcRenderer.on('theme-changed', handler);
    return () => ipcRenderer.removeListener('theme-changed', handler);
  },

  onSystemThemeChanged: (callback) => {
    const handler = (event, theme) => callback(theme);
    ipcRenderer.on('system-theme-changed', handler);
    return () => ipcRenderer.removeListener('system-theme-changed', handler);
  },

  onOpenFileRequest: (callback) => {
    const handler = (event, filePath) => callback(filePath);
    ipcRenderer.on('open-file-request', handler);
    return () => ipcRenderer.removeListener('open-file-request', handler);
  },

  onShowRemoteDialog: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('show-remote-dialog', handler);
    return () => ipcRenderer.removeListener('show-remote-dialog', handler);
  },

  onRequestCredentials: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('request-credentials', handler);
    return () => ipcRenderer.removeListener('request-credentials', handler);
  },

  onManageCredentials: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('manage-credentials', handler);
    return () => ipcRenderer.removeListener('manage-credentials', handler);
  },

  onClearCredentials: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('clear-credentials', handler);
    return () => ipcRenderer.removeListener('clear-credentials', handler);
  },

  onShowShortcuts: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('show-shortcuts', handler);
    return () => ipcRenderer.removeListener('show-shortcuts', handler);
  },

  onShowAbout: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('show-about', handler);
    return () => ipcRenderer.removeListener('show-about', handler);
  },

  onZoomIn: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('zoom-in', handler);
    return () => ipcRenderer.removeListener('zoom-in', handler);
  },

  onZoomOut: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('zoom-out', handler);
    return () => ipcRenderer.removeListener('zoom-out', handler);
  },

  onZoomReset: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('zoom-reset', handler);
    return () => ipcRenderer.removeListener('zoom-reset', handler);
  },

  onLoadingStart: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('loading-start', handler);
    return () => ipcRenderer.removeListener('loading-start', handler);
  },

  onLoadingEnd: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('loading-end', handler);
    return () => ipcRenderer.removeListener('loading-end', handler);
  },

  onRemoteConnectionLost: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('remote-connection-lost', handler);
    return () => ipcRenderer.removeListener('remote-connection-lost', handler);
  },

  onRemoteConnectionFailed: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('remote-connection-failed', handler);
    return () => ipcRenderer.removeListener('remote-connection-failed', handler);
  },

  onDisconnected: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('disconnected', handler);
    return () => ipcRenderer.removeListener('disconnected', handler);
  },

  // Platform detection
  platform: process.platform,
  isElectron: true
});
