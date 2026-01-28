import { test, expect } from '@playwright/test';

/**
 * Comprehensive screenshot test suite for mobile and desktop views
 * This creates a complete app flow documentation with screenshots
 */

test.describe('App Screenshots - Complete Flow', () => {
  
  test('01 - Welcome Screen / Empty State', async ({ page }, testInfo) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForSelector('#empty-state', { state: 'visible' });
    
    // Take screenshot
    await page.screenshot({ 
      path: `tests/screenshots/${testInfo.project.name}/01-welcome-screen.png`,
      fullPage: true 
    });
  });

  test('02 - Welcome Screen with Docs Folder', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForSelector('#empty-state', { state: 'visible' });
    
    // Wait a bit for any dynamic content to load
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: `tests/screenshots/${testInfo.project.name}/02-welcome-with-docs.png`,
      fullPage: true 
    });
  });

  test('03 - File Menu Opened', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForSelector('#menu-bar', { state: 'visible' });
    
    // Click the File menu
    await page.click('text=File');
    await page.waitForSelector('.menu-dropdown', { state: 'visible' });
    
    await page.screenshot({ 
      path: `tests/screenshots/${testInfo.project.name}/03-file-menu.png`,
      fullPage: true 
    });
  });

  test('04 - View Menu Opened', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForSelector('#menu-bar', { state: 'visible' });
    
    // Click the View menu
    await page.click('text=View');
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: `tests/screenshots/${testInfo.project.name}/04-view-menu.png`,
      fullPage: true 
    });
  });

  test('05 - Help Menu Opened', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForSelector('#menu-bar', { state: 'visible' });
    
    // Click the Help menu
    await page.click('text=Help');
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: `tests/screenshots/${testInfo.project.name}/05-help-menu.png`,
      fullPage: true 
    });
  });

  test('06 - Settings Dialog', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForSelector('#menu-bar', { state: 'visible' });
    
    // Open File menu and click Settings
    await page.click('text=File');
    await page.waitForSelector('.menu-dropdown', { state: 'visible' });
    await page.click('#menu-settings');
    
    // Wait for dialog to open
    await page.waitForSelector('#settings-dialog[open]', { state: 'visible' });
    await page.waitForTimeout(300);
    
    await page.screenshot({ 
      path: `tests/screenshots/${testInfo.project.name}/06-settings-dialog.png`,
      fullPage: true 
    });
  });

  test('07 - Keyboard Shortcuts Dialog', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForSelector('#menu-bar', { state: 'visible' });
    
    // Open Help menu and click Shortcuts
    await page.click('text=Help');
    await page.waitForTimeout(500);
    await page.click('#menu-shortcuts');
    
    // Wait for dialog to open
    await page.waitForSelector('#shortcuts-dialog[open]', { state: 'visible' });
    await page.waitForTimeout(300);
    
    await page.screenshot({ 
      path: `tests/screenshots/${testInfo.project.name}/07-shortcuts-dialog.png`,
      fullPage: true 
    });
  });

  test('08 - About Dialog', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForSelector('#menu-bar', { state: 'visible' });
    
    // Open Help menu and click About
    await page.click('text=Help');
    await page.waitForTimeout(500);
    await page.click('#menu-about');
    
    // Wait for dialog to open
    await page.waitForSelector('#about-dialog[open]', { state: 'visible' });
    await page.waitForTimeout(300);
    
    await page.screenshot({ 
      path: `tests/screenshots/${testInfo.project.name}/08-about-dialog.png`,
      fullPage: true 
    });
  });

  test('09 - Markdown Content View (Basic)', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForSelector('#empty-state', { state: 'visible' });
    
    // Create sample markdown content via drag and drop simulation
    const markdownContent = `# Sample Markdown Document

This is a **bold** statement and this is *italic* text.

## Features List

- GitHub Flavored Markdown
- Syntax highlighting
- Mermaid diagrams
- LaTeX math support

### Code Example

\`\`\`javascript
function hello() {
  console.log('Hello, World!');
}
\`\`\`

### Table Example

| Feature | Supported |
|---------|-----------|
| Tables  | ✓         |
| Links   | ✓         |
| Images  | ✓         |

> This is a blockquote with important information.

Visit [GitHub](https://github.com) for more info.`;

    // Inject the markdown content directly
    await page.evaluate((content) => {
      const emptyState = document.getElementById('empty-state');
      const contentArea = document.getElementById('content');
      const markdownContent = document.getElementById('markdown-content');
      
      if (emptyState && contentArea && markdownContent) {
        emptyState.classList.add('hidden');
        contentArea.classList.remove('hidden');
        
        // Manually render simple markdown for the screenshot
        markdownContent.innerHTML = content
          .replace(/#{3} (.*)/g, '<h3>$1</h3>')
          .replace(/#{2} (.*)/g, '<h2>$1</h2>')
          .replace(/#{1} (.*)/g, '<h1>$1</h1>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/^- (.*)/gm, '<li>$1</li>')
          .replace(/```javascript\n([\s\S]*?)```/g, '<pre><code class="language-javascript">$1</code></pre>')
          .replace(/> (.*)/g, '<blockquote>$1</blockquote>')
          .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
          .replace(/\n\n/g, '</p><p>')
          .replace(/^\|(.+)\|$/gm, (match) => {
            const cells = match.split('|').filter(s => s.trim());
            return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
          });
        
        markdownContent.innerHTML = '<div class="markdown-body">' + markdownContent.innerHTML + '</div>';
      }
    }, markdownContent);
    
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: `tests/screenshots/${testInfo.project.name}/09-markdown-content.png`,
      fullPage: true 
    });
  });

  test('10 - Markdown Content with Scroll', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForSelector('#empty-state', { state: 'visible' });
    
    // Create longer markdown content
    const longContent = `# Long Document

${Array(20).fill(0).map((_, i) => `
## Section ${i + 1}

This is section ${i + 1} with some content. Lorem ipsum dolor sit amet, consectetur adipiscing elit.

- Item 1
- Item 2
- Item 3

`).join('\n')}`;

    await page.evaluate((content) => {
      const emptyState = document.getElementById('empty-state');
      const contentArea = document.getElementById('content');
      const markdownContent = document.getElementById('markdown-content');
      
      if (emptyState && contentArea && markdownContent) {
        emptyState.classList.add('hidden');
        contentArea.classList.remove('hidden');
        markdownContent.innerHTML = '<div class="markdown-body">' + content
          .replace(/#{2} (.*)/g, '<h2>$1</h2>')
          .replace(/#{1} (.*)/g, '<h1>$1</h1>')
          .replace(/^- (.*)/gm, '<li>$1</li>') + '</div>';
      }
    }, longContent);
    
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: `tests/screenshots/${testInfo.project.name}/10-long-markdown.png`,
      fullPage: false // Show viewport only to demonstrate scrolling
    });
  });

  test('11 - Toast Notification', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForSelector('#empty-state', { state: 'visible' });
    
    // Trigger a toast notification
    await page.evaluate(() => {
      const toastContainer = document.getElementById('toast-container');
      if (toastContainer) {
        const toast = document.createElement('div');
        toast.className = 'toast toast-success show';
        toast.innerHTML = `
          <span class="toast-message">File loaded successfully!</span>
          <button class="toast-close">×</button>
        `;
        toastContainer.appendChild(toast);
      }
    });
    
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: `tests/screenshots/${testInfo.project.name}/11-toast-notification.png`,
      fullPage: true 
    });
  });

  test('12 - Loading Overlay', async ({ page }, testInfo) => {
    await page.goto('/');
    
    // Show loading overlay
    await page.evaluate(() => {
      const overlay = document.getElementById('loading-overlay');
      if (overlay) {
        overlay.classList.remove('hidden');
      }
    });
    
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: `tests/screenshots/${testInfo.project.name}/12-loading-overlay.png`,
      fullPage: true 
    });
  });

  test('13 - Dark Theme Welcome Screen', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForSelector('#empty-state', { state: 'visible' });
    
    // Verify dark theme is active (default)
    const theme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    
    expect(theme).toBe('dark');
    
    await page.screenshot({ 
      path: `tests/screenshots/${testInfo.project.name}/13-dark-theme.png`,
      fullPage: true 
    });
  });

  test('14 - Light Theme Welcome Screen', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForSelector('#empty-state', { state: 'visible' });
    
    // Toggle to light theme
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });
    
    await page.waitForTimeout(300);
    
    await page.screenshot({ 
      path: `tests/screenshots/${testInfo.project.name}/14-light-theme.png`,
      fullPage: true 
    });
  });

  test('15 - Responsive Layout Check', async ({ page }, testInfo) => {
    const viewport = testInfo.project.use.viewport;
    await page.goto('/');
    await page.waitForSelector('#empty-state', { state: 'visible' });
    
    // Add viewport info to the page for documentation
    await page.evaluate(({ width, height }) => {
      const info = document.createElement('div');
      info.style.cssText = 'position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 8px 12px; border-radius: 4px; font-size: 12px; z-index: 10000;';
      info.textContent = `${width}×${height}`;
      document.body.appendChild(info);
    }, viewport);
    
    await page.waitForTimeout(300);
    
    await page.screenshot({ 
      path: `tests/screenshots/${testInfo.project.name}/15-responsive-${viewport.width}x${viewport.height}.png`,
      fullPage: true 
    });
  });
});

// Generate a summary index file
test.afterAll(async () => {
  const fs = require('fs');
  const path = require('path');
  
  const screenshotsDir = path.join(__dirname, 'screenshots');
  
  // Create README for screenshots
  const readmeContent = `# App Screenshots - Complete Flow Documentation

This directory contains comprehensive screenshots of the Simple MD Viewer application across different devices and screen sizes.

## Test Plan

These screenshots represent the complete user flow through the application and serve as visual regression test baseline.

### Views Captured

1. **Welcome Screen / Empty State** - Initial landing page
2. **Welcome Screen with Docs Folder** - Home with available files
3. **File Menu** - File operations dropdown
4. **View Menu** - View options dropdown
5. **Help Menu** - Help and documentation dropdown
6. **Settings Dialog** - Configuration interface
7. **Keyboard Shortcuts Dialog** - Shortcut reference
8. **About Dialog** - App information
9. **Markdown Content View** - Document rendering (basic)
10. **Long Markdown Document** - Scrollable content
11. **Toast Notification** - Success message example
12. **Loading Overlay** - Loading state
13. **Dark Theme** - Default dark appearance
14. **Light Theme** - Light mode appearance
15. **Responsive Layout** - Various viewport sizes

## Devices Tested

- **Desktop**: 1280×720 (Chromium)
- **Mobile - iPhone**: iPhone 13 (390×844)
- **Mobile - Android**: Pixel 5 (393×851)
- **Tablet**: iPad (810×1080)

## Usage

These screenshots are automatically generated by the Playwright test suite and should be reviewed:

1. After any UI changes
2. Before major releases
3. When investigating visual bugs
4. For design reviews and stakeholder presentations

## Viewing

Open the screenshots by device type:
- \`desktop-chromium/\` - Desktop browser screenshots
- \`mobile-iphone/\` - iPhone mobile screenshots
- \`mobile-android/\` - Android mobile screenshots
- \`tablet-ipad/\` - iPad tablet screenshots

## Updating

To update screenshots, run:
\`\`\`bash
npm run test:e2e
\`\`\`

---

*Last generated: ${new Date().toISOString()}*
`;
  
  try {
    fs.writeFileSync(path.join(screenshotsDir, 'README.md'), readmeContent);
  } catch (e) {
    console.log('Note: Could not write README.md', e.message);
  }
});
