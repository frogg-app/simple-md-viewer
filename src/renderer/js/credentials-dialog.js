export class CredentialsDialog {
  constructor() {
    this.dialog = document.getElementById('credentials-dialog');
    this.hostEl = document.getElementById('cred-host');
    this.protocolEl = document.getElementById('cred-protocol');
    this.usernameEl = document.getElementById('cred-username');
    this.passwordEl = document.getElementById('cred-password');
    this.keyfileEl = document.getElementById('cred-keyfile');
    this.domainEl = document.getElementById('cred-domain');
    this.rememberEl = document.getElementById('cred-remember');

    this.sshKeyGroup = document.getElementById('ssh-key-group');
    this.smbDomainGroup = document.getElementById('smb-domain-group');

    this.cancelBtn = document.getElementById('cred-cancel');

    this.currentRequest = null;

    this.bindEvents();
  }

  bindEvents() {
    this.cancelBtn.addEventListener('click', () => this.cancel());

    this.dialog.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submit();
    });

    this.dialog.addEventListener('close', () => {
      if (this.currentRequest) {
        this.cancel();
      }
    });
  }

  show(data) {
    this.currentRequest = data;

    // Populate dialog
    this.hostEl.textContent = data.host;
    this.protocolEl.textContent = data.protocol.toUpperCase();
    this.usernameEl.value = data.defaultUsername || '';
    this.passwordEl.value = '';
    this.rememberEl.checked = false;

    // Show/hide protocol-specific fields
    if (data.protocol === 'ssh' || data.protocol === 'sftp') {
      this.sshKeyGroup.style.display = 'block';
      this.smbDomainGroup.style.display = 'none';
    } else if (data.protocol === 'smb') {
      this.sshKeyGroup.style.display = 'none';
      this.smbDomainGroup.style.display = 'block';
    } else {
      this.sshKeyGroup.style.display = 'none';
      this.smbDomainGroup.style.display = 'none';
    }

    this.dialog.showModal();
    this.usernameEl.focus();
  }

  async submit() {
    if (!this.currentRequest) return;

    const credentials = {
      username: this.usernameEl.value,
      password: this.passwordEl.value
    };

    // Handle SSH key file
    if (this.keyfileEl.files.length > 0) {
      const file = this.keyfileEl.files[0];
      try {
        credentials.privateKey = await this.readFileAsText(file);
      } catch (error) {
        alert('Failed to read key file: ' + error.message);
        return;
      }
    }

    // Handle SMB domain
    if (this.domainEl.value) {
      credentials.domain = this.domainEl.value;
    }

    if (window.electronAPI && window.electronAPI.isElectron) {
      window.electronAPI.sendCredentialsResponse({
        id: this.currentRequest.id,
        cancelled: false,
        credentials,
        remember: this.rememberEl.checked
      });
    }

    this.currentRequest = null;
    this.dialog.close();
  }

  cancel() {
    if (this.currentRequest && window.electronAPI && window.electronAPI.isElectron) {
      window.electronAPI.sendCredentialsResponse({
        id: this.currentRequest.id,
        cancelled: true
      });
    }

    this.currentRequest = null;
    this.dialog.close();
  }

  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}
