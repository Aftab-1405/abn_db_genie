// static/js/utils/memory-manager.js

import { markdownService } from "../services/markdown-service.js";

/**
 * Memory Manager - Handles cache cleanup and memory optimization
 * Prevents memory leaks through periodic cache clearing
 */

let cacheCleanupInterval;

// Start automatic cache cleanup every 5 minutes
export function startCacheCleanup() {
  if (cacheCleanupInterval) clearInterval(cacheCleanupInterval);

  cacheCleanupInterval = setInterval(() => {
    markdownService.clearCache();
    console.log("Markdown cache cleared for memory management");
  }, 5 * 60 * 1000);
}

// Stop cache cleanup interval
export function stopCacheCleanup() {
  if (cacheCleanupInterval) {
    clearInterval(cacheCleanupInterval);
    cacheCleanupInterval = null;
  }
}

// Initialize memory management on page load
if (typeof window !== "undefined") {
  window.addEventListener("load", startCacheCleanup);
  window.addEventListener("beforeunload", stopCacheCleanup);
}
