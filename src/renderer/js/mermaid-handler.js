import mermaid from 'mermaid';
import { ZoomController } from './zoom-controller.js';

export class MermaidHandler {
  constructor() {
    this.initialized = false;
    this.zoomControllers = new Map();
  }

  init(theme = 'default') {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'dark' ? 'dark' : 'default',
      securityLevel: 'strict',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: 14,
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      },
      sequence: {
        useMaxWidth: true,
        wrap: true
      },
      gantt: {
        useMaxWidth: true
      },
      er: {
        useMaxWidth: true
      }
    });
    this.initialized = true;
  }

  async renderDiagrams(container) {
    if (!this.initialized) {
      this.init();
    }

    // Clean up existing zoom controllers
    this.zoomControllers.forEach(controller => controller.destroy());
    this.zoomControllers.clear();

    const mermaidBlocks = container.querySelectorAll('.mermaid-placeholder');

    for (const block of mermaidBlocks) {
      const encoded = block.getAttribute('data-mermaid');
      // Decode base64 to get original mermaid code
      const code = decodeURIComponent(escape(atob(encoded)));
      const id = block.id;

      try {
        const { svg } = await mermaid.render(id + '-svg', code);
        block.innerHTML = this.wrapWithZoomContainer(svg, id);
        block.classList.remove('mermaid-placeholder');
        block.classList.add('mermaid-rendered');

        // Initialize zoom controller
        const diagramContainer = block.querySelector('.diagram-container');
        if (diagramContainer) {
          const zoomController = new ZoomController(diagramContainer);
          this.zoomControllers.set(id, zoomController);
        }
      } catch (error) {
        block.innerHTML = `<div class="mermaid-error">
          <span class="error-icon">⚠</span>
          <span>Diagram syntax error</span>
          <pre>${this.escapeHtml(error.message || 'Unknown error')}</pre>
        </div>`;
        block.classList.remove('mermaid-placeholder');
        block.classList.add('mermaid-error-container');
      }
    }
  }

  wrapWithZoomContainer(svg, id) {
    return `
      <div class="diagram-container" data-diagram-id="${id}">
        <div class="diagram-toolbar">
          <button class="zoom-in" title="Zoom In (Ctrl++)">+</button>
          <span class="zoom-level">100%</span>
          <button class="zoom-out" title="Zoom Out (Ctrl+-)">−</button>
          <button class="zoom-reset" title="Reset Zoom (Ctrl+0)">↺</button>
          <button class="zoom-fit" title="Fit to Width">⤢</button>
          <button class="fullscreen" title="Fullscreen (F)">⛶</button>
        </div>
        <div class="diagram-viewport">
          <div class="diagram-content">
            ${svg}
          </div>
        </div>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  updateTheme(theme) {
    this.init(theme);
  }

  getZoomController(id) {
    return this.zoomControllers.get(id);
  }

  destroy() {
    this.zoomControllers.forEach(controller => controller.destroy());
    this.zoomControllers.clear();
  }
}
