// static/js/components/code-blocks.js

import { showNotification } from "./notifications.js";
import { renderMermaid } from "./mermaid-helper.js";

/**
 * Code Blocks Handler - Adds copy and run functionality to code blocks
 * Enhances code blocks with interactive buttons and SQL execution
 */

// Add copy and run buttons to code blocks in processed content
export function wrapCodeBlocks(textDiv, elements) {
  textDiv.querySelectorAll("pre code").forEach((codeBlock) => {
    const parentPre = codeBlock.parentElement;
    if (parentPre.dataset.wrapped === "true") return;

    const codeText = codeBlock.textContent.trim();
    const codeLang = codeBlock.className || "";
    const wrapper = document.createElement("div");
    wrapper.className = "relative mb-4";
    wrapper.dataset.wrapped = "true";

    // Create copy button
    const copyBtn = createCopyButton(codeText, elements);

    let runBtn;
    if (codeLang.includes("language-mermaid")) {
      // AUTOMATICALLY render Mermaid diagram
      const originalCode = codeText;
      let isRendered = true;
      // Create a toggle button for diagram/code
      runBtn = document.createElement("button");
      runBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>`;
      runBtn.title = "Show Code";
      runBtn.className =
        "inline-flex items-center justify-center text-xs bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-md z-10 transition-all duration-300";
      runBtn.style.position = "absolute";
      runBtn.style.top = "4px";
      runBtn.style.right = "4px";

      // Create preClone for toggling
      const preClone = parentPre.cloneNode(true);
      preClone.querySelectorAll("pre code").forEach((clonedCode) => {
        hljs.highlightElement(clonedCode);
      });

      // Create a container for the diagram with enhanced transitions and proper theming
      const diagramContainer = document.createElement("div");
      diagramContainer.className =
        "w-full opacity-0 transform scale-95 transition-all duration-500 ease-in-out " +
        "bg-white dark:bg-gray-800 " +
        "border border-gray-200 dark:border-gray-700 " +
        "rounded-lg p-4 " +
        "shadow-sm dark:shadow-gray-900/20";

      // Show loading animation initially with proper theming
      diagramContainer.innerHTML = `
        <div class="flex items-center justify-center p-4">
          <svg class="animate-spin h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.963 7.963 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      `;

      // Add transition styles to preClone
      preClone.style.transition = "all 500ms ease-in-out";

      // Render diagram immediately
      setTimeout(() => {
        renderMermaid(
          diagramContainer,
          codeText,
          () => {
            // Ensure the diagram container has proper styling after render
            const svgElement = diagramContainer.querySelector("svg");
            if (svgElement) {
              // Add responsive styling to the SVG
              svgElement.style.maxWidth = "100%";
              svgElement.style.height = "auto";
              svgElement.style.display = "block";
              svgElement.style.margin = "0 auto";
            }

            // Fade in and scale up the diagram smoothly
            setTimeout(() => {
              diagramContainer.classList.remove("opacity-0", "scale-95");
              diagramContainer.classList.add("opacity-100", "scale-100");
            }, 10);
            runBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>`;
            runBtn.title = "Show Code";
            isRendered = true;
          },
          (error) => {
            // Show error with proper theming
            diagramContainer.innerHTML = `
              <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
                      Diagram Render Error
                    </h3>
                    <div class="mt-2 text-sm text-red-700 dark:text-red-300">
                      <code class="bg-red-100 dark:bg-red-800/50 px-2 py-1 rounded text-xs">${error}</code>
                    </div>
                  </div>
                </div>
                <div class="mt-4">
                  <pre class="bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-x-auto">
                    <code class="${codeLang} text-gray-800 dark:text-gray-200">${originalCode}</code>
                  </pre>
                </div>
              </div>
            `;

            // Highlight the fallback code
            const fallbackCode = diagramContainer.querySelector("code");
            if (fallbackCode && typeof hljs !== "undefined") {
              hljs.highlightElement(fallbackCode);
            }

            runBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>`;
            runBtn.title = "Show Code";
            isRendered = false;
            showNotification(
              elements,
              "Failed to render diagram: " + error,
              "error"
            );
          }
        );
      }, 0);

      runBtn.addEventListener("click", () => {
        if (isRendered) {
          // Switch to code view with fade and scale transition
          diagramContainer.classList.remove("opacity-100", "scale-100");
          diagramContainer.classList.add("opacity-0", "scale-95");
          setTimeout(() => {
            wrapper.replaceChild(preClone, diagramContainer);
            // Fade in the code
            preClone.style.opacity = "0";
            preClone.style.transform = "scale(0.95)";
            setTimeout(() => {
              preClone.style.opacity = "1";
              preClone.style.transform = "scale(1)";
            }, 50);
          }, 300);
          runBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>`;
          runBtn.title = "Show Diagram";
          isRendered = false;
        } else {
          // Switch to diagram view with fade and scale transition
          preClone.style.opacity = "0";
          preClone.style.transform = "scale(0.95)";
          setTimeout(() => {
            wrapper.replaceChild(diagramContainer, preClone);
            // Reset diagram container state
            diagramContainer.classList.remove("opacity-100", "scale-100");
            diagramContainer.classList.add("opacity-0", "scale-95");
            // Trigger reflow
            diagramContainer.offsetHeight;
            // Fade in the diagram
            diagramContainer.classList.remove("opacity-0", "scale-95");
            diagramContainer.classList.add("opacity-100", "scale-100");
          }, 300);
          runBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>`;
          runBtn.title = "Show Code";
          isRendered = true;
        }
      });

      wrapper.appendChild(copyBtn);
      wrapper.appendChild(runBtn);
      wrapper.appendChild(diagramContainer);
      parentPre.replaceWith(wrapper);
      return; // Skip the rest for mermaid
    } else if (codeLang.includes("language-sql")) {
      // Only show run button for SQL
      runBtn = createRunButton(codeText, elements);
    }

    // Clone and re-highlight the code block
    const preClone = parentPre.cloneNode(true);
    preClone.querySelectorAll("pre code").forEach((clonedCode) => {
      hljs.highlightElement(clonedCode);
    });

    wrapper.appendChild(copyBtn);
    if (runBtn) wrapper.appendChild(runBtn);
    wrapper.appendChild(preClone);
    parentPre.replaceWith(wrapper);
  });
}

// Create copy button with clipboard functionality
function createCopyButton(sqlText, elements) {
  const copyBtn = document.createElement("button");
  copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
  </svg>`;
  copyBtn.title = "Copy";
  copyBtn.className =
    "inline-flex items-center justify-center text-xs bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md z-10";
  copyBtn.style.position = "absolute";
  copyBtn.style.top = "4px";
  copyBtn.style.right = "44px"; // Adjust spacing for icon buttons

  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(sqlText);
      copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>`;
      setTimeout(() => {
        copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
        </svg>`;
      }, 2000);
      showNotification(elements, "Code copied to clipboard", "success");
    } catch {
      showNotification(elements, "Failed to copy", "error");
    }
  });

  return copyBtn;
}

// Create run button with SQL execution functionality
function createRunButton(sqlText, elements) {
  const runBtn = document.createElement("button");
  runBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>`;
  runBtn.title = "Run SQL";
  runBtn.className =
    "inline-flex items-center justify-center text-xs bg-green-500 hover:bg-green-600 text-white p-2 rounded-md z-10";
  runBtn.style.position = "absolute";
  runBtn.style.top = "4px";
  runBtn.style.right = "4px";

  runBtn.addEventListener("click", async () => {
    const originalHtml = runBtn.innerHTML;
    runBtn.disabled = true;

    // Show loading spinner
    runBtn.innerHTML = `<svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.963 7.963 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>`;

    try {
      await elements.executeSqlString(elements, sqlText);
    } catch {
      // Error handling is done in executeSqlString
    } finally {
      runBtn.innerHTML = originalHtml;
      runBtn.disabled = false;
    }
  });

  return runBtn;
}
