const { app, BrowserWindow, ipcMain, dialog, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const Store = require('electron-store');
const { createMenu } = require('./menu');
const { setupIpcHandlers } = require('./ipc-handlers');
const { FileWatcherManager } = require('./file-watcher');
const { RemoteFileManager } = require('./remote');

// Handle single instance
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine) => {
    // Focus the window and open file if provided
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();

      const filePath = commandLine.find(arg => arg.endsWith('.md') || arg.endsWith('.markdown'));
      if (filePath) {
        openFile(filePath);
      }
    }
  });
}

// Initialize store
const store = new Store({
  defaults: {
    theme: 'system',
    recentFiles: [],
    windowBounds: { width: 900, height: 700 },
    autoReload: true,
    fontSize: 16,
    liveUpdates: true,
    pollInterval: 2000
  }
});

let mainWindow = null;
let fileWatcherManager = null;
let remoteFileManager = null;
let currentFilePath = null;
let isRemoteFile = false;

function createWindow() {
  const windowBounds = store.get('windowBounds');

  mainWindow = new BrowserWindow({
    width: windowBounds.width,
    height: windowBounds.height,
    x: windowBounds.x,
    y: windowBounds.y,
    minWidth: 400,
    minHeight: 300,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    icon: path.join(__dirname, '../../build/icon.png'),
    show: false
  });

  // Load renderer
  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // Check for command line file argument
    const filePath = process.argv.find(arg => arg.endsWith('.md') || arg.endsWith('.markdown'));
    if (filePath) {
      openFile(filePath);
    }
  });

  // Save window bounds on close
  mainWindow.on('close', () => {
    store.set('windowBounds', mainWindow.getBounds());
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create menu
  createMenu(mainWindow, store, {
    openFile: () => showOpenDialog(),
    openRemote: () => showRemoteDialog(),
    reloadFile,
    setTheme,
    toggleLiveUpdates,
    setPollInterval: (ms) => {
      store.set('pollInterval', ms);
      if (fileWatcherManager) {
        fileWatcherManager.setPollInterval(ms);
      }
    },
    disconnectRemote
  });

  // Initialize managers
  fileWatcherManager = new FileWatcherManager(mainWindow);
  remoteFileManager = new RemoteFileManager();
}

async function showOpenDialog() {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Markdown Files', extensions: ['md', 'markdown'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    await openFile(result.filePaths[0]);
  }
}

async function showRemoteDialog() {
  mainWindow.webContents.send('show-remote-dialog');
}

async function openFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    currentFilePath = filePath;
    isRemoteFile = false;

    mainWindow.webContents.send('file-opened', {
      content,
      path: filePath,
      fileName: path.basename(filePath),
      isRemote: false
    });

    // Add to recent files
    addToRecentFiles(filePath);

    // Start watching
    if (store.get('liveUpdates')) {
      fileWatcherManager.watch(filePath);
    }

    // Update window title
    mainWindow.setTitle(`${path.basename(filePath)} - MD Viewer`);
  } catch (error) {
    mainWindow.webContents.send('file-error', {
      message: getErrorMessage(error),
      path: filePath
    });
  }
}

async function openRemoteFile(remotePath, credentials) {
  try {
    mainWindow.webContents.send('loading-start', { message: 'Connecting...' });

    const result = await remoteFileManager.openFile(remotePath, credentials);

    currentFilePath = remotePath;
    isRemoteFile = true;

    mainWindow.webContents.send('file-opened', {
      content: result.content,
      path: remotePath,
      fileName: path.basename(result.path),
      isRemote: true,
      protocol: result.protocol
    });

    // Add to recent files
    addToRecentFiles(remotePath);

    // Start remote watching
    if (store.get('liveUpdates')) {
      fileWatcherManager.watchRemote(remotePath, result.client, store.get('pollInterval'));
    }

    // Update window title
    mainWindow.setTitle(`${path.basename(result.path)} (Remote) - MD Viewer`);

    mainWindow.webContents.send('loading-end');
  } catch (error) {
    mainWindow.webContents.send('loading-end');
    mainWindow.webContents.send('file-error', {
      message: error.message,
      path: remotePath
    });
  }
}

async function reloadFile() {
  if (!currentFilePath) return;

  if (isRemoteFile) {
    try {
      const result = await remoteFileManager.openFile(currentFilePath);
      mainWindow.webContents.send('file-reloaded', {
        content: result.content,
        path: currentFilePath
      });
    } catch (error) {
      mainWindow.webContents.send('file-error', {
        message: error.message,
        path: currentFilePath
      });
    }
  } else {
    try {
      const content = await fs.readFile(currentFilePath, 'utf-8');
      mainWindow.webContents.send('file-reloaded', {
        content,
        path: currentFilePath
      });
    } catch (error) {
      mainWindow.webContents.send('file-error', {
        message: getErrorMessage(error),
        path: currentFilePath
      });
    }
  }
}

function addToRecentFiles(filePath) {
  let recentFiles = store.get('recentFiles');
  recentFiles = recentFiles.filter(f => f !== filePath);
  recentFiles.unshift(filePath);
  recentFiles = recentFiles.slice(0, 10);
  store.set('recentFiles', recentFiles);
}

function setTheme(theme) {
  store.set('theme', theme);
  mainWindow.webContents.send('theme-changed', theme);

  if (theme === 'system') {
    nativeTheme.themeSource = 'system';
  } else {
    nativeTheme.themeSource = theme;
  }
}

function toggleLiveUpdates() {
  const current = store.get('liveUpdates');
  store.set('liveUpdates', !current);

  if (!current && currentFilePath) {
    if (isRemoteFile) {
      // Resume remote watching
    } else {
      fileWatcherManager.watch(currentFilePath);
    }
  } else {
    fileWatcherManager.stop();
  }

  return !current;
}

async function disconnectRemote() {
  if (isRemoteFile) {
    await remoteFileManager.closeAll();
    fileWatcherManager.stop();
    currentFilePath = null;
    isRemoteFile = false;
    mainWindow.setTitle('MD Viewer');
    mainWindow.webContents.send('disconnected');
  }
}

function getErrorMessage(error) {
  switch (error.code) {
    case 'ENOENT':
      return 'File not found';
    case 'EACCES':
      return 'Permission denied';
    case 'EISDIR':
      return 'Cannot open directory';
    default:
      return error.message || 'Unknown error';
  }
}

// Setup IPC handlers
setupIpcHandlers(ipcMain, {
  store,
  openFile,
  openRemoteFile,
  showOpenDialog,
  showRemoteDialog,
  reloadFile,
  setTheme,
  toggleLiveUpdates,
  disconnectRemote,
  getRemoteFileManager: () => remoteFileManager
});

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', async () => {
  if (fileWatcherManager) {
    fileWatcherManager.stop();
  }
  if (remoteFileManager) {
    await remoteFileManager.closeAll();
  }
});

module.exports = { mainWindow, store };
