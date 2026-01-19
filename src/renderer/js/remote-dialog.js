export class RemoteDialog {
  constructor() {
    this.dialog = document.getElementById('remote-dialog');
    this.protocol = document.getElementById('remote-protocol');
    this.host = document.getElementById('remote-host');
    this.port = document.getElementById('remote-port');
    this.path = document.getElementById('remote-path');
    this.smbShareGroup = document.getElementById('smb-share-group');
    this.smbShare = document.getElementById('smb-share');
    this.fileBrowser = document.getElementById('remote-file-browser');
    this.browserPath = document.getElementById('browser-path');
    this.browserList = document.getElementById('browser-list');
    this.recentConnectionsList = document.getElementById('recent-connections-list');

    this.cancelBtn = document.getElementById('remote-cancel');
    this.connectBtn = document.getElementById('remote-connect');
    this.openBtn = document.getElementById('remote-open');
    this.browserUpBtn = document.getElementById('browser-up');
    this.browserRefreshBtn = document.getElementById('browser-refresh');

    this.connected = false;
    this.currentBrowserPath = '/';
    this.selectedFile = null;

    this.bindEvents();
  }

  bindEvents() {
    this.cancelBtn.addEventListener('click', () => this.close());

    this.connectBtn.addEventListener('click', () => this.connect());

    this.openBtn.addEventListener('click', () => this.openFile());

    this.browserUpBtn?.addEventListener('click', () => this.navigateUp());

    this.browserRefreshBtn?.addEventListener('click', () => this.refreshBrowser());

    this.protocol.addEventListener('change', () => this.updateProtocolUI());

    this.dialog.addEventListener('close', () => this.reset());
  }

  show() {
    this.loadRecentConnections();
    this.dialog.showModal();
  }

  close() {
    this.dialog.close();
  }

  reset() {
    this.host.value = '';
    this.path.value = '';
    this.smbShare.value = '';
    this.connected = false;
    this.selectedFile = null;
    this.fileBrowser.classList.add('hidden');
    this.openBtn.disabled = true;
    this.updateProtocolUI();
  }

  updateProtocolUI() {
    const protocol = this.protocol.value;

    // Update default port
    switch (protocol) {
      case 'ssh':
        this.port.value = '22';
        break;
      case 'smb':
        this.port.value = '445';
        break;
      case 'nfs':
        this.port.value = '2049';
        break;
    }

    // Show/hide SMB share field
    this.smbShareGroup.style.display = protocol === 'smb' ? 'block' : 'none';
  }

  async connect() {
    if (!this.isElectron()) {
      alert('Remote file access is only available in the desktop app');
      return;
    }

    const config = {
      protocol: this.protocol.value,
      host: this.host.value,
      port: parseInt(this.port.value)
    };

    if (this.protocol.value === 'smb') {
      config.share = this.smbShare.value;
    }

    try {
      this.connectBtn.disabled = true;
      this.connectBtn.textContent = 'Connecting...';

      const result = await window.electronAPI.connectRemote(config);

      if (result.success) {
        this.connected = true;
        this.currentBrowserPath = this.path.value || '/';
        await this.loadDirectory(this.currentBrowserPath);
        this.fileBrowser.classList.remove('hidden');
        this.saveRecentConnection(config);
      } else {
        alert('Connection failed: ' + result.error);
      }
    } catch (error) {
      alert('Connection error: ' + error.message);
    } finally {
      this.connectBtn.disabled = false;
      this.connectBtn.textContent = 'Connect';
    }
  }

  async loadDirectory(path) {
    if (!this.connected) return;

    try {
      const remotePath = this.buildRemotePath(path);
      const result = await window.electronAPI.listRemoteDirectory(remotePath);

      if (result.success) {
        this.currentBrowserPath = path;
        this.browserPath.textContent = path;
        this.renderFileList(result.files);
      } else {
        alert('Failed to list directory: ' + result.error);
      }
    } catch (error) {
      alert('Error loading directory: ' + error.message);
    }
  }

  buildRemotePath(path) {
    const protocol = this.protocol.value;
    const host = this.host.value;
    const port = this.port.value;

    if (protocol === 'smb') {
      return `smb://${host}:${port}/${this.smbShare.value}${path}`;
    }

    return `${protocol}://${host}:${port}${path}`;
  }

  renderFileList(files) {
    this.browserList.innerHTML = '';

    // Add parent directory
    if (this.currentBrowserPath !== '/') {
      const li = document.createElement('li');
      li.className = 'file-item directory';
      li.innerHTML = '<span class="file-icon">📁</span><span class="file-name">..</span>';
      li.addEventListener('click', () => this.navigateUp());
      this.browserList.appendChild(li);
    }

    files.forEach(file => {
      const li = document.createElement('li');
      li.className = `file-item ${file.isDirectory ? 'directory' : 'file'}`;

      const icon = file.isDirectory ? '📁' : '📄';
      const size = file.size ? this.formatSize(file.size) : '';

      li.innerHTML = `
        <span class="file-icon">${icon}</span>
        <span class="file-name">${this.escapeHtml(file.name)}</span>
        <span class="file-size">${size}</span>
      `;

      if (file.isDirectory) {
        li.addEventListener('click', () => this.loadDirectory(file.path));
      } else {
        li.addEventListener('click', () => this.selectFile(file, li));
        li.addEventListener('dblclick', () => {
          this.selectFile(file, li);
          this.openFile();
        });
      }

      this.browserList.appendChild(li);
    });
  }

  selectFile(file, element) {
    // Deselect previous
    this.browserList.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));

    // Select new
    element.classList.add('selected');
    this.selectedFile = file;
    this.openBtn.disabled = false;
  }

  navigateUp() {
    const parts = this.currentBrowserPath.split('/').filter(Boolean);
    parts.pop();
    const newPath = '/' + parts.join('/');
    this.loadDirectory(newPath || '/');
  }

  refreshBrowser() {
    this.loadDirectory(this.currentBrowserPath);
  }

  async openFile() {
    if (!this.selectedFile) return;

    const remotePath = this.buildRemotePath(this.selectedFile.path);

    try {
      await window.electronAPI.openRemoteFile(remotePath);
      this.close();
    } catch (error) {
      alert('Failed to open file: ' + error.message);
    }
  }

  loadRecentConnections() {
    const recent = this.getRecentConnections();
    this.recentConnectionsList.innerHTML = '';

    if (recent.length === 0) {
      this.recentConnectionsList.innerHTML = '<li class="no-connections">No recent connections</li>';
      return;
    }

    recent.forEach(conn => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.textContent = `${conn.protocol}://${conn.host}${conn.path || ''}`;
      btn.onclick = () => this.useRecentConnection(conn);
      li.appendChild(btn);
      this.recentConnectionsList.appendChild(li);
    });
  }

  useRecentConnection(conn) {
    this.protocol.value = conn.protocol;
    this.host.value = conn.host;
    this.port.value = conn.port;
    this.path.value = conn.path || '';
    if (conn.share) {
      this.smbShare.value = conn.share;
    }
    this.updateProtocolUI();
  }

  getRecentConnections() {
    try {
      const stored = localStorage.getItem('mdviewer_recentConnections');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveRecentConnection(config) {
    try {
      let recent = this.getRecentConnections();
      const key = `${config.protocol}://${config.host}:${config.port}`;

      recent = recent.filter(c => `${c.protocol}://${c.host}:${c.port}` !== key);
      recent.unshift({
        ...config,
        path: this.path.value
      });
      recent = recent.slice(0, 5);

      localStorage.setItem('mdviewer_recentConnections', JSON.stringify(recent));
    } catch {
      // Ignore localStorage errors
    }
  }

  isElectron() {
    return window.electronAPI && window.electronAPI.isElectron;
  }

  formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
