// External dependencies that need to be available in your project.
import { showNotification } from "./notifications.js";
import { renderMermaid } from "./mermaid-helper.js";
import { executeSqlString } from "../sql.js";

/* =================================================================
   SECTION 1: HELPERS, STYLES, AND ICONS
   Purpose: Defines all the building blocks, styles, and SVGs.
   ================================================================= */

/**
 * Helper function to join class names conditionally.
 * Combines multiple class strings into a single string.
 */
const cls = (...classes) => classes.filter(Boolean).join(" ");

/**
 * All CSS classes are defined here for easy management.
 * Styles for all UI elements are centrally managed here.
 */
const STYLES = {
  codeBlock: cls(
    "relative p-4 overflow-hidden min-w-0 box-border",
    "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800",
    "border border-gray-300 dark:border-gray-700 rounded-lg",
    "shadow-sm hover:shadow-xl transition-all duration-300"
  ),
  codeText: cls(
    "syntax-highlighted bg-transparent text-gray-800 dark:text-gray-100",
    "block w-full overflow-x-auto whitespace-pre font-mono text-sm leading-relaxed",
    "scrollbar-thin"
  ),
  buttonBar: cls(
    "absolute right-2 top-2 flex gap-2 z-10",
    "opacity-70 hover:opacity-100 transition-opacity duration-200"
  ),
  btnBase: cls(
    "w-8 h-8 flex items-center justify-center", // Fixed square size for all buttons
    "rounded-lg transition-all duration-200 shadow-sm hover:shadow-md",
    "focus:outline-none focus:ring-2"
  ),
  copyBtn: cls(
    "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600",
    "focus:ring-blue-500"
  ),
  runBtn: cls(
    "bg-green-500 hover:bg-green-600 text-white focus:ring-green-400"
  ),
};

/* --- SVGs for Icons and Spinners --- */
const spinnerSvg = `
  <svg class="w-4 h-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"></path>
  </svg>
`;

const copyIcon = `
  <svg class="w-4 h-4 theme-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
`;

const copiedIcon = `
  <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
  </svg>
`;

const runIcon = `
  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
`;

/* =================================================================
   SECTION 2: CONTENT DETECTION LOGIC
   Purpose: Analyzes the content of a code block to identify its type.
   ================================================================= */

/**
 * Detects if the given text is an SQL query.
 * Checks the code text and class name to see if the content is SQL.
 */
function isSqlContent(text, className = "") {
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
  return text.split("\n").some((line) =>
    sqlKeywords.some(
      (keyword) =>
        line
          .trim()
          .toUpperCase()
          .startsWith(keyword + " ") || line.trim().toUpperCase() === keyword
    )
  );
}

/* =================================================================
   SECTION 3: MAIN FUNCTION TO WRAP AND ENHANCE CODE BLOCKS
   Purpose: The core logic that finds all code blocks and enhances them.
   ================================================================= */

export function wrapCodeBlocks(textDiv, elements) {
  // Step 1: Normalize Code Block Classes
  // First, scan all code blocks to assign the correct class (language-sql, language-mermaid).
  textDiv.querySelectorAll("pre code").forEach((code) => {
    const content = code.textContent.trim();
    if (
      /^(erDiagram|graph|sequenceDiagram|classDiagram|stateDiagram|pie|gantt|journey)/.test(
        content
      )
    ) {
      code.className = "language-mermaid";
      code.innerHTML = code.textContent; // Ensure content is plain text for mermaid
    } else if (
      isSqlContent(content, code.className) &&
      !code.className.includes("sql")
    ) {
      code.className = `${code.className} language-sql`.trim();
    }
  });

  // Step 2: Process Each Code Block Individually
  // Now, process each <pre> element individually.
  textDiv.querySelectorAll("pre").forEach((pre) => {
    const code = pre.querySelector("code");
    if (!code) return;

    const codeText = code.textContent;
    const isSQL = isSqlContent(codeText, code.className);
    const isMermaid = code.className.toLowerCase().includes("mermaid");

    // Apply base styles directly to pre/code elements
    pre.className = STYLES.codeBlock;
    code.className = cls(
      ...code.className.split(" ").filter((c) => !/^w-|block|overflow/.test(c)),
      STYLES.codeText
    );

    // Create the Button Bar
    const buttonContainer = document.createElement("div");
    buttonContainer.className = STYLES.buttonBar;

    // Copy Button Logic (with fix)
    const copyBtn = document.createElement("button");
    let copyTimeoutId = null; // Variable to store the timer ID

    copyBtn.className = cls(STYLES.btnBase, STYLES.copyBtn);
    copyBtn.innerHTML = copyIcon;
    copyBtn.title = "Copy code";

    copyBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // If a timer is already running, clear it first
      if (copyTimeoutId) {
        clearTimeout(copyTimeoutId);
      }

      try {
        await navigator.clipboard.writeText(codeText);
        copyBtn.innerHTML = copiedIcon;
        showNotification("Code copied to clipboard", "success");
      } catch {
        showNotification("Failed to copy code", "error");
      }

      // Set a new timer and store its ID
      copyTimeoutId = setTimeout(() => {
        copyBtn.innerHTML = copyIcon;
      }, 2000); // Icon will reset after 2 seconds
    });
    buttonContainer.appendChild(copyBtn);

    // Run Button Logic (for SQL only)
    if (isSQL) {
      const runBtn = document.createElement("button");
      runBtn.className = cls(STYLES.btnBase, STYLES.runBtn);
      runBtn.innerHTML = runIcon;
      runBtn.title = "Run SQL Query";

      runBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        runBtn.innerHTML = spinnerSvg; // Show spinner while running
        try {
          await executeSqlString(elements, codeText);
        } finally {
          runBtn.innerHTML = runIcon; // Switch back to run icon
        }
      });
      buttonContainer.appendChild(runBtn);
    }

    // Inject the button container into the <pre> element
    pre.appendChild(buttonContainer);

    // Mermaid Diagram Handling
    if (isMermaid) {
      const diagramContainer = document.createElement("div");
      diagramContainer.className =
        "mermaid-diagram opacity-0 transform scale-95";
      pre.style.display = "none"; // Hide the raw code
      pre.parentNode.insertBefore(diagramContainer, pre);

      // Call the render function
      renderMermaid(
        diagramContainer,
        codeText,
        () => {
          // Success callback
          const svgElement = diagramContainer.querySelector("svg");
          if (svgElement)
            svgElement.classList.add("mx-auto", "max-w-full", "h-auto");
          setTimeout(() => {
            diagramContainer.classList.remove("opacity-0", "scale-95");
            diagramContainer.classList.add("opacity-100", "scale-100");
          }, 50);
        },
        () => {
          // Error callback
          pre.style.display = "block"; // Show raw code again on error
        }
      );
    }
  });
}
