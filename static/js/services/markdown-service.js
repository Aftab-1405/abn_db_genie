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

    // Enhanced syntax highlighting for code blocks
    tempDiv.querySelectorAll("pre code").forEach((block) => {
      // Try to detect the language from the class
      let language = block.className.replace("language-", "") || "";

      // If no language specified, try to auto-detect
      if (!language) {
        const code = block.textContent;
        if (
          code.includes("SELECT") ||
          code.includes("INSERT INTO") ||
          code.includes("CREATE TABLE")
        ) {
          language = "sql";
        } else if (code.includes("import") && code.includes("def")) {
          language = "python";
        } else if (code.trim().startsWith("{") || code.trim().startsWith("[")) {
          language = "json";
        }
      }

      // Add the proper class for highlighting
      if (language) {
        block.className = `language-${language} hljs`;
      } else {
        block.className = "hljs";
      }

      try {
        hljs.highlightElement(block);
      } catch (e) {
        console.warn("Highlight.js error:", e);
      }
    });

    // Add custom styling to pre elements and tables
    tempDiv.querySelectorAll("pre").forEach((pre) => {
      pre.classList.add(
        "rounded-lg",
        "p-4",
        "my-4",
        "bg-gray-900",
        "dark:bg-black",
        "overflow-x-auto"
      );
    });

    // Enhance table styling
    tempDiv.querySelectorAll("table").forEach((table) => {
      table.classList.add(
        "w-full",
        "border-collapse",
        "my-4",
        "bg-white",
        "dark:bg-gray-800",
        "rounded-lg",
        "overflow-hidden",
        "border",
        "theme-border",
        "table-responsive"
      );

      // Add a wrapper div for horizontal scrolling
      const wrapper = document.createElement("div");
      wrapper.classList.add(
        "overflow-x-auto",
        "w-full",
        "max-w-full",
        "rounded-lg",
        "border",
        "theme-border"
      );

      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });

    // Style table headers
    tempDiv.querySelectorAll("th").forEach((th) => {
      th.classList.add(
        "px-4",
        "py-3",
        "text-left",
        "font-semibold",
        "bg-gray-50",
        "dark:bg-gray-700",
        "theme-border",
        "border-b",
        "sticky",
        "top-0",
        "whitespace-nowrap"
      );
    });

    // Style table cells with expandable content
    tempDiv.querySelectorAll("td").forEach((td) => {
      td.classList.add(
        "px-4",
        "py-3",
        "theme-border",
        "border-b",
        "theme-text-primary",
        "truncate",
        "max-w-[200px]",
        "group-hover:whitespace-normal",
        "group-hover:overflow-visible",
        "transition-all"
      );

      // Wrap cell content in a span for better truncation
      const content = td.innerHTML;
      td.innerHTML = `<span class="inline-block truncate hover:whitespace-normal hover:overflow-visible w-full transition-all duration-200">${content}</span>`;
    });

    // Add row hover effects
    tempDiv.querySelectorAll("tbody tr").forEach((tr) => {
      tr.classList.add(
        "group",
        "hover:bg-gray-50",
        "dark:hover:bg-gray-700",
        "transition-colors"
      );
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
