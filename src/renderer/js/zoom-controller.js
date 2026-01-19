export class ZoomController {
  constructor(container) {
    this.container = container;
    this.viewport = container.querySelector('.diagram-viewport');
    this.content = container.querySelector('.diagram-content');
    this.zoomLevelDisplay = container.querySelector('.zoom-level');

    this.scale = 1;
    this.minScale = 0.1;
    this.maxScale = 5;
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;
    this.startX = 0;
    this.startY = 0;

    this.previousState = null;

    this.bindEvents();
    this.fitInitially();
  }

  bindEvents() {
    // Toolbar buttons
    const zoomInBtn = this.container.querySelector('.zoom-in');
    const zoomOutBtn = this.container.querySelector('.zoom-out');
    const zoomResetBtn = this.container.querySelector('.zoom-reset');
    const zoomFitBtn = this.container.querySelector('.zoom-fit');
    const fullscreenBtn = this.container.querySelector('.fullscreen');

    zoomInBtn?.addEventListener('click', () => this.zoomIn());
    zoomOutBtn?.addEventListener('click', () => this.zoomOut());
    zoomResetBtn?.addEventListener('click', () => this.resetZoom());
    zoomFitBtn?.addEventListener('click', () => this.fitToWidth());
    fullscreenBtn?.addEventListener('click', () => this.toggleFullscreen());

    // Mouse wheel zoom
    this.viewport.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

    // Mouse panning
    this.viewport.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    document.addEventListener('mouseup', () => this.handleMouseUp());

    // Touch support
    this.viewport.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.viewport.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.viewport.addEventListener('touchend', () => this.handleTouchEnd());

    // Keyboard shortcuts when focused
    this.container.addEventListener('keydown', (e) => this.handleKeydown(e));
    this.container.setAttribute('tabindex', '0');

    // Fullscreen change
    document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
  }

  zoomIn() {
    this.setScale(this.scale * 1.25);
  }

  zoomOut() {
    this.setScale(this.scale / 1.25);
  }

  resetZoom() {
    this.scale = 1;
    this.panX = 0;
    this.panY = 0;
    this.applyTransform();
    this.updateZoomDisplay();
  }

  fitToWidth() {
    const viewportWidth = this.viewport.clientWidth;
    const svg = this.content.querySelector('svg');
    if (svg) {
      const contentWidth = svg.getBoundingClientRect().width / this.scale;
      this.setScale((viewportWidth / contentWidth) * 0.95);
      this.panX = 0;
      this.panY = 0;
      this.applyTransform();
    }
  }

  fitInitially() {
    // Auto-fit large diagrams
    requestAnimationFrame(() => {
      const svg = this.content.querySelector('svg');
      if (svg) {
        const svgWidth = svg.getBoundingClientRect().width;
        const viewportWidth = this.viewport.clientWidth;
        if (svgWidth > viewportWidth) {
          this.fitToWidth();
        }
      }
    });
  }

  setScale(newScale) {
    this.scale = Math.max(this.minScale, Math.min(this.maxScale, newScale));
    this.applyTransform();
    this.updateZoomDisplay();
  }

  applyTransform() {
    this.content.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`;
    this.content.style.transformOrigin = 'center center';
  }

  updateZoomDisplay() {
    if (this.zoomLevelDisplay) {
      this.zoomLevelDisplay.textContent = `${Math.round(this.scale * 100)}%`;
    }
  }

  handleWheel(e) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const rect = this.viewport.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.zoomAtPoint(x, y, delta);
    }
  }

  zoomAtPoint(x, y, factor) {
    const oldScale = this.scale;
    const newScale = Math.max(this.minScale, Math.min(this.maxScale, oldScale * factor));

    if (newScale !== oldScale) {
      // Adjust pan to zoom toward mouse position
      const rect = this.viewport.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const dx = (x - centerX) / oldScale;
      const dy = (y - centerY) / oldScale;

      this.panX -= dx * (newScale - oldScale);
      this.panY -= dy * (newScale - oldScale);
      this.scale = newScale;

      this.applyTransform();
      this.updateZoomDisplay();
    }
  }

  handleMouseDown(e) {
    if (e.button === 0) {
      this.isPanning = true;
      this.startX = e.clientX - this.panX;
      this.startY = e.clientY - this.panY;
      this.viewport.style.cursor = 'grabbing';
      e.preventDefault();
    }
  }

  handleMouseMove(e) {
    if (this.isPanning) {
      this.panX = e.clientX - this.startX;
      this.panY = e.clientY - this.startY;
      this.applyTransform();
    }
  }

  handleMouseUp() {
    if (this.isPanning) {
      this.isPanning = false;
      this.viewport.style.cursor = 'grab';
    }
  }

  handleTouchStart(e) {
    if (e.touches.length === 1) {
      this.isPanning = true;
      this.startX = e.touches[0].clientX - this.panX;
      this.startY = e.touches[0].clientY - this.panY;
    } else if (e.touches.length === 2) {
      // Pinch zoom
      this.isPanning = false;
      this.initialPinchDistance = this.getPinchDistance(e.touches);
      this.initialScale = this.scale;
    }
  }

  handleTouchMove(e) {
    e.preventDefault();

    if (e.touches.length === 1 && this.isPanning) {
      this.panX = e.touches[0].clientX - this.startX;
      this.panY = e.touches[0].clientY - this.startY;
      this.applyTransform();
    } else if (e.touches.length === 2) {
      const currentDistance = this.getPinchDistance(e.touches);
      const scaleFactor = currentDistance / this.initialPinchDistance;
      this.setScale(this.initialScale * scaleFactor);
    }
  }

  handleTouchEnd() {
    this.isPanning = false;
  }

  getPinchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  handleKeydown(e) {
    // Arrow keys for panning
    const panStep = 20;
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        this.panY += panStep;
        this.applyTransform();
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.panY -= panStep;
        this.applyTransform();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.panX += panStep;
        this.applyTransform();
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.panX -= panStep;
        this.applyTransform();
        break;
      case 'f':
      case 'F':
        e.preventDefault();
        this.toggleFullscreen();
        break;
    }
  }

  toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      this.previousState = {
        scale: this.scale,
        panX: this.panX,
        panY: this.panY
      };
      this.container.requestFullscreen();
    }
  }

  handleFullscreenChange() {
    if (!document.fullscreenElement && this.previousState) {
      // Restore previous state when exiting fullscreen
      this.scale = this.previousState.scale;
      this.panX = this.previousState.panX;
      this.panY = this.previousState.panY;
      this.applyTransform();
      this.updateZoomDisplay();
      this.previousState = null;
    }
  }

  destroy() {
    // Remove event listeners if needed
    // In practice, the container will be removed from DOM
  }
}
