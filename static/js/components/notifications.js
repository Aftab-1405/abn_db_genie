// static/js/components/notifications.js

/**
 * Notification System - Manages toast notifications with different types and animations
 * Provides success, error, warning, and info notifications with auto-dismiss functionality
 */

// Main notification function with type-based styling
export function showNotification(elements, message, type = "info") {
  if (elements.notificationTimeout) {
    clearTimeout(elements.notificationTimeout);
  }

  const { notificationArea } = elements;

  const colors = {
    success:
      "bg-green-50/90 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    error: "bg-red-50/90 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    warning:
      "bg-yellow-50/90 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    info: "bg-blue-50/90 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  };

  notificationArea.className = `
    fixed top-4 right-4 z-50 w-80 max-w-[90vw] px-4 py-3 rounded-lg
    font-medium text-sm leading-5 cursor-pointer backdrop-blur-sm
    transform transition-all duration-300 ease-out
    ${colors[type] || colors.info}
  `
    .replace(/\s+/g, " ")
    .trim();

  notificationArea.textContent = message;
  notificationArea.style.cssText = `
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    animation: slideIn 0.3s ease-out;
    word-wrap: break-word;
  `;

  // Inject animation styles if not already present
  injectNotificationStyles();

  const dismiss = () => {
    notificationArea.classList.add("toast-exit");
    setTimeout(() => {
      notificationArea.className = "hidden";
      notificationArea.style.cssText = "";
    }, 300);
  };

  notificationArea.onclick = dismiss;
  notificationArea.title = "Click to dismiss";
  elements.notificationTimeout = setTimeout(dismiss, 4000);
}

// Inject CSS styles for animations
function injectNotificationStyles() {
  if (!document.getElementById("toast-styles")) {
    const style = document.createElement("style");
    style.id = "toast-styles";
    style.textContent = `
      @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } }
      @keyframes slideOut { to { transform: translateX(100%); opacity: 0; } }
      .toast-exit { animation: slideOut 0.3s ease-in forwards; }
      @media (max-width: 640px) {
        .notification-area { left: 1rem !important; right: 1rem !important; width: calc(100vw - 2rem) !important; }
      }
    `;
    document.head.appendChild(style);
  }
}

// Convenience functions for different notification types
export const showSuccess = (elements, message) =>
  showNotification(elements, message, "success");
export const showError = (elements, message) =>
  showNotification(elements, message, "error");
export const showWarning = (elements, message) =>
  showNotification(elements, message, "warning");
export const showInfo = (elements, message) =>
  showNotification(elements, message, "info");
