// markdown-service.js - Refactored for CSS-first approach

class MarkdownService {
  constructor() {
    this.cache = new Map();
    this.partialCache = new Map();
    this.maxCacheSize = 100;
  }

  // Process complete markdown content - SIMPLIFIED, no manual styling
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

    // Parse markdown with marked.js - NO HIGHLIGHTING HERE
    const dirtyHtml = marked.parse(content, {
      gfm: true,
      breaks: true,
      sanitize: false, // We'll sanitize with DOMPurify
    });

    // Sanitize the HTML
    const safeHtml = DOMPurify.sanitize(dirtyHtml);

    // Create temporary div for processing
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = safeHtml;

    // MINIMAL processing - just add semantic classes
    this._addSemanticClasses(tempDiv);

    const result = tempDiv.innerHTML;
    this.cache.set(cacheKey, result);
    return result;
  }

  // Add only semantic classes, let CSS handle the styling
  _addSemanticClasses(tempDiv) {
    // Add language detection for code blocks
    tempDiv.querySelectorAll("pre code").forEach((block) => {
      const code = block.textContent;

      // Check if it's Mermaid first
      if (this._isMermaidContent(code)) {
        block.className = "language-mermaid";
        const pre = block.closest("pre");
        if (pre) {
          pre.setAttribute("data-language", "mermaid");
          pre.setAttribute("data-code", code);
          pre.setAttribute("data-mermaid", "true");
        }
        return;
      }

      // Auto-detect other languages if not specified
      if (!block.className.includes("language-")) {
        const detectedLang = this._detectLanguage(code);
        if (detectedLang) {
          block.className = `language-${detectedLang} hljs`;
        } else {
          block.className = "hljs";
        }
      }

      // Add data attributes for functionality
      const pre = block.closest("pre");
      if (pre) {
        const language = this._extractLanguage(block.className);
        pre.setAttribute("data-language", language);
        pre.setAttribute("data-code", code);

        // Mark SQL for run button
        if (this._isSqlContent(code, block.className)) {
          pre.setAttribute("data-sql", "true");
        }
      }
    });

    // Add table wrapper for responsive tables
    tempDiv.querySelectorAll("table").forEach((table) => {
      if (!table.closest(".table-wrapper")) {
        const wrapper = document.createElement("div");
        wrapper.className = "table-wrapper";
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }
    });
  }

  // Language detection helpers
  _detectLanguage(code) {
    const trimmed = code.trim();

    // SQL detection
    if (this._isSqlContent(code)) return "sql";

    // Mermaid detection
    if (this._isMermaidContent(code)) return "mermaid";

    // JSON detection
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        JSON.parse(trimmed);
        return "json";
      } catch (e) {
        // Not valid JSON — continue language detection
        console.debug?.("JSON parse failed in _detectLanguage:", e);
      }
    }

    // Python detection
    if (
      code.includes("def ") ||
      code.includes("import ") ||
      code.includes("from ")
    ) {
      return "python";
    }

    // JavaScript detection
    if (
      code.includes("function") ||
      code.includes("=>") ||
      code.includes("const ")
    ) {
      return "javascript";
    }

    return null;
  }

  _isSqlContent(code, className = "") {
    if (className.toLowerCase().includes("sql")) return true;

    const sqlKeywords = [
      "SELECT",
      "INSERT",
      "UPDATE",
      "DELETE",
      "CREATE",
      "ALTER",
      "DROP",
      "SHOW",
      "USE",
      "DESCRIBE",
      "DESC",
      "EXPLAIN",
    ];

    const upperCode = code.toUpperCase();
    return sqlKeywords.some(
      (keyword) =>
        upperCode.includes(keyword + " ") ||
        upperCode.trim().startsWith(keyword)
    );
  }

  _isMermaidContent(code) {
    const mermaidKeywords = [
      "graph",
      "sequencediagram",
      "classdiagram",
      "statediagram",
      "erdiagram",
      "pie",
      "gantt",
      "journey",
      "flowchart",
      "gitgraph",
      "mindmap",
      "timeline",
      "quadrantchart",
    ];

    // Check if any line starts with a mermaid keyword
    const lines = code.trim().split("\n");
    return lines.some((line) => {
      const trimmedLine = line.trim().toLowerCase();
      return mermaidKeywords.some(
        (keyword) =>
          trimmedLine.startsWith(keyword + " ") ||
          trimmedLine === keyword ||
          trimmedLine.startsWith(keyword + ":")
      );
    });
  }

  _extractLanguage(className) {
    const match = className.match(/language-(\w+)/);
    return match ? match[1] : "";
  }

  // Ultra-fast partial markdown processing
  processPartialMarkdown(partialContent, fullContent) {
    const cacheKey = `partial_${partialContent}`;
    if (this.partialCache.has(cacheKey)) {
      return this.partialCache.get(cacheKey);
    }

    try {
      const dirtyHtml = marked.parse(partialContent, {
        gfm: true,
        breaks: true,
        sanitize: false,
      });
      const safeHtml = DOMPurify.sanitize(dirtyHtml);
      // Create temporary div to allow semantic post-processing (add data-attributes
      // and classes for code blocks, tables, mermaid detection etc.). This makes
      // incremental rendering behave the same as full rendering so code-block
      // utilities can attach buttons and run highlighting progressively.
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = safeHtml;
      try {
        this._addSemanticClasses(tempDiv);
      } catch (e) {
        // If adding semantic classes fails for some reason, fall back to safeHtml
        console.debug?.("_addSemanticClasses failed during partial parse:", e);
      }

      const processedHtml = tempDiv.innerHTML;
      // Cache and return processed HTML
      this.partialCache.set(cacheKey, processedHtml);
      return processedHtml;
    } catch (e) {
      // Log parse errors for debugging, then fallback to safe escape
      console.debug?.("Partial markdown parse failed:", e);
      // Fallback: escape the text
      const escaped = partialContent
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      this.partialCache.set(cacheKey, escaped);
      return escaped;
    }
  }

  // Clear caches
  clearCache() {
    this.cache.clear();
    this.partialCache.clear();
  }

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
