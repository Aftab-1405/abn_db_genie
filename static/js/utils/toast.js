/**
 * Toast Notification System
 *
 * Provides non-blocking user feedback for actions throughout the application.
 * Supports success, error, warning, and info message types with auto-dismiss.
 */

const ToastType = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

class ToastManager {
  constructor() {
    this.container = null;
    this.toasts = new Map();
    this.init();
  }

  init() {
    // Create toast container if it doesn't exist
    if (!document.getElementById('toast-container')) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none';
      document.body.appendChild(this.container);
    } else {
      this.container = document.getElementById('toast-container');
    }
  }

  /**
   * Show a toast notification
   * @param {string} message - The message to display
   * @param {string} type - Toast type (success, error, warning, info)
   * @param {number} duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
   * @returns {string} Toast ID for manual dismissal
   */
  show(message, type = ToastType.INFO, duration = 3000) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const toast = this.createToast(id, message, type);
    this.container.appendChild(toast);
    this.toasts.set(id, toast);

    // Trigger enter animation
    setTimeout(() => {
      toast.classList.remove('translate-x-full', 'opacity-0');
      toast.classList.add('translate-x-0', 'opacity-100');
    }, 10);

    // Auto-dismiss if duration > 0
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }

    return id;
  }

  /**
   * Create toast DOM element
   */
  createToast(id, message, type) {
    const toast = document.createElement('div');
    toast.id = id;
    toast.className = `
      pointer-events-auto transform translate-x-full opacity-0
      transition-all duration-300 ease-out
      flex items-start gap-3 p-4 rounded-lg shadow-lg
      max-w-sm w-full backdrop-blur-sm
      ${this.getTypeClasses(type)}
    `.trim().replace(/\s+/g, ' ');

    const icon = this.getIcon(type);
    const iconColor = this.getIconColor(type);

    toast.innerHTML = `
      <div class="flex-shrink-0">
        <svg class="w-5 h-5 ${iconColor}" fill="currentColor" viewBox="0 0 20 20">
          ${icon}
        </svg>
      </div>
      <div class="flex-1 text-sm font-medium">
        ${this.escapeHtml(message)}
      </div>
      <button
        class="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
        onclick="window.toastManager.dismiss('${id}')"
        aria-label="Dismiss"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
      </button>
    `;

    return toast;
  }

  /**
   * Dismiss a toast
   */
  dismiss(id) {
    const toast = this.toasts.get(id);
    if (!toast) return;

    // Trigger exit animation
    toast.classList.remove('translate-x-0', 'opacity-100');
    toast.classList.add('translate-x-full', 'opacity-0');

    // Remove from DOM after animation
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      this.toasts.delete(id);
    }, 300);
  }

  /**
   * Dismiss all toasts
   */
  dismissAll() {
    this.toasts.forEach((_, id) => this.dismiss(id));
  }

  /**
   * Get CSS classes for toast type
   */
  getTypeClasses(type) {
    switch (type) {
      case ToastType.SUCCESS:
        return 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200';
      case ToastType.ERROR:
        return 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200';
      case ToastType.WARNING:
        return 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200';
      case ToastType.INFO:
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200';
    }
  }

  /**
   * Get icon SVG path for toast type
   */
  getIcon(type) {
    switch (type) {
      case ToastType.SUCCESS:
        return '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>';
      case ToastType.ERROR:
        return '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>';
      case ToastType.WARNING:
        return '<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>';
      case ToastType.INFO:
      default:
        return '<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>';
    }
  }

  /**
   * Get icon color class for toast type
   */
  getIconColor(type) {
    switch (type) {
      case ToastType.SUCCESS:
        return 'text-green-600 dark:text-green-400';
      case ToastType.ERROR:
        return 'text-red-600 dark:text-red-400';
      case ToastType.WARNING:
        return 'text-amber-600 dark:text-amber-400';
      case ToastType.INFO:
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Convenience methods
  success(message, duration = 3000) {
    return this.show(message, ToastType.SUCCESS, duration);
  }

  error(message, duration = 5000) {
    return this.show(message, ToastType.ERROR, duration);
  }

  warning(message, duration = 4000) {
    return this.show(message, ToastType.WARNING, duration);
  }

  info(message, duration = 3000) {
    return this.show(message, ToastType.INFO, duration);
  }
}

// Create global instance
window.toastManager = new ToastManager();

// Export for ES modules
export { ToastManager, ToastType };
export default window.toastManager;
