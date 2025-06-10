// static/js/ui.js

/**
 * Main UI Module - Central hub importing and exporting all UI functionality
 * Provides a single entry point for all UI-related operations
 */

// Import all modular components
import { processMarkdown } from "./services/markdown-service.js";
import {
  createSenderImage,
  addMessage,
  addGenieResponseWithTypingEffect,
} from "./components/message-handler.js";
import { optimizedTypeWriter, typeWriter } from "./components/typewriter.js";
import { wrapCodeBlocks } from "./components/code-blocks.js";
import {
  showModal,
  hideModal,
  clearTable,
  renderQueryResults,
} from "./components/modal-manager.js";
import {
  showNotification,
  showSuccess,
  showError,
  showWarning,
  showInfo,
} from "./components/notifications.js";
import { startCacheCleanup, stopCacheCleanup } from "./utils/memory-manager.js";
import { scrollToBottom } from "./utils/scroll-utils.js";

// Re-export all functions for backward compatibility
export {
  // Markdown processing
  processMarkdown,

  // Message handling
  createSenderImage,
  addMessage,
  addGenieResponseWithTypingEffect,

  // Typewriter effects
  optimizedTypeWriter,
  typeWriter,

  // Code blocks
  wrapCodeBlocks,

  // Modal management
  showModal,
  hideModal,
  clearTable,
  renderQueryResults,

  // Notifications
  showNotification,
  showSuccess,
  showError,
  showWarning,
  showInfo,

  // Memory management
  startCacheCleanup,
  stopCacheCleanup,

  // Utilities
  scrollToBottom,
};

