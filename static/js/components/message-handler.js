/**
 * Message Handler Module
 * Manages chat message creation and animations
 */
import { markdownService } from "../services/markdown-service.js";
import { optimizedTypeWriter, createThinkingAnimation } from "./typewriter.js";
import { wrapCodeBlocks } from "./code-blocks.js";
import { scrollToBottom } from "../utils/scroll-utils.js";

// Creates avatar image for user or AI
export function createSenderImage(sender) {
  const img = document.createElement("img");
  img.className =
    "w-6 h-6 md:w-7 md:h-7 rounded-full flex-shrink-0 mt-[2px] transition-all duration-300";
  img.src =
    sender === "user"
      ? "/static/images/user.png"
      : "/static/images/Brand Product.png";
  return img;
}

// Add message to chat with enhanced styling and animations
export function addMessage(elements, content, sender) {
  elements.aiLogoContainer.style.display = "none";

  const messageWrapper = document.createElement("div");
  messageWrapper.className = `${sender}-message flex gap-3 p-2 mb-4 opacity-0 transform translate-y-2 transition-all duration-300`;

  const avatar = createSenderImage(sender);
  const textDiv = document.createElement("div");
  textDiv.className = `${sender}-message-text chat-prose w-full text-sm md:text-base text-black dark:text-white`;
  // Process markdown content using cached service
  if (content) {
    // Check if the content contains mermaid diagram before processing markdown
    const hasMermaid = content.includes("```mermaid");
    const processedContent = hasMermaid
      ? content // Don't process markdown for mermaid content yet
      : markdownService.processFullMarkdown(content);
    const contentWrapper = document.createElement("div");
    contentWrapper.className = "content-wrapper"; // This helps with styling

    if (hasMermaid) {
      const mermaidParts = extractMermaidAndRest(content);
      if (mermaidParts) {
        // If there's text before the diagram, process and show it first
        if (mermaidParts.beforeText) {
          const beforeDiv = document.createElement("div");
          beforeDiv.className = "mb-4";
          beforeDiv.innerHTML = markdownService.processFullMarkdown(
            mermaidParts.beforeText
          );
          contentWrapper.appendChild(beforeDiv);
        } // Create mermaid container
        const diagramWrapper = document.createElement("div");
        diagramWrapper.className = "my-6";

        // Create the pre/code block for the diagram
        const pre = document.createElement("pre");
        const code = document.createElement("code");
        code.className = "language-mermaid";
        code.textContent = mermaidParts.mermaidCode;
        pre.appendChild(code);
        diagramWrapper.appendChild(pre);
        contentWrapper.appendChild(diagramWrapper);

        // Process the mermaid diagram
        import("./code-blocks.js").then(({ wrapCodeBlocks }) => {
          wrapCodeBlocks(diagramWrapper, elements);
        });

        // If there's text after the diagram, process and show it
        if (mermaidParts.rest) {
          const afterDiv = document.createElement("div");
          afterDiv.className = "mt-4";
          afterDiv.innerHTML = markdownService.processFullMarkdown(
            mermaidParts.rest
          );
          contentWrapper.appendChild(afterDiv);
        }
      }
    } else {
      contentWrapper.innerHTML = processedContent;
    }
    textDiv.appendChild(contentWrapper);
  }

  // Add additional styling for mermaid diagrams if present
  if (content && content.includes("```mermaid")) {
    const mermaidDivs = textDiv.querySelectorAll(".mermaid");
    mermaidDivs.forEach((div) => {
      div.classList.add("w-full", "my-4", "overflow-x-auto");
      div.style.minWidth = "300px";
    });
  }

  messageWrapper.appendChild(avatar);
  messageWrapper.appendChild(textDiv);
  elements.chat.appendChild(messageWrapper);

  // Enhanced message appearance animation
  requestAnimationFrame(() => {
    messageWrapper.classList.remove("opacity-0", "translate-y-2");
    messageWrapper.classList.add("opacity-100", "translate-y-0");
  });

  scrollToBottom(elements);
  return { messageWrapper, textDiv, avatar };
}

// Helper: Extract mermaid code and trailing text with better regex
function extractMermaidAndRest(text) {
  const mermaidRegex =
    /```(?:mermaid)?\s*(graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|flowchart|gantt|pie|journey)[\s\S]*?```([\s\S]*)/i;
  const match = text.match(mermaidRegex);
  if (match) {
    const fullMatch = match[0];
    const startIndex = text.indexOf(fullMatch);
    const beforeText = text.substring(0, startIndex).trim();
    const mermaidCode = text
      .substring(startIndex + 3, text.indexOf("```", startIndex + 3))
      .trim();
    const afterText = match[2].trim();

    return {
      beforeText,
      mermaid: fullMatch,
      mermaidCode,
      rest: afterText,
    };
  }
  return null;
}

// Enhanced AI response with thinking animation and ultra-fast typing
export function addGenieResponseWithTypingEffect(elements, responseText) {
  // Add empty message bubble first
  const { messageWrapper, textDiv, avatar } = addMessage(elements, "", "ai");
  if (!messageWrapper) return;

  // Start thinking animation
  const thinkingAnimation = createThinkingAnimation(avatar);

  setTimeout(() => {
    thinkingAnimation.stop();
    const mermaidParts = extractMermaidAndRest(responseText);

    if (mermaidParts) {
      // Create a wrapper for better content organization
      const contentWrapper = document.createElement("div");
      contentWrapper.className = "content-wrapper";
      textDiv.appendChild(contentWrapper);

      // If there's text before the diagram, show it first
      if (mermaidParts.beforeText) {
        const beforeDiv = document.createElement("div");
        beforeDiv.className = "mb-4";
        contentWrapper.appendChild(beforeDiv);
        optimizedTypeWriter(elements, mermaidParts.beforeText, beforeDiv);
      }

      // Render the diagram
      import("./code-blocks.js").then(({ wrapCodeBlocks }) => {
        const diagramWrapper = document.createElement("div");
        diagramWrapper.className = "my-6";
        contentWrapper.appendChild(diagramWrapper);

        // Create the pre/code block for the diagram
        const pre = document.createElement("pre");
        const code = document.createElement("code");
        code.className = "language-mermaid";
        code.textContent = mermaidParts.mermaidCode;
        pre.appendChild(code);
        diagramWrapper.appendChild(pre);

        // Process the code block to render the diagram
        wrapCodeBlocks(diagramWrapper, elements);

        // If there's text after the diagram, show it
        if (mermaidParts.rest) {
          setTimeout(() => {
            const afterDiv = document.createElement("div");
            afterDiv.className = "mt-4";
            contentWrapper.appendChild(afterDiv);
            optimizedTypeWriter(elements, mermaidParts.rest, afterDiv, () => {
              markdownService.clearPartialCache();
              scrollToBottom(elements);
            });
          }, 800); // Give time for diagram to render
        } else {
          setTimeout(() => {
            markdownService.clearPartialCache();
            scrollToBottom(elements);
          }, 800);
        }
      });
    } else {
      // No mermaid diagram, type as usual
      const contentContainer = document.createElement("div");
      contentContainer.className = "content-wrapper";
      textDiv.appendChild(contentContainer);

      optimizedTypeWriter(elements, responseText, contentContainer, () => {
        markdownService.clearPartialCache();
        // Process code blocks after typing is complete
        wrapCodeBlocks(contentContainer, elements);
        scrollToBottom(elements);
      });
    }
  }, 1000); // 1 second thinking animation duration
}
