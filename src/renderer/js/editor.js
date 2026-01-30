/**
 * Markdown Editor Module
 * Provides IDE-like editing experience with line numbers, syntax highlighting,
 * and formatting tools
 */
export class MarkdownEditor {
  constructor() {
    this.content = '';
    this.isModified = false;
    this.currentFilePath = null;
    this.onContentChange = null;
    this.lineCount = 0;
  }

  /**
   * Initialize the editor with content
   * @param {string} content - Initial markdown content
   * @param {string} filePath - Path to the file being edited
   */
  init(content, filePath) {
    this.content = content;
    this.currentFilePath = filePath;
    this.isModified = false;
    
    const textarea = document.getElementById('editor-textarea');
    const lineNumbers = document.getElementById('editor-line-numbers');
    
    if (textarea) {
      textarea.value = content;
      this.updateLineNumbers();
      this.setupEventListeners();
    }
  }

  /**
   * Setup event listeners for the editor
   */
  setupEventListeners() {
    const textarea = document.getElementById('editor-textarea');
    
    if (!textarea) return;
    
    // Handle input for live preview
    textarea.addEventListener('input', () => {
      this.content = textarea.value;
      this.isModified = true;
      this.updateLineNumbers();
      
      if (this.onContentChange) {
        this.onContentChange(this.content);
      }
    });
    
    // Handle scroll sync with line numbers
    textarea.addEventListener('scroll', () => {
      const lineNumbers = document.getElementById('editor-line-numbers');
      if (lineNumbers) {
        lineNumbers.scrollTop = textarea.scrollTop;
      }
    });
    
    // Handle tab key for indentation
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        // Insert tab at cursor
        textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 2;
        
        this.content = textarea.value;
        this.isModified = true;
        this.updateLineNumbers();
        
        if (this.onContentChange) {
          this.onContentChange(this.content);
        }
      }
    });
  }

  /**
   * Update line numbers display
   */
  updateLineNumbers() {
    const textarea = document.getElementById('editor-textarea');
    const lineNumbers = document.getElementById('editor-line-numbers');
    
    if (!textarea || !lineNumbers) return;
    
    const lines = textarea.value.split('\n');
    this.lineCount = lines.length;
    
    lineNumbers.innerHTML = lines
      .map((_, i) => `<span class="line-number">${i + 1}</span>`)
      .join('\n');
  }

  /**
   * Get current content
   * @returns {string} Current editor content
   */
  getContent() {
    const textarea = document.getElementById('editor-textarea');
    return textarea ? textarea.value : this.content;
  }

  /**
   * Set editor content
   * @param {string} content - Content to set
   */
  setContent(content) {
    this.content = content;
    const textarea = document.getElementById('editor-textarea');
    if (textarea) {
      textarea.value = content;
      this.updateLineNumbers();
    }
  }

  /**
   * Insert text at cursor position
   * @param {string} before - Text to insert before selection
   * @param {string} after - Text to insert after selection
   * @param {string} placeholder - Default text if no selection
   */
  insertAtCursor(before, after = '', placeholder = '') {
    const textarea = document.getElementById('editor-textarea');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newText = before + textToInsert + after;
    
    textarea.value = 
      textarea.value.substring(0, start) + 
      newText + 
      textarea.value.substring(end);
    
    // Position cursor appropriately
    if (selectedText) {
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = start + before.length + textToInsert.length;
    } else {
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = start + before.length + placeholder.length;
    }
    
    textarea.focus();
    
    this.content = textarea.value;
    this.isModified = true;
    this.updateLineNumbers();
    
    if (this.onContentChange) {
      this.onContentChange(this.content);
    }
  }

  /**
   * Insert text at the beginning of the current line
   * @param {string} prefix - Text to insert at line start
   */
  insertAtLineStart(prefix) {
    const textarea = document.getElementById('editor-textarea');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const text = textarea.value;
    
    // Find the start of the current line
    let lineStart = start;
    while (lineStart > 0 && text[lineStart - 1] !== '\n') {
      lineStart--;
    }
    
    textarea.value = text.substring(0, lineStart) + prefix + text.substring(lineStart);
    
    // Move cursor after the inserted prefix
    textarea.selectionStart = textarea.selectionEnd = start + prefix.length;
    textarea.focus();
    
    this.content = textarea.value;
    this.isModified = true;
    this.updateLineNumbers();
    
    if (this.onContentChange) {
      this.onContentChange(this.content);
    }
  }

  // Formatting helper methods
  formatBold() {
    this.insertAtCursor('**', '**', 'bold text');
  }

  formatItalic() {
    this.insertAtCursor('*', '*', 'italic text');
  }

  formatStrikethrough() {
    this.insertAtCursor('~~', '~~', 'strikethrough');
  }

  formatCode() {
    this.insertAtCursor('`', '`', 'code');
  }

  formatCodeBlock() {
    this.insertAtCursor('```\n', '\n```', 'code block');
  }

  formatLink() {
    this.insertAtCursor('[', '](url)', 'link text');
  }

  formatImage() {
    this.insertAtCursor('![', '](url)', 'alt text');
  }

  formatHeading(level) {
    const prefix = '#'.repeat(level) + ' ';
    this.insertAtLineStart(prefix);
  }

  formatBulletList() {
    this.insertAtLineStart('- ');
  }

  formatNumberedList() {
    this.insertAtLineStart('1. ');
  }

  formatTaskList() {
    this.insertAtLineStart('- [ ] ');
  }

  formatBlockquote() {
    this.insertAtLineStart('> ');
  }

  formatHorizontalRule() {
    const textarea = document.getElementById('editor-textarea');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const text = textarea.value;
    
    // Find the end of current line
    let lineEnd = start;
    while (lineEnd < text.length && text[lineEnd] !== '\n') {
      lineEnd++;
    }
    
    textarea.value = text.substring(0, lineEnd) + '\n\n---\n\n' + text.substring(lineEnd);
    textarea.selectionStart = textarea.selectionEnd = lineEnd + 5;
    textarea.focus();
    
    this.content = textarea.value;
    this.isModified = true;
    this.updateLineNumbers();
    
    if (this.onContentChange) {
      this.onContentChange(this.content);
    }
  }

  formatTable() {
    const tableTemplate = `| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |`;
    
    this.insertAtCursor('\n' + tableTemplate + '\n', '', '');
  }

  /**
   * Check if content has been modified
   * @returns {boolean}
   */
  hasUnsavedChanges() {
    return this.isModified;
  }

  /**
   * Mark content as saved
   */
  markAsSaved() {
    this.isModified = false;
  }
}
