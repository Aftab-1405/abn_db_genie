// Theme utility for consistent color management
export const ThemeUtil = {
  // Get CSS variable value
  getThemeVar(varName) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(`--${varName}`).trim();
  },

  // Get current theme
  getCurrentTheme() {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  },

  // Apply theme styles to a dynamically created element
  applyThemeStyles(element, styles) {
    const isDark = this.getCurrentTheme() === 'dark';
    
    if (styles.background) {
      element.style.backgroundColor = `var(--app-surface-${styles.background})`;
    }
    
    if (styles.text) {
      element.style.color = `var(--app-text-${styles.text})`;
    }
    
    if (styles.border) {
      element.style.borderColor = `var(--app-border-${styles.border})`;
    }
    
    if (styles.accent) {
      element.style.accentColor = `var(--app-accent-${styles.accent})`;
    }
  },

  // Style a notification based on its type
  applyNotificationStyles(element, type = 'info') {
    element.style.backgroundColor = `var(--notification-${type}-bg)`;
    element.style.color = `var(--notification-${type}-text)`;
    element.style.border = `1px solid var(--app-border-primary)`;
  },

  // Style code blocks
  applyCodeBlockStyles(element, language) {
    element.style.backgroundColor = 'var(--code-background)';
    element.style.color = 'var(--code-text)';
    element.style.border = '1px solid var(--code-border)';
    
    // Add language-specific accent colors if provided
    if (language) {
      const borderColors = {
        sql: 'var(--app-accent-primary)',
        python: 'var(--app-accent-secondary)',
        javascript: 'var(--notification-warning-text)',
        json: 'var(--notification-info-text)',
      };
      if (borderColors[language]) {
        element.style.borderColor = borderColors[language];
      }
    }
  }
};