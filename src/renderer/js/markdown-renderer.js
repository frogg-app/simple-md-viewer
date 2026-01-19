import { marked } from 'marked';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';
import katex from 'katex';
import 'highlight.js/styles/github.css';
import 'katex/dist/katex.min.css';

export class MarkdownRenderer {
  constructor() {
    this.currentFilePath = null;
    this.setupMarked();
  }

  setupMarked() {
    // Configure marked options
    marked.setOptions({
      gfm: true,
      breaks: false,
      pedantic: false,
      smartypants: false,
      headerIds: true,
      mangle: false
    });

    // Custom renderer
    const renderer = new marked.Renderer();

    // Custom heading with anchor links
    renderer.heading = (text, level, raw) => {
      const id = raw.toLowerCase().replace(/[^\w]+/g, '-');
      return `<h${level} id="${id}">
        <a class="heading-anchor" href="#${id}">#</a>
        ${text}
      </h${level}>`;
    };

    // Custom image handling
    renderer.image = (href, title, text) => {
      let resolvedHref = href;

      // Handle relative paths
      if (href && !href.startsWith('http') && !href.startsWith('data:') && this.currentFilePath) {
        // Will be resolved by the main process or web handler
        resolvedHref = this.resolveRelativePath(href);
      }

      const titleAttr = title ? ` title="${this.escapeHtml(title)}"` : '';
      return `<img src="${this.escapeHtml(resolvedHref)}" alt="${this.escapeHtml(text)}"${titleAttr} loading="lazy" onerror="this.classList.add('broken'); this.alt='Image not found: ${this.escapeHtml(href)}'">`;
    };

    // Custom link handling
    renderer.link = (href, title, text) => {
      const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));
      const attrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
      const titleAttr = title ? ` title="${this.escapeHtml(title)}"` : '';
      return `<a href="${this.escapeHtml(href)}"${titleAttr}${attrs}>${text}</a>`;
    };

    // Custom code block handling
    renderer.code = (code, language) => {
      // Check for mermaid
      if (language === 'mermaid') {
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return `<div class="mermaid-placeholder" data-mermaid="${this.escapeHtml(code)}" id="${id}"></div>`;
      }

      // Check for math blocks
      if (language === 'math' || language === 'latex') {
        try {
          const html = katex.renderToString(code, {
            displayMode: true,
            throwOnError: false
          });
          return `<div class="math-block">${html}</div>`;
        } catch (e) {
          return `<pre class="math-error"><code>${this.escapeHtml(code)}</code></pre>`;
        }
      }

      // Syntax highlighting
      let highlighted;
      if (language && hljs.getLanguage(language)) {
        try {
          highlighted = hljs.highlight(code, { language }).value;
        } catch {
          highlighted = this.escapeHtml(code);
        }
      } else {
        highlighted = this.escapeHtml(code);
      }

      const langClass = language ? ` language-${language}` : '';
      return `<pre><code class="hljs${langClass}">${highlighted}</code></pre>`;
    };

    // Custom inline code
    renderer.codespan = (code) => {
      // Check for inline math
      if (code.startsWith('$') && code.endsWith('$')) {
        const mathCode = code.slice(1, -1);
        try {
          const html = katex.renderToString(mathCode, {
            displayMode: false,
            throwOnError: false
          });
          return `<span class="math-inline">${html}</span>`;
        } catch {
          return `<code>${this.escapeHtml(code)}</code>`;
        }
      }
      return `<code>${this.escapeHtml(code)}</code>`;
    };

    // Custom table
    renderer.table = (header, body) => {
      return `<div class="table-wrapper"><table><thead>${header}</thead><tbody>${body}</tbody></table></div>`;
    };

    // Task list items
    renderer.listitem = (text, task, checked) => {
      if (task) {
        const checkbox = `<input type="checkbox" ${checked ? 'checked' : ''} disabled>`;
        return `<li class="task-list-item">${checkbox}${text}</li>`;
      }
      return `<li>${text}</li>`;
    };

    marked.use({ renderer });
  }

  async render(markdown, filePath) {
    this.currentFilePath = filePath;

    // Pre-process for block math
    let processed = this.preprocessMath(markdown);

    // Parse markdown
    let html = marked.parse(processed);

    // Sanitize HTML
    html = DOMPurify.sanitize(html, {
      ADD_TAGS: ['math', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'mroot', 'msqrt', 'mtable', 'mtr', 'mtd', 'semantics', 'annotation'],
      ADD_ATTR: ['data-mermaid', 'id', 'class', 'href', 'src', 'alt', 'title', 'target', 'rel', 'type', 'checked', 'disabled', 'loading'],
      ALLOW_DATA_ATTR: true
    });

    return html;
  }

  preprocessMath(markdown) {
    // Handle block math: $$...$$
    let result = markdown.replace(/\$\$([\s\S]+?)\$\$/g, (match, code) => {
      try {
        const html = katex.renderToString(code.trim(), {
          displayMode: true,
          throwOnError: false
        });
        return `<div class="math-block">${html}</div>`;
      } catch {
        return match;
      }
    });

    // Handle inline math: $...$
    result = result.replace(/(?<!\$)\$(?!\$)([^\$\n]+?)\$(?!\$)/g, (match, code) => {
      try {
        const html = katex.renderToString(code.trim(), {
          displayMode: false,
          throwOnError: false
        });
        return `<span class="math-inline">${html}</span>`;
      } catch {
        return match;
      }
    });

    return result;
  }

  resolveRelativePath(relativePath) {
    // In Electron, this will be handled by the main process
    // For now, just return the path as-is for basic web support
    if (this.currentFilePath) {
      // Extract directory from current file path
      const lastSlash = Math.max(
        this.currentFilePath.lastIndexOf('/'),
        this.currentFilePath.lastIndexOf('\\')
      );
      if (lastSlash > 0) {
        const dir = this.currentFilePath.substring(0, lastSlash);
        return `${dir}/${relativePath}`;
      }
    }
    return relativePath;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
