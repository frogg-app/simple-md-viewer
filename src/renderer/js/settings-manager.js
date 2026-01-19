/**
 * Settings Manager - Handles persistence of user settings
 * Uses localStorage for web mode and could integrate with electron-store for Electron
 */
export class SettingsManager {
  constructor() {
    this.prefix = 'mdviewer_';
    this.defaults = {
      showDocsFolder: true,
      showRecentFiles: true,
      centerToasts: false
    };
  }

  /**
   * Check if running in Electron environment
   */
  isElectron() {
    return window.electronAPI && window.electronAPI.isElectron;
  }

  /**
   * Get a setting value
   * @param {string} key - Setting key
   * @returns {*} Setting value or default
   */
  get(key) {
    const stored = localStorage.getItem(`${this.prefix}${key}`);
    if (stored !== null) {
      try {
        return JSON.parse(stored);
      } catch {
        return stored;
      }
    }
    return this.defaults[key];
  }

  /**
   * Set a setting value
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   */
  set(key, value) {
    localStorage.setItem(`${this.prefix}${key}`, JSON.stringify(value));
  }

  /**
   * Get all settings
   * @returns {Object} All settings
   */
  getAll() {
    return {
      showDocsFolder: this.get('showDocsFolder'),
      showRecentFiles: this.get('showRecentFiles'),
      theme: this.get('theme')
    };
  }

  /**
   * Reset all settings to defaults
   */
  reset() {
    Object.keys(this.defaults).forEach(key => {
      localStorage.removeItem(`${this.prefix}${key}`);
    });
  }
}
