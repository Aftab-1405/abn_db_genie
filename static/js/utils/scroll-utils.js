// static/js/utils/scroll-utils.js

/**
 * Scroll Utilities - Helper functions for chat scroll management
 */

// Scroll chat container to bottom
export function scrollToBottom(elements) {
  const chatContainer = document.getElementById("chat-container");
  chatContainer.scrollTop = chatContainer.scrollHeight;
}
