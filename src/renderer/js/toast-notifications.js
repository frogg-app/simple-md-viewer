export class ToastNotifications {
  constructor(settingsManager) {
    this.container = document.getElementById('toast-container');
    this.toasts = new Map();
    this.counter = 0;
    this.settingsManager = settingsManager;
    this.updatePosition();
  }

  updatePosition() {
    const centered = this.settingsManager?.get('centerToasts') || false;
    if (centered) {
      this.container.classList.add('centered');
    } else {
      this.container.classList.remove('centered');
    }
  }

  show(message, type = 'info', duration = 3000) {
    const id = ++this.counter;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <span class="toast-message">${this.escapeHtml(message)}</span>
      <button class="toast-close" aria-label="Close">&times;</button>
    `;

    // Close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.hide(id));

    this.container.appendChild(toast);
    this.toasts.set(id, toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Auto-hide
    if (duration > 0) {
      setTimeout(() => this.hide(id), duration);
    }

    return id;
  }

  hide(id) {
    const toast = this.toasts.get(id);
    if (toast) {
      toast.classList.remove('show');
      toast.classList.add('hide');

      // Remove after animation
      setTimeout(() => {
        toast.remove();
        this.toasts.delete(id);
      }, 300);
    }
  }

  success(message, duration = 3000) {
    return this.show(message, 'success', duration);
  }

  error(message, duration = 5000) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration = 4000) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration = 3000) {
    return this.show(message, 'info', duration);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  clear() {
    this.toasts.forEach((toast, id) => this.hide(id));
  }
}
