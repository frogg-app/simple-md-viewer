export class ThemeManager {
  constructor() {
    this.currentTheme = 'system';
    this.resolvedTheme = 'light';

    // Watch for system theme changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        if (this.currentTheme === 'system') {
          this.resolvedTheme = e.matches ? 'dark' : 'light';
          this.applyTheme();
        }
      });
    }
  }

  setTheme(theme, systemTheme = null) {
    this.currentTheme = theme;

    if (theme === 'system') {
      if (systemTheme) {
        this.resolvedTheme = systemTheme;
      } else {
        this.resolvedTheme = this.detectSystemTheme();
      }
    } else {
      this.resolvedTheme = theme;
    }

    this.applyTheme();
    this.savePreference();
  }

  handleSystemThemeChange(systemTheme) {
    if (this.currentTheme === 'system') {
      this.resolvedTheme = systemTheme;
      this.applyTheme();
    }
  }

  detectSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.resolvedTheme);

    // Update mermaid theme if handler is available
    if (window.app && window.app.mermaidHandler) {
      window.app.mermaidHandler.updateTheme(this.resolvedTheme);
    }
  }

  toggleTheme() {
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const newTheme = themes[nextIndex];

    if (window.electronAPI && window.electronAPI.isElectron) {
      window.electronAPI.setTheme(newTheme);
    } else {
      this.setTheme(newTheme);
    }
  }

  savePreference() {
    if (!window.electronAPI || !window.electronAPI.isElectron) {
      localStorage.setItem('mdviewer_theme', this.currentTheme);
    }
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  getResolvedTheme() {
    return this.resolvedTheme;
  }
}
