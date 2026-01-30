import { MarkdownRenderer } from './markdown-renderer.js';
import { MermaidHandler } from './mermaid-handler.js';
import { ThemeManager } from './theme-manager.js';
import { FileHandler } from './file-handler.js';
import { ToastNotifications } from './toast-notifications.js';
import { RemoteDialog } from './remote-dialog.js';
import { CredentialsDialog } from './credentials-dialog.js';
import { SettingsManager } from './settings-manager.js';
import { MarkdownEditor } from './editor.js';

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
    this.editor = new MarkdownEditor();

    this.currentFilePath = null;
    this.isRemoteFile = false;
    this.pageZoom = 1;
    this.activeMenu = null;
    
    // Editor state
    this.currentMode = 'view'; // 'view', 'edit', 'split'
    this.currentContent = '';
    this.livePreviewDebounceTimer = null;

    this.init();
  }

  async init() {
    await this.setupEventListeners();
    await this.loadInitialState();
    this.setupDragAndDrop();
    this.setupKeyboardShortcuts();
    this.setupDialogs();
    this.setupMenuBar();
    this.setupSettingsDialog();
    this.setupEditor();
    this.updateShortcutHint();
    this.updateShortcutsDialog();
    this.loadSectionVisibility();
    this.applyDialogCentering();

    // Load docs folder in web mode
    if (!this.isElectron()) {
      await this.loadDocsFolder();
    }
  }

  async loadInitialState() {
    if (this.isElectron()) {
      document.body.classList.add('electron-mode');
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
    // Use capture to intercept before browser handles Ctrl+O
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        if (this.isElectron()) {
          window.electronAPI.openFileDialog();
        } else {
          document.getElementById('file-input')?.click();
        }
      }
    }, { capture: true });

    document.addEventListener('keydown', async (e) => {

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

      // Ctrl/Cmd + S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (this.currentMode === 'edit' || this.currentMode === 'split') {
          this.saveFile();
        }
      }

      // Editor formatting shortcuts (only in edit mode)
      if ((this.currentMode === 'edit' || this.currentMode === 'split') && (e.ctrlKey || e.metaKey)) {
        const textarea = document.getElementById('editor-textarea');
        if (document.activeElement === textarea) {
          if (e.key === 'b') {
            e.preventDefault();
            this.editor.formatBold();
          } else if (e.key === 'i') {
            e.preventDefault();
            this.editor.formatItalic();
          } else if (e.key === 'k') {
            e.preventDefault();
            this.editor.formatLink();
          }
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

      // Escape closes dialogs
      if (e.key === 'Escape') {
        this.closeAllDialogs();
      }
    });
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

    // File input for web mode
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleFileInput(e));
    }
  }

  /**
   * Handle file input selection (web mode)
   */
  handleFileInput(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      this.handleFileOpened({
        content: event.target.result,
        path: file.name,
        fileName: file.name,
        isRemote: false
      });
    };
    reader.readAsText(file);

    // Reset input so same file can be selected again
    e.target.value = '';
  }

  async openFile(filePath) {
    if (this.isElectron()) {
      await window.electronAPI.openFile(filePath);
    }
  }

  handleFileOpened(data) {
    this.currentFilePath = data.path;
    this.isRemoteFile = data.isRemote;
    this.currentContent = data.content;

    // Hide empty state, show content
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('content').classList.remove('hidden');

    // Set to view mode by default
    this.setEditorMode('view');

    // Render markdown
    this.renderContent(data.content);

    // Initialize editor with content
    this.editor.init(data.content, data.path);

    // Update title in web mode
    if (!this.isElectron()) {
      document.title = `${data.fileName} - MD Viewer`;
    }

    // Update menu state
    this.updateMenuState();

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
    this.updateMenuState();
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

  setupMenuBar() {
    // Menu dropdowns
    const menuItems = document.querySelectorAll('.menu-item');

    menuItems.forEach(item => {
      const button = item.querySelector('.menu-button');
      const dropdown = item.querySelector('.menu-dropdown');

      // Click to toggle menu
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (this.activeMenu === item) {
          this.closeMenu(item);
          this.activeMenu = null;
        } else {
          if (this.activeMenu) {
            this.closeMenu(this.activeMenu);
          }
          this.openMenu(item);
          this.activeMenu = item;
        }
      });

      // Hover to switch between menus when one is open
      button.addEventListener('mouseenter', () => {
        if (this.activeMenu && this.activeMenu !== item) {
          this.closeMenu(this.activeMenu);
          this.openMenu(item);
          this.activeMenu = item;
        }
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (this.activeMenu && !this.activeMenu.contains(e.target)) {
        this.closeMenu(this.activeMenu);
        this.activeMenu = null;
      }
    });

    // Setup menu actions
    this.setupMenuActions();

    // Update menu state when file is opened/closed
    this.updateMenuState();
  }

  openMenu(menuItem) {
    menuItem.classList.add('active');
    const button = menuItem.querySelector('.menu-button');
    button.setAttribute('aria-expanded', 'true');
  }

  closeMenu(menuItem) {
    menuItem.classList.remove('active');
    const button = menuItem.querySelector('.menu-button');
    button.setAttribute('aria-expanded', 'false');
  }

  setupMenuActions() {
    // File menu
    document.getElementById('menu-open-local').addEventListener('click', async () => {
      if (this.isElectron()) {
        await window.electronAPI.openFileDialog();
      } else {
        // Web mode: create file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.markdown';
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              this.handleFileOpened({
                content: event.target.result,
                path: file.name,
                fileName: file.name,
                isRemote: false
              });
            };
            reader.onerror = () => {
              this.showError(`Failed to read file: ${file.name}`);
            };
            reader.readAsText(file);
          }
        };
        input.click();
      }
      this.closeAllMenus();
    });

    document.getElementById('menu-open-remote').addEventListener('click', () => {
      this.remoteDialog.show();
      this.closeAllMenus();
    });

    document.getElementById('menu-reload').addEventListener('click', async () => {
      if (this.currentFilePath && this.isElectron()) {
        await window.electronAPI.reloadFile();
      }
      this.closeAllMenus();
    });

    document.getElementById('menu-close').addEventListener('click', async () => {
      if (this.isElectron() && this.isRemoteFile) {
        await window.electronAPI.disconnectRemote();
      } else {
        this.handleDisconnected();
      }
      this.closeAllMenus();
    });

    // View menu
    document.getElementById('menu-zoom-in').addEventListener('click', () => {
      this.zoomIn();
      this.closeAllMenus();
    });

    document.getElementById('menu-zoom-out').addEventListener('click', () => {
      this.zoomOut();
      this.closeAllMenus();
    });

    document.getElementById('menu-zoom-reset').addEventListener('click', () => {
      this.resetZoom();
      this.closeAllMenus();
    });

    document.getElementById('menu-toggle-theme').addEventListener('click', () => {
      this.themeManager.toggleTheme();
      this.closeAllMenus();
    });

    document.getElementById('menu-fullscreen').addEventListener('click', () => {
      this.toggleFullscreen();
      this.closeAllMenus();
    });

    // Help menu
    document.getElementById('menu-shortcuts').addEventListener('click', () => {
      this.showShortcutsDialog();
      this.closeAllMenus();
    });

    document.getElementById('menu-about').addEventListener('click', () => {
      this.showAboutDialog();
      this.closeAllMenus();
    });
  }

  closeAllMenus() {
    document.querySelectorAll('.menu-item').forEach(item => {
      this.closeMenu(item);
    });
  }

  updateMenuState() {
    const hasFile = !!this.currentFilePath;
    document.getElementById('menu-reload').disabled = !hasFile;
    document.getElementById('menu-close').disabled = !hasFile;
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  closeAllDialogs() {
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
  }

  /**
   * Update the shortcut hint based on mode (Electron vs Web)
   */
  updateShortcutHint() {
    const hint = document.getElementById('shortcut-hint');
    if (!hint) return;

    hint.innerHTML = 'or press <kbd>Ctrl</kbd>+<kbd>O</kbd> to open a file, <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>O</kbd> for remote';
  }

  /**
   * Update shortcuts dialog based on mode
   */
  updateShortcutsDialog() {
    // Ctrl+O now works in both modes, no need to hide
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
    const settingsBtn = document.getElementById('menu-settings');
    const settingsDialog = document.getElementById('settings-dialog');
    const settingsClose = document.getElementById('settings-close');
    const showDocsCheckbox = document.getElementById('show-docs');
    const showRecentCheckbox = document.getElementById('show-recent');
    const centerDialogsCheckbox = document.getElementById('center-dialogs');

    // Open settings dialog
    if (settingsBtn && settingsDialog) {
      settingsBtn.addEventListener('click', () => {
        // Set current checkbox values
        if (centerDialogsCheckbox) {
          centerDialogsCheckbox.checked = this.settingsManager.get('centerDialogs');
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

    // Center dialogs toggle
    if (centerDialogsCheckbox) {
      centerDialogsCheckbox.addEventListener('change', () => {
        const centered = centerDialogsCheckbox.checked;
        this.settingsManager.set('centerDialogs', centered);
        this.applyDialogCentering();
      });
    }

  }

  /**
   * Apply dialog centering based on setting
   */
  applyDialogCentering() {
    const centered = this.settingsManager.get('centerDialogs');
    const dialogs = document.querySelectorAll('dialog');
    dialogs.forEach(dialog => {
      if (centered) {
        dialog.classList.add('centered');
      } else {
        dialog.classList.remove('centered');
      }
    });
  }

  /**
   * Setup editor tabs, toolbar, and event handlers
   */
  setupEditor() {
    // Setup mode tabs
    const viewTab = document.getElementById('tab-view');
    const editTab = document.getElementById('tab-edit');
    const splitToggle = document.getElementById('split-toggle');
    const saveBtn = document.getElementById('save-btn');

    if (viewTab) {
      viewTab.addEventListener('click', () => this.setEditorMode('view'));
    }

    if (editTab) {
      editTab.addEventListener('click', () => this.setEditorMode('edit'));
    }

    if (splitToggle) {
      splitToggle.addEventListener('click', () => this.toggleSplitView());
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveFile());
    }

    // Setup toolbar buttons
    this.setupToolbarButtons();

    // Setup live preview
    this.editor.onContentChange = (content) => {
      this.currentContent = content;
      this.updateEditorStatus();
      this.debouncedLivePreview();
    };

    // Setup split resizer
    this.setupSplitResizer();
  }

  /**
   * Setup formatting toolbar buttons
   */
  setupToolbarButtons() {
    const buttons = {
      'fmt-bold': () => this.editor.formatBold(),
      'fmt-italic': () => this.editor.formatItalic(),
      'fmt-strike': () => this.editor.formatStrikethrough(),
      'fmt-h1': () => this.editor.formatHeading(1),
      'fmt-h2': () => this.editor.formatHeading(2),
      'fmt-h3': () => this.editor.formatHeading(3),
      'fmt-code': () => this.editor.formatCode(),
      'fmt-codeblock': () => this.editor.formatCodeBlock(),
      'fmt-link': () => this.editor.formatLink(),
      'fmt-image': () => this.editor.formatImage(),
      'fmt-bullet': () => this.editor.formatBulletList(),
      'fmt-number': () => this.editor.formatNumberedList(),
      'fmt-task': () => this.editor.formatTaskList(),
      'fmt-quote': () => this.editor.formatBlockquote(),
      'fmt-hr': () => this.editor.formatHorizontalRule(),
      'fmt-table': () => this.editor.formatTable()
    };

    Object.entries(buttons).forEach(([id, handler]) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', handler);
      }
    });
  }

  /**
   * Set editor mode (view, edit, or split)
   */
  setEditorMode(mode) {
    this.currentMode = mode;

    const viewTab = document.getElementById('tab-view');
    const editTab = document.getElementById('tab-edit');
    const splitToggle = document.getElementById('split-toggle');
    const editorToolbar = document.getElementById('editor-toolbar');
    const editorPane = document.getElementById('editor-pane');
    const previewPane = document.getElementById('preview-pane');
    const editorContent = document.getElementById('editor-content');
    const statusBar = document.getElementById('editor-status-bar');
    const saveBtn = document.getElementById('save-btn');
    const splitResizer = document.getElementById('split-resizer');

    // Reset classes
    viewTab?.classList.remove('active');
    editTab?.classList.remove('active');
    splitToggle?.classList.remove('active');
    editorContent?.classList.remove('split-view');

    // Update aria-selected for accessibility
    viewTab?.setAttribute('aria-selected', 'false');
    editTab?.setAttribute('aria-selected', 'false');

    if (mode === 'view') {
      viewTab?.classList.add('active');
      viewTab?.setAttribute('aria-selected', 'true');
      editorToolbar?.classList.add('hidden');
      editorPane?.classList.add('hidden');
      previewPane?.classList.remove('hidden');
      statusBar?.classList.add('hidden');
      saveBtn?.classList.add('hidden');
      splitResizer?.classList.add('hidden');
      // Refresh preview with current editor content
      this.renderContent(this.editor.getContent());
    } else if (mode === 'edit') {
      editTab?.classList.add('active');
      editTab?.setAttribute('aria-selected', 'true');
      editorToolbar?.classList.remove('hidden');
      editorPane?.classList.remove('hidden');
      previewPane?.classList.add('hidden');
      statusBar?.classList.remove('hidden');
      saveBtn?.classList.remove('hidden');
      splitResizer?.classList.add('hidden');
      this.updateEditorStatus();
    } else if (mode === 'split') {
      editTab?.classList.add('active');
      editTab?.setAttribute('aria-selected', 'true');
      splitToggle?.classList.add('active');
      editorToolbar?.classList.remove('hidden');
      editorPane?.classList.remove('hidden');
      previewPane?.classList.remove('hidden');
      editorContent?.classList.add('split-view');
      statusBar?.classList.remove('hidden');
      saveBtn?.classList.remove('hidden');
      splitResizer?.classList.remove('hidden');
      this.updateEditorStatus();
      // Refresh preview
      this.renderContent(this.editor.getContent());
    }
  }

  /**
   * Toggle split view
   */
  toggleSplitView() {
    if (this.currentMode === 'split') {
      this.setEditorMode('edit');
    } else {
      this.setEditorMode('split');
    }
  }

  /**
   * Debounced live preview update
   */
  debouncedLivePreview() {
    if (this.livePreviewDebounceTimer) {
      clearTimeout(this.livePreviewDebounceTimer);
    }
    
    this.livePreviewDebounceTimer = setTimeout(() => {
      if (this.currentMode === 'split') {
        this.renderContent(this.currentContent);
      }
    }, 150);
  }

  /**
   * Update editor status bar
   */
  updateEditorStatus() {
    const content = this.editor.getContent();
    const lines = content.split('\n').length;
    const chars = content.length;
    const isModified = this.editor.hasUnsavedChanges();

    const statusLines = document.getElementById('status-lines');
    const statusChars = document.getElementById('status-chars');
    const statusSaved = document.getElementById('status-saved');

    if (statusLines) statusLines.textContent = `Lines: ${lines}`;
    if (statusChars) statusChars.textContent = `Characters: ${chars}`;
    if (statusSaved) {
      if (isModified) {
        statusSaved.textContent = '● Modified';
        statusSaved.className = 'status-item status-modified';
      } else {
        statusSaved.textContent = '✓ Saved';
        statusSaved.className = 'status-item status-saved';
      }
    }
  }

  /**
   * Setup split resizer drag functionality
   */
  setupSplitResizer() {
    const resizer = document.getElementById('split-resizer');
    const editorPane = document.getElementById('editor-pane');
    const previewPane = document.getElementById('preview-pane');
    const editorContent = document.getElementById('editor-content');

    if (!resizer || !editorPane || !previewPane || !editorContent) return;

    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      document.body.style.cursor = 'col-resize';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;

      const containerRect = editorContent.getBoundingClientRect();
      const newEditorWidth = e.clientX - containerRect.left;
      const containerWidth = containerRect.width;
      
      // Limit resize to reasonable bounds (20% - 80%)
      const minWidth = containerWidth * 0.2;
      const maxWidth = containerWidth * 0.8;
      
      if (newEditorWidth >= minWidth && newEditorWidth <= maxWidth) {
        editorPane.style.flex = 'none';
        editorPane.style.width = `${newEditorWidth}px`;
        previewPane.style.flex = '1';
      }
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = '';
      }
    });
  }

  /**
   * Save the current file
   */
  async saveFile() {
    if (!this.currentFilePath || this.isRemoteFile) {
      this.toast.show('Cannot save remote files', 'warning');
      return;
    }

    const content = this.editor.getContent();

    try {
      // Save via API
      const response = await fetch('/api/file', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: this.currentFilePath,
          content: content
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save file');
      }

      this.currentContent = content;
      this.editor.markAsSaved();
      this.updateEditorStatus();
      this.toast.show('File saved', 'success');
    } catch (err) {
      console.error('Save error:', err);
      this.toast.show(`Save failed: ${err.message}`, 'error');
    }
  }
}

// Initialize app
const app = new App();

// Export for debugging
window.app = app;
