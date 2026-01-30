/**
 * Markdown Editor Module
 * Uses CodeMirror 6 for syntax highlighting, undo/redo, and a modern editing experience
 */
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';

// Custom dark theme for CodeMirror that matches our app
const darkTheme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    height: '100%',
    fontSize: '14px',
  },
  '.cm-content': {
    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Droid Sans Mono', monospace",
    padding: '1rem 0',
    caretColor: 'var(--link-color)',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--link-color)',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'rgba(88, 166, 255, 0.2)',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-secondary)',
    border: 'none',
    borderRight: '1px solid var(--border-color)',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 8px 0 16px',
    minWidth: '40px',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(88, 166, 255, 0.05)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(88, 166, 255, 0.1)',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
}, { dark: true });

export class MarkdownEditor {
  constructor() {
    this.content = '';
    this.originalContent = '';
    this.currentFilePath = null;
    this.onContentChange = null;
    this.editorView = null;
  }

  /**
   * Initialize the editor with content
   * @param {string} content - Initial markdown content
   * @param {string} filePath - Path to the file being edited
   */
  init(content, filePath) {
    this.content = content;
    this.originalContent = content;
    this.currentFilePath = filePath;
    
    const container = document.getElementById('editor-container');
    if (!container) return;
    
    // Clear any existing editor
    if (this.editorView) {
      this.editorView.destroy();
    }
    container.innerHTML = '';
    
    // Create CodeMirror editor
    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        this.content = update.state.doc.toString();
        if (this.onContentChange) {
          this.onContentChange(this.content);
        }
      }
    });
    
    const state = EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        highlightSelectionMatches(),
        markdown(),
        syntaxHighlighting(defaultHighlightStyle),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...searchKeymap,
          indentWithTab,
        ]),
        darkTheme,
        updateListener,
        EditorView.lineWrapping,
      ],
    });
    
    this.editorView = new EditorView({
      state,
      parent: container,
    });
  }

  /**
   * Get current content
   * @returns {string} Current editor content
   */
  getContent() {
    if (this.editorView) {
      return this.editorView.state.doc.toString();
    }
    return this.content;
  }

  /**
   * Set editor content
   * @param {string} content - Content to set
   */
  setContent(content) {
    this.content = content;
    if (this.editorView) {
      this.editorView.dispatch({
        changes: {
          from: 0,
          to: this.editorView.state.doc.length,
          insert: content,
        },
      });
    }
  }

  /**
   * Check if content has been modified
   * @returns {boolean}
   */
  hasUnsavedChanges() {
    return this.content !== this.originalContent;
  }

  /**
   * Mark content as saved
   */
  markAsSaved() {
    this.originalContent = this.content;
  }

  /**
   * Focus the editor
   */
  focus() {
    if (this.editorView) {
      this.editorView.focus();
    }
  }

  /**
   * Destroy the editor instance
   */
  destroy() {
    if (this.editorView) {
      this.editorView.destroy();
      this.editorView = null;
    }
  }
}
