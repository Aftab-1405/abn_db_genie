// Code block enhancement module with syntax highlighting and interactive features
import { showNotification } from "./notifications.js";
import { renderMermaid } from "./mermaid-helper.js";
import { executeSqlString } from "../sql.js";

const STYLES = {
  codeBlock: [
    "relative",
    "bg-gray-50 dark:bg-black",
    "border border-gray-200 dark:border-neutral-800",
    "rounded-lg overflow-hidden",
    "shadow-sm hover:shadow-lg",
    "transition-all duration-200",
    "p-4",
  ],
  codeText: [
    "syntax-highlighted",
    "bg-transparent",
    "text-gray-800 dark:text-white",
    "block w-full",
  ],
  mermaidDiagram: [
    "bg-gray-50 dark:bg-black",
    "border border-gray-200 dark:border-neutral-800",
    "rounded-lg p-4",
    "shadow-sm",
    "transition-all duration-300",
  ],
};

function isSqlContent(text, className = "") {
  // If it has sql in the class name, it's SQL
  if (className.toLowerCase().includes("sql")) {
    return true;
  }

  // Common SQL keywords
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

  // Check if the content looks like SQL
  const lines = text.split("\n");
  return lines.some((line) => {
    const trimmedUpper = line.trim().toUpperCase();
    return sqlKeywords.some(
      (keyword) =>
        trimmedUpper.startsWith(keyword + " ") || trimmedUpper === keyword
    );
  });
}

// Add copy and run buttons to code blocks in processed content
export function wrapCodeBlocks(textDiv, elements) {
  // First pass: convert highlighted mermaid blocks back to regular ones and detect SQL
  textDiv.querySelectorAll("pre code").forEach((code) => {
    const content = code.textContent.trim();
    if (
      content.startsWith("erDiagram") ||
      content.startsWith("graph") ||
      content.startsWith("sequenceDiagram") ||
      content.startsWith("classDiagram") ||
      content.startsWith("stateDiagram") ||
      content.startsWith("pie") ||
      content.startsWith("gantt") ||
      content.startsWith("journey")
    ) {
      // This is a mermaid diagram that was incorrectly highlighted
      code.className = "language-mermaid";
      // Clean up highlighted spans
      code.innerHTML = code.textContent;
    } else if (isSqlContent(content, code.className)) {
      // Make sure SQL blocks are properly marked
      if (!code.className.includes("sql")) {
        code.className = code.className
          ? code.className + " language-sql"
          : "language-sql";
      }
    }
  });

  // Second pass: process all code blocks
  textDiv.querySelectorAll("pre").forEach((pre) => {
    const code = pre.querySelector("code");
    if (!code) return;

    const codeText = code.textContent;
    const isSQL = isSqlContent(codeText, code.className);
    const isMermaid = code.className.toLowerCase().includes("mermaid");

    // Create wrapper and button container
    const wrapper = document.createElement("div");
    wrapper.className = "relative group my-4";

    // Apply consistent styling from configuration
    pre.className = STYLES.codeBlock.join(" ");
    code.className = `${code.className} ${STYLES.codeText.join(" ")}`;

    const buttonContainer = document.createElement("div");
    buttonContainer.className =
      "absolute right-2 top-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10";

    // Copy button
    const copyBtn = document.createElement("button");
    copyBtn.className =
      "p-1.5 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors";
    copyBtn.innerHTML = `<svg class="w-4 h-4 theme-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>`;

    // Handle copy click
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(codeText);
        copyBtn.innerHTML = `<svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>`;
      } catch (err) {
        showNotification("Failed to copy code", "error");
      }

      // Reset icon after 2s
      setTimeout(() => {
        copyBtn.innerHTML = `<svg class="w-4 h-4 theme-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>`;
      }, 2000);
    });

    buttonContainer.appendChild(copyBtn);

    // Add run button for SQL code blocks
    if (isSQL) {
      const runBtn = document.createElement("button");
      runBtn.className =
        "p-1.5 rounded bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow-md transition-all duration-200";
      runBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>`;
      runBtn.title = "Run SQL Query";

      runBtn.addEventListener("click", () => {
        executeSqlString(elements, codeText);
      });

      buttonContainer.appendChild(runBtn);
    }

    // Handle Mermaid diagrams
    if (isMermaid) {
      const diagramContainer = document.createElement("div");
      diagramContainer.className =
        "mermaid-diagram opacity-0 transform scale-95 bg-gray-50 dark:bg-black rounded-lg p-4 shadow-sm border border-gray-200 dark:border-neutral-800";
      pre.style.display = "none"; // Hide original pre immediately

      wrapper.appendChild(diagramContainer);

      // Initial render of the diagram
      renderMermaid(
        diagramContainer,
        codeText,
        () => {
          const svgElement = diagramContainer.querySelector("svg");
          if (svgElement) {
            svgElement.classList.add("mx-auto", "max-w-full", "h-auto");
          }
          setTimeout(() => {
            diagramContainer.classList.remove("opacity-0", "scale-95");
            diagramContainer.classList.add("opacity-100", "scale-100");
          }, 50);
        },
        (error) => {
          console.error("Mermaid rendering error:", error);
          // On error, show the original code block
          pre.style.display = "block";
        }
      );
    }

    wrapper.appendChild(buttonContainer);
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);
  });
}
