/**
 * Markdown Editor Module
 * Uses CodeMirror 6 for syntax highlighting, undo/redo, and a modern editing experience
 */
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { tags } from '@lezer/highlight';

// Custom markdown highlight style - VS Code inspired, no underlines
const markdownHighlightStyle = HighlightStyle.define([
  // Headings - cyan/blue color
  { tag: tags.heading, color: '#569cd6', fontWeight: 'bold' },
  { tag: tags.heading1, color: '#569cd6', fontWeight: 'bold', fontSize: '1.3em' },
  { tag: tags.heading2, color: '#569cd6', fontWeight: 'bold', fontSize: '1.2em' },
  { tag: tags.heading3, color: '#569cd6', fontWeight: 'bold', fontSize: '1.1em' },
  
  // Emphasis
  { tag: tags.emphasis, color: '#dcdcaa', fontStyle: 'italic' },
  { tag: tags.strong, color: '#dcdcaa', fontWeight: 'bold' },
  { tag: tags.strikethrough, textDecoration: 'line-through', color: '#808080' },
  
  // Links - no underline, just color
  { tag: tags.link, color: '#4ec9b0' },
  { tag: tags.url, color: '#ce9178' },
  
  // Code
  { tag: tags.monospace, color: '#ce9178', fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace" },
  
  // Lists and quotes
  { tag: tags.list, color: '#d4d4d4' },
  { tag: tags.quote, color: '#6a9955', fontStyle: 'italic' },
  
  // Meta (markdown markers like #, *, etc.)
  { tag: tags.processingInstruction, color: '#808080' },
  { tag: tags.meta, color: '#808080' },
  
  // Content separator (horizontal rule)
  { tag: tags.contentSeparator, color: '#808080' },
  
  // Comments
  { tag: tags.comment, color: '#6a9955', fontStyle: 'italic' },
]);

// Custom dark theme for CodeMirror - VS Code style
const darkTheme = EditorView.theme({
  '&': {
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
    height: '100%',
    fontSize: '14px',
  },
  '.cm-content': {
    fontFamily: "'Consolas', 'Monaco', 'SF Mono', 'Fira Code', 'Droid Sans Mono', monospace",
    padding: '1rem 0',
    caretColor: '#aeafad',
    lineHeight: '1.6',
  },
  '.cm-line': {
    padding: '0 1rem',
  },
  '.cm-cursor': {
    borderLeftColor: '#aeafad',
    borderLeftWidth: '2px',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'rgba(38, 79, 120, 0.6)',
  },
  '.cm-gutters': {
    backgroundColor: '#1e1e1e',
    color: '#858585',
    border: 'none',
    borderRight: '1px solid #404040',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 12px 0 20px',
    minWidth: '48px',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    color: '#c6c6c6',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
  '.cm-matchingBracket': {
    backgroundColor: 'rgba(0, 100, 0, 0.3)',
    outline: '1px solid #888',
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
        syntaxHighlighting(markdownHighlightStyle),
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
