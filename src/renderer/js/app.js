import { MarkdownRenderer } from './markdown-renderer.js';
import { MermaidHandler } from './mermaid-handler.js';
import { ThemeManager } from './theme-manager.js';
import { FileHandler } from './file-handler.js';
import { ToastNotifications } from './toast-notifications.js';
import { RemoteDialog } from './remote-dialog.js';
import { CredentialsDialog } from './credentials-dialog.js';
import { SettingsManager } from './settings-manager.js';

class App {
  constructor() {
    this.markdownRenderer = new MarkdownRenderer();
    this.mermaidHandler = new MermaidHandler();
    this.themeManager = new ThemeManager();
    this.fileHandler = new FileHandler();
    this.toast = new ToastNotifications();
    this.remoteDialog = new RemoteDialog();
    this.credentialsDialog = new CredentialsDialog();
    this.settingsManager = new SettingsManager();

    this.currentFilePath = null;
    this.isRemoteFile = false;
    this.pageZoom = 1;

    this.init();
  }

  async init() {
    await this.setupEventListeners();
    await this.loadInitialState();
    this.setupDragAndDrop();
    this.setupKeyboardShortcuts();
    this.setupDialogs();
    this.setupSettingsDialog();
    this.updateShortcutHint();
    this.updateShortcutsDialog();
    this.updateHomeButtonTooltip();
    this.updateShortcutsDialogHomeKey();
    this.loadSectionVisibility();

    // Load docs folder in web mode
    if (!this.isElectron()) {
      await this.loadDocsFolder();
    }
  }

  async loadInitialState() {
    if (this.isElectron()) {
      const state = await window.electronAPI.getInitialState();
      this.updateRecentFiles(state.recentFiles);
    }
  }

  isElectron() {
    return window.electronAPI && window.electronAPI.isElectron;
  }

  async setupEventListeners() {
    if (this.isElectron()) {
      // File events
      window.electronAPI.onFileOpened((data) => this.handleFileOpened(data));
      window.electronAPI.onFileReloaded((data) => this.handleFileReloaded(data));
      window.electronAPI.onFileChanged((data) => this.handleFileChanged(data));
      window.electronAPI.onFileError((data) => this.handleFileError(data));
      window.electronAPI.onOpenFileRequest((path) => this.openFile(path));

      // Theme events
      window.electronAPI.onThemeChanged((theme) => this.themeManager.setTheme(theme));
      window.electronAPI.onSystemThemeChanged((theme) => this.themeManager.handleSystemThemeChange(theme));

      // Remote events
      window.electronAPI.onShowRemoteDialog(() => this.remoteDialog.show());
      window.electronAPI.onRequestCredentials((data) => this.credentialsDialog.show(data));
      window.electronAPI.onRemoteConnectionLost((data) => this.handleConnectionLost(data));
      window.electronAPI.onRemoteConnectionFailed((data) => this.handleConnectionFailed(data));
      window.electronAPI.onDisconnected(() => this.handleDisconnected());

      // Loading events
      window.electronAPI.onLoadingStart((data) => this.showLoading(data.message));
      window.electronAPI.onLoadingEnd(() => this.hideLoading());

      // Zoom events from menu
      window.electronAPI.onZoomIn(() => this.zoomIn());
      window.electronAPI.onZoomOut(() => this.zoomOut());
      window.electronAPI.onZoomReset(() => this.resetZoom());

      // Dialog events
      window.electronAPI.onShowShortcuts(() => this.showShortcutsDialog());
      window.electronAPI.onShowAbout(() => this.showAboutDialog());
      window.electronAPI.onManageCredentials(() => this.manageCredentials());
      window.electronAPI.onClearCredentials(() => this.clearCredentials());
    }
  }

  setupDragAndDrop() {
    const app = document.getElementById('app');

    app.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      app.classList.add('drag-over');
    });

    app.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      app.classList.remove('drag-over');
    });

    app.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      app.classList.remove('drag-over');

      const files = Array.from(e.dataTransfer.files);
      const mdFile = files.find(f =>
        f.name.endsWith('.md') || f.name.endsWith('.markdown')
      );

      if (mdFile) {
        if (this.isElectron()) {
          const result = await window.electronAPI.readDroppedFile(mdFile.path);
          if (result.success) {
            this.handleFileOpened({
              content: result.content,
              path: result.path,
              fileName: result.fileName,
              isRemote: false
            });
          } else {
            this.handleFileError({ message: result.error, path: mdFile.path });
          }
        } else {
          // Web mode: use FileReader
          const reader = new FileReader();
          reader.onload = (event) => {
            this.handleFileOpened({
              content: event.target.result,
              path: mdFile.name,
              fileName: mdFile.name,
              isRemote: false
            });
          };
          reader.readAsText(mdFile);
        }
      }
    });

    // Prevent default browser behavior
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', async (e) => {
      // Ctrl/Cmd + O: Open file
      if ((e.ctrlKey || e.metaKey) && e.key === 'o' && !e.shiftKey) {
        e.preventDefault();
        if (this.isElectron()) {
          await window.electronAPI.openFileDialog();
        }
      }

      // Ctrl/Cmd + Shift + O: Open remote
      if ((e.ctrlKey || e.metaKey) && e.key === 'O' && e.shiftKey) {
        e.preventDefault();
        this.remoteDialog.show();
      }

      // Ctrl/Cmd + R: Reload
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        if (this.currentFilePath && this.isElectron()) {
          await window.electronAPI.reloadFile();
        }
      }

      // Ctrl/Cmd + F: Find (browser native)
      // Let it pass through

      // Ctrl/Cmd + +/-/0: Page zoom
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        this.zoomIn();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        this.zoomOut();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        this.resetZoom();
      }

      // Configurable home hotkey
      const homeHotkey = this.settingsManager.get('homeHotkey');
      const isHomeHotkey = this.matchesHotkey(e, homeHotkey);

      if (isHomeHotkey) {
        // First close any open dialogs
        const openDialogs = document.querySelectorAll('dialog[open]');
        if (openDialogs.length > 0) {
          this.closeAllDialogs();
        } else if (this.currentFilePath) {
          // If no dialogs open and viewing a file, go home
          e.preventDefault();
          this.goHome();
        }
      }
    });
  }

  /**
   * Check if a keyboard event matches a hotkey setting
   */
  matchesHotkey(e, hotkey) {
    switch (hotkey) {
      case 'Escape':
        return e.key === 'Escape';
      case 'Backspace':
        return e.key === 'Backspace' && !e.target.matches('input, textarea, [contenteditable]');
      case 'KeyH':
        return (e.ctrlKey || e.metaKey) && e.key === 'h';
      default:
        return e.key === 'Escape';
    }
  }

  setupDialogs() {
    // Shortcuts dialog
    document.getElementById('shortcuts-close').addEventListener('click', () => {
      document.getElementById('shortcuts-dialog').close();
    });

    // About dialog
    document.getElementById('about-close').addEventListener('click', () => {
      document.getElementById('about-dialog').close();
    });

    // Home button
    const homeBtn = document.getElementById('home-btn');
    if (homeBtn) {
      homeBtn.addEventListener('click', () => this.goHome());
    }
  }

  async openFile(filePath) {
    if (this.isElectron()) {
      await window.electronAPI.openFile(filePath);
    }
  }

  handleFileOpened(data) {
    this.currentFilePath = data.path;
    this.isRemoteFile = data.isRemote;

    // Hide empty state, show content
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('content').classList.remove('hidden');

    // Render markdown
    this.renderContent(data.content);

    // Update title in web mode
    if (!this.isElectron()) {
      document.title = `${data.fileName} - MD Viewer`;
    }

    // Show toast
    this.toast.show(`Opened ${data.fileName}`, 'success');
  }

  handleFileReloaded(data) {
    // Save scroll position
    const content = document.getElementById('markdown-content');
    const scrollTop = content.scrollTop;
    const scrollHeight = content.scrollHeight;

    // Render
    this.renderContent(data.content);

    // Restore scroll position (proportionally if content changed)
    requestAnimationFrame(() => {
      const ratio = scrollTop / scrollHeight;
      content.scrollTop = ratio * content.scrollHeight;
    });
  }

  handleFileChanged(data) {
    if (data.type === 'modified') {
      if (data.content) {
        this.handleFileReloaded({ content: data.content });
        this.toast.show('File updated', 'info', 2000);
      }
    } else if (data.type === 'deleted') {
      this.showError('File was deleted');
    }
  }

  handleFileError(data) {
    this.showError(`${data.message}: ${data.path}`);
  }

  handleConnectionLost(data) {
    const banner = document.getElementById('connection-banner');
    const message = banner.querySelector('.connection-message');
    message.textContent = `Connection lost. Reconnecting... (${data.retryCount}/${data.maxRetries})`;
    banner.classList.remove('hidden');
  }

  handleConnectionFailed(data) {
    const banner = document.getElementById('connection-banner');
    const message = banner.querySelector('.connection-message');
    message.textContent = 'Connection failed. Click retry to reconnect.';
    banner.classList.remove('hidden');

    const retryBtn = banner.querySelector('.connection-retry');
    retryBtn.onclick = async () => {
      if (this.isElectron()) {
        await window.electronAPI.reloadFile();
      }
      banner.classList.add('hidden');
    };

    const dismissBtn = banner.querySelector('.connection-dismiss');
    dismissBtn.onclick = () => banner.classList.add('hidden');
  }

  handleDisconnected() {
    this.currentFilePath = null;
    this.isRemoteFile = false;
    document.getElementById('content').classList.add('hidden');
    document.getElementById('empty-state').classList.remove('hidden');
    this.toast.show('Disconnected from remote', 'info');
  }

  async renderContent(markdown) {
    const content = document.getElementById('markdown-content');

    // Render markdown
    const html = await this.markdownRenderer.render(markdown, this.currentFilePath);
    content.innerHTML = html;

    // Process mermaid diagrams
    await this.mermaidHandler.renderDiagrams(content);

    // Setup link handling
    this.setupLinks(content);
  }

  setupLinks(container) {
    container.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', async (e) => {
        const href = link.getAttribute('href');

        if (!href) return;

        // Internal anchor
        if (href.startsWith('#')) {
          e.preventDefault();
          const target = document.getElementById(href.slice(1));
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
          }
          return;
        }

        // External link
        if (href.startsWith('http://') || href.startsWith('https://')) {
          e.preventDefault();
          if (this.isElectron()) {
            await window.electronAPI.openExternal(href);
          } else {
            window.open(href, '_blank', 'noopener,noreferrer');
          }
          return;
        }

        // Relative markdown link
        if (href.endsWith('.md') || href.endsWith('.markdown')) {
          e.preventDefault();
          if (this.isElectron() && this.currentFilePath) {
            const resolvedPath = await window.electronAPI.resolvePath(this.currentFilePath, href);
            await this.openFile(resolvedPath);
          }
          return;
        }

        // Mailto
        if (href.startsWith('mailto:')) {
          // Let browser handle it
          return;
        }
      });
    });
  }

  updateRecentFiles(files) {
    const list = document.getElementById('recent-files-list');
    list.innerHTML = '';

    if (!files || files.length === 0) {
      list.innerHTML = '<li class="no-files">No recent files</li>';
      return;
    }

    files.slice(0, 5).forEach(file => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.textContent = file;
      button.onclick = () => this.openFile(file);
      li.appendChild(button);
      list.appendChild(li);
    });
  }

  showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loading-overlay');
    const messageEl = overlay.querySelector('.loading-message');
    messageEl.textContent = message;
    overlay.classList.remove('hidden');
  }

  hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
  }

  showError(message) {
    const banner = document.getElementById('error-banner');
    const messageEl = banner.querySelector('.error-message');
    messageEl.textContent = message;
    banner.classList.remove('hidden');

    const dismissBtn = banner.querySelector('.error-dismiss');
    dismissBtn.onclick = () => banner.classList.add('hidden');
  }

  zoomIn() {
    this.pageZoom = Math.min(2, this.pageZoom + 0.1);
    document.getElementById('markdown-content').style.zoom = this.pageZoom;
  }

  zoomOut() {
    this.pageZoom = Math.max(0.5, this.pageZoom - 0.1);
    document.getElementById('markdown-content').style.zoom = this.pageZoom;
  }

  resetZoom() {
    this.pageZoom = 1;
    document.getElementById('markdown-content').style.zoom = 1;
  }

  showShortcutsDialog() {
    document.getElementById('shortcuts-dialog').showModal();
  }

  showAboutDialog() {
    document.getElementById('about-dialog').showModal();
  }

  async manageCredentials() {
    // Show list of saved credentials with option to delete
    this.toast.show('Credential management coming soon', 'info');
  }

  async clearCredentials() {
    if (this.isElectron()) {
      await window.electronAPI.clearAllCredentials();
      this.toast.show('All saved credentials cleared', 'success');
    }
  }

  closeAllDialogs() {
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
  }

  /**
   * Go back to the home/welcome screen
   */
  goHome() {
    this.currentFilePath = null;
    this.isRemoteFile = false;

    // Hide content, show empty state
    document.getElementById('content').classList.add('hidden');
    document.getElementById('empty-state').classList.remove('hidden');

    // Reset title
    document.title = 'MD Viewer';

    // Clear rendered content
    const markdownContent = document.getElementById('markdown-content');
    if (markdownContent) {
      markdownContent.innerHTML = '';
    }

    // Reload docs folder in web mode
    if (!this.isElectron()) {
      this.loadDocsFolder();
    }
  }

  /**
   * Update the shortcut hint based on mode (Electron vs Web)
   */
  updateShortcutHint() {
    const hint = document.getElementById('shortcut-hint');
    if (!hint) return;

    if (this.isElectron()) {
      hint.innerHTML = 'or press <kbd>Ctrl</kbd>+<kbd>O</kbd> to open';
    } else {
      hint.innerHTML = 'or press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>O</kbd> to open remote file';
    }
  }

  /**
   * Update shortcuts dialog to hide Ctrl+O on web mode
   */
  updateShortcutsDialog() {
    const ctrlORow = document.getElementById('shortcut-ctrl-o');
    if (ctrlORow) {
      ctrlORow.style.display = this.isElectron() ? '' : 'none';
    }
  }

  /**
   * Load docs folder contents (web mode only)
   */
  async loadDocsFolder() {
    try {
      const response = await fetch('/api/files');
      if (!response.ok) {
        throw new Error('Failed to fetch docs folder');
      }
      const files = await response.json();
      this.updateDocsFiles(files);
    } catch (err) {
      console.error('Failed to load docs:', err);
      this.updateDocsFiles([]);
    }
  }

  /**
   * Update the docs files list UI
   */
  updateDocsFiles(files) {
    const list = document.getElementById('docs-files-list');
    if (!list) return;

    list.innerHTML = '';

    if (!files || files.length === 0) {
      list.innerHTML = '<li class="no-files">No files in docs folder</li>';
      return;
    }

    files.slice(0, 10).forEach(file => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.textContent = file.name || file.path || file;
      button.onclick = () => this.openDocsFile(file.path || file);
      li.appendChild(button);
      list.appendChild(li);
    });
  }

  /**
   * Open a file from the docs folder
   */
  async openDocsFile(path) {
    try {
      this.showLoading('Loading file...');
      const response = await fetch(`/api/file?path=${encodeURIComponent(path)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }
      const data = await response.json();
      this.handleFileOpened({
        content: data.content,
        path: data.path || path,
        fileName: data.fileName || path.split('/').pop(),
        isRemote: false
      });
    } catch (err) {
      console.error('Failed to open docs file:', err);
      this.toast.show(`Failed to open file: ${err.message}`, 'error');
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Load section visibility from settings
   */
  loadSectionVisibility() {
    const showDocs = this.settingsManager.get('showDocsFolder');
    const showRecent = this.settingsManager.get('showRecentFiles');

    const docsSection = document.getElementById('docs-section');
    const recentSection = document.getElementById('recent-section');

    if (docsSection) {
      docsSection.style.display = showDocs ? '' : 'none';
    }
    if (recentSection) {
      recentSection.style.display = showRecent ? '' : 'none';
    }

    // Update checkbox states
    const showDocsCheckbox = document.getElementById('show-docs');
    const showRecentCheckbox = document.getElementById('show-recent');

    if (showDocsCheckbox) {
      showDocsCheckbox.checked = showDocs;
    }
    if (showRecentCheckbox) {
      showRecentCheckbox.checked = showRecent;
    }

    this.updateSectionsLayout();
  }

  /**
   * Update files-sections layout based on visible sections
   */
  updateSectionsLayout() {
    const container = document.querySelector('.files-sections');
    if (!container) return;

    const showDocs = this.settingsManager.get('showDocsFolder');
    const showRecent = this.settingsManager.get('showRecentFiles');
    const visibleCount = (showDocs ? 1 : 0) + (showRecent ? 1 : 0);

    container.classList.toggle('single-section', visibleCount === 1);
  }

  /**
   * Setup settings dialog handlers
   */
  setupSettingsDialog() {
    const settingsBtn = document.getElementById('settings-btn');
    const settingsDialog = document.getElementById('settings-dialog');
    const settingsClose = document.getElementById('settings-close');
    const showDocsCheckbox = document.getElementById('show-docs');
    const showRecentCheckbox = document.getElementById('show-recent');
    const homeHotkeySelect = document.getElementById('home-hotkey');

    // Open settings dialog
    if (settingsBtn && settingsDialog) {
      settingsBtn.addEventListener('click', () => {
        // Set current hotkey value
        const currentHotkey = this.settingsManager.get('homeHotkey');
        if (homeHotkeySelect) {
          homeHotkeySelect.value = currentHotkey;
        }
        settingsDialog.showModal();
      });
    }

    // Close settings dialog
    if (settingsClose && settingsDialog) {
      settingsClose.addEventListener('click', () => {
        settingsDialog.close();
      });
    }

    // Show docs folder toggle
    if (showDocsCheckbox) {
      showDocsCheckbox.addEventListener('change', () => {
        const show = showDocsCheckbox.checked;
        this.settingsManager.set('showDocsFolder', show);
        const docsSection = document.getElementById('docs-section');
        if (docsSection) {
          docsSection.style.display = show ? '' : 'none';
        }
        this.updateSectionsLayout();
      });
    }

    // Show recent files toggle
    if (showRecentCheckbox) {
      showRecentCheckbox.addEventListener('change', () => {
        const show = showRecentCheckbox.checked;
        this.settingsManager.set('showRecentFiles', show);
        const recentSection = document.getElementById('recent-section');
        if (recentSection) {
          recentSection.style.display = show ? '' : 'none';
        }
        this.updateSectionsLayout();
      });
    }

    // Home hotkey change handler
    if (homeHotkeySelect) {
      homeHotkeySelect.addEventListener('change', () => {
        const hotkey = homeHotkeySelect.value;
        this.settingsManager.set('homeHotkey', hotkey);
        this.updateHomeButtonTooltip();
        this.updateShortcutsDialogHomeKey();
      });
    }
  }

  /**
   * Update the home button tooltip with current hotkey
   */
  updateHomeButtonTooltip() {
    const homeBtn = document.getElementById('home-btn');
    if (homeBtn) {
      const hotkey = this.settingsManager.get('homeHotkey');
      const hotkeyDisplay = this.getHotkeyDisplay(hotkey);
      homeBtn.title = `Back to Home (${hotkeyDisplay})`;
    }
  }

  /**
   * Update shortcuts dialog with current home hotkey
   */
  updateShortcutsDialogHomeKey() {
    const shortcutRow = document.getElementById('shortcut-home');
    if (shortcutRow) {
      const hotkey = this.settingsManager.get('homeHotkey');
      const hotkeyDisplay = this.getHotkeyDisplay(hotkey);
      shortcutRow.querySelector('td:first-child').innerHTML = `<kbd>${hotkeyDisplay}</kbd>`;
    }
  }

  /**
   * Get display string for a hotkey
   */
  getHotkeyDisplay(hotkey) {
    switch (hotkey) {
      case 'Escape': return 'Esc';
      case 'Backspace': return 'Backspace';
      case 'KeyH': return 'Ctrl+H';
      default: return 'Esc';
    }
  }
}

// Initialize app
const app = new App();

// Export for debugging
window.app = app;
