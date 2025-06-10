// static/js/services/markdown-service.js
/**
 * Enhanced Markdown Service - Optimized for ultra-fast processing
 * Provides both full and partial markdown processing with advanced caching
 */
class MarkdownService {
  constructor() {
    this.cache = new Map();
    this.partialCache = new Map();
    this.maxCacheSize = 100; // Prevent memory leaks
  }

  // Process complete markdown content with intelligent caching
  processFullMarkdown(content) {
    const cacheKey = `full_${content}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Clean cache if too large
    if (this.cache.size > this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const dirtyHtml = marked.parse(content, {
      gfm: true,
      breaks: true,
      sanitize: false, // We'll sanitize with DOMPurify
    });
    const safeHtml = DOMPurify.sanitize(dirtyHtml);

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = safeHtml;

    // Apply syntax highlighting to code blocks
    tempDiv.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block);
    });

    const result = tempDiv.innerHTML;
    this.cache.set(cacheKey, result);
    return result;
  }

  // Ultra-fast partial markdown processing with smart caching
  processPartialMarkdown(partialContent, fullContent) {
    const cacheKey = `partial_${partialContent}`;
    if (this.partialCache.has(cacheKey)) {
      return this.partialCache.get(cacheKey);
    }

    // Clean partial cache if too large
    if (this.partialCache.size > this.maxCacheSize) {
      const firstKey = this.partialCache.keys().next().value;
      this.partialCache.delete(firstKey);
    }

    // For very short content, process directly without caching
    if (partialContent.length < 20) {
      return this.processFullMarkdown(partialContent);
    }

    // Smart incremental processing for longer content
    const result = this.processFullMarkdown(partialContent);
    this.partialCache.set(cacheKey, result);
    return result;
  }

  // Clear all caches for memory management
  clearCache() {
    this.cache.clear();
    this.partialCache.clear();
  }

  // Clear only partial cache after typewriter completion
  clearPartialCache() {
    this.partialCache.clear();
  }
}

// Export singleton instance
export const markdownService = new MarkdownService();

// Convenience function for backward compatibility
export function processMarkdown(content) {
  return markdownService.processFullMarkdown(content);
}



























