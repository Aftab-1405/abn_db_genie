// code-block.js - Refactored to handle only functionality, not styling

import { showNotification } from "./notifications.js";
import { renderMermaid } from "./mermaid-helper.js";
import { executeSqlString } from "../sql.js";

/**
 * Enhanced code block functionality without styling concerns.
 * All styling is now handled by CSS classes in input.css.
 */
export function wrapCodeBlocks(textDiv, elements) {
  // Process each code block
  textDiv.querySelectorAll("pre").forEach((pre) => {
    const code = pre.querySelector("code");
    if (!code) return;

    const codeText = pre.getAttribute("data-code") || code.textContent;
    const language = pre.getAttribute("data-language") || "";
    const isSQL = pre.hasAttribute("data-sql");
    const isMermaid = pre.hasAttribute("data-mermaid");

    // Apply syntax highlighting first (if not mermaid)
    if (!isMermaid) {
      applySyntaxHighlighting(code, language);
    }

    // Add CSS classes for styling
    pre.classList.add("code-block");
    if (language) pre.classList.add(`code-block--${language}`);

    // Only add interactive elements, not styling
    addCodeBlockButtons(pre, codeText, isSQL, elements);

    // Handle Mermaid diagrams
    if (isMermaid) {
      handleMermaidDiagram(pre, codeText);
    }
  });
}

/**
 * Apply syntax highlighting using highlight.js
 */
function applySyntaxHighlighting(codeElement, language) {
  try {
    if (language && hljs.getLanguage(language)) {
      const highlighted = hljs.highlight(codeElement.textContent, { language });
      codeElement.innerHTML = highlighted.value;
    } else {
      const highlighted = hljs.highlightAuto(codeElement.textContent);
      codeElement.innerHTML = highlighted.value;
    }

    // Add hljs class for proper styling
    codeElement.classList.add("hljs");
  } catch (e) {
    // Log the error for diagnostics and keep original text if highlighting fails
    console.error("Syntax highlighting error:", e);
    // Keep original text if highlighting fails
    codeElement.classList.add("hljs");
  }
}

/**
 * Add interactive buttons to code blocks
 */
function addCodeBlockButtons(pre, codeText, isSQL, elements) {
  // Skip if buttons already exist
  if (pre.querySelector(".code-block__buttons")) return;

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "code-block__buttons";

  // Copy button
  const copyBtn = createCopyButton(codeText);
  buttonContainer.appendChild(copyBtn);

  // Run button for SQL
  if (isSQL) {
    const runBtn = createRunButton(codeText, elements);
    buttonContainer.appendChild(runBtn);
  }

  pre.appendChild(buttonContainer);
}

/**
 * Create copy button with functionality
 */
function createCopyButton(codeText) {
  const copyBtn = document.createElement("button");
  copyBtn.className = "code-block__button code-block__button--copy";
  copyBtn.innerHTML = `
    <svg class="code-block__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  `;
  copyBtn.title = "Copy code";
  copyBtn.setAttribute("aria-label", "Copy code to clipboard");

  let copyTimeoutId = null;

  copyBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (copyTimeoutId) clearTimeout(copyTimeoutId);

    try {
      await navigator.clipboard.writeText(codeText);
      copyBtn.classList.add("code-block__button--copied");
      copyBtn.innerHTML = `
        <svg class="code-block__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      `;
      showNotification("Code copied to clipboard", "success");
    } catch (err) {
      // Log the error and notify the user
      console.error("Failed to copy code to clipboard", err);
      showNotification("Failed to copy code", "error");
    }

    copyTimeoutId = setTimeout(() => {
      copyBtn.classList.remove("code-block__button--copied");
      copyBtn.innerHTML = `
        <svg class="code-block__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      `;
    }, 2000);
  });

  return copyBtn;
}

/**
 * Create run button for SQL queries
 */
function createRunButton(codeText, elements) {
  const runBtn = document.createElement("button");
  runBtn.className = "code-block__button code-block__button--run";
  runBtn.innerHTML = `
    <svg class="code-block__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  `;
  runBtn.title = "Run SQL Query";
  runBtn.setAttribute("aria-label", "Execute SQL query");

  runBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    runBtn.classList.add("code-block__button--loading");
    runBtn.innerHTML = `
      <svg class="code-block__icon code-block__spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"></path>
      </svg>
    `;

    try {
      await executeSqlString(elements, codeText);
    } finally {
      runBtn.classList.remove("code-block__button--loading");
      runBtn.innerHTML = `
        <svg class="code-block__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      `;
    }
  });

  return runBtn;
}

/**
 * Handle Mermaid diagram rendering
 */
function handleMermaidDiagram(pre, codeText) {
  // Skip if already processed
  if (pre.parentNode.querySelector(".mermaid-diagram")) return;

  const diagramContainer = document.createElement("div");
  diagramContainer.className = "mermaid-diagram";

  // Hide the raw code block initially
  pre.style.display = "none";
  pre.parentNode.insertBefore(diagramContainer, pre);

  // Render the diagram
  renderMermaid(
    diagramContainer,
    codeText,
    () => {
      // Success callback - add success class for CSS styling
      diagramContainer.classList.add("mermaid-diagram--success");
      const svgElement = diagramContainer.querySelector("svg");
      if (svgElement) {
        svgElement.classList.add("mermaid-diagram__svg");
      }
    },
    (error) => {
      // Error callback - show raw code and add error class
      diagramContainer.classList.add("mermaid-diagram--error");
      pre.style.display = "block";
      console.error("Mermaid diagram error:", error);
    }
  );
}
