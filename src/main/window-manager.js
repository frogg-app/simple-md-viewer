const { BrowserWindow, screen } = require('electron');
const path = require('path');

class WindowManager {
  constructor(store) {
    this.store = store;
    this.windows = new Map();
  }

  createWindow(options = {}) {
    const windowBounds = this.store.get('windowBounds');

    // Ensure window is on a visible display
    const displays = screen.getAllDisplays();
    const isOnDisplay = displays.some(display => {
      const bounds = display.bounds;
      return (
        windowBounds.x >= bounds.x &&
        windowBounds.x < bounds.x + bounds.width &&
        windowBounds.y >= bounds.y &&
        windowBounds.y < bounds.y + bounds.height
      );
    });

    const finalBounds = isOnDisplay
      ? windowBounds
      : { width: 900, height: 700 };

    const window = new BrowserWindow({
      width: finalBounds.width,
      height: finalBounds.height,
      x: isOnDisplay ? finalBounds.x : undefined,
      y: isOnDisplay ? finalBounds.y : undefined,
      minWidth: 400,
      minHeight: 300,
      webPreferences: {
        preload: path.join(__dirname, '../preload/preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      },
      icon: path.join(__dirname, '../../build/icon.png'),
      show: false,
      ...options
    });

    const id = window.id;
    this.windows.set(id, window);

    window.on('close', () => {
      this.store.set('windowBounds', window.getBounds());
    });

    window.on('closed', () => {
      this.windows.delete(id);
    });

    return window;
  }

  getWindow(id) {
    return this.windows.get(id);
  }

  getAllWindows() {
    return Array.from(this.windows.values());
  }

  getFocusedWindow() {
    return BrowserWindow.getFocusedWindow();
  }

  closeAll() {
    this.windows.forEach(window => {
      window.close();
    });
  }
}

module.exports = { WindowManager };
