// static/js/components/message-handler.js
import { markdownService } from "../services/markdown-service.js";
import { optimizedTypeWriter, createThinkingAnimation } from "./typewriter.js";
import { wrapCodeBlocks } from "./code-blocks.js";
import { scrollToBottom } from "../utils/scroll-utils.js";

/**
 * Enhanced Message Handler - Manages message creation with AI thinking animation
 * Handles both user and AI messages with smooth animations and transitions
 */

// Create avatar image for user or AI sender
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
  textDiv.className = `${sender}-message-text prose w-full text-sm md:text-base text-black dark:text-white`;

  // Process markdown content using cached service
  if (content) {
    const processedContent = markdownService.processFullMarkdown(content);
    const contentWrapper = document.createElement("div");
    contentWrapper.className = "content-wrapper"; // This helps with styling
    contentWrapper.innerHTML = processedContent;
    textDiv.appendChild(contentWrapper);
  }

  // Add additional styling for mermaid diagrams if present
  if (content && content.includes("```mermaid")) {
    const mermaidDivs = textDiv.querySelectorAll(".mermaid");
    mermaidDivs.forEach((div) => {
      div.classList.add(
        "w-full",
        "my-4",
        "overflow-x-auto",
        "bg-transparent",
        "dark:bg-transparent"
      );
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

// Enhanced AI response with thinking animation and ultra-fast typing
export function addGenieResponseWithTypingEffect(elements, responseText) {
  // Add empty message bubble first
  const { messageWrapper, textDiv, avatar } = addMessage(elements, "", "ai");
  if (!messageWrapper) return;

  // Start thinking animation
  const thinkingAnimation = createThinkingAnimation(avatar);

  // Helper: Extract mermaid code and trailing text
  function extractMermaidAndRest(text) {
    const mermaidRegex = /```mermaid([\s\S]*?)```([\s\S]*)/i;
    const match = text.match(mermaidRegex);
    if (match) {
      return {
        mermaid: match[0],
        mermaidCode: match[1].trim(),
        rest: match[2].trim(),
      };
    }
    return null;
  }

  setTimeout(() => {
    thinkingAnimation.stop();
    const mermaidParts = extractMermaidAndRest(responseText);
    if (mermaidParts) {
      // Show loading message for diagram
      textDiv.innerHTML = `<div class="content-wrapper"><div class="mermaid-loading flex items-center gap-2 text-purple-600 dark:text-purple-300"><svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.963 7.963 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> <span>Your schema image is on its way.</span></div></div>`;
      // Render the diagram behind the scenes
      import("./code-blocks.js").then(({ wrapCodeBlocks }) => {
        // Insert the actual mermaid code block (hidden) for wrapCodeBlocks to process
        setTimeout(() => {
          textDiv.innerHTML = `<div class='content-wrapper'><pre><code class='language-mermaid'>${mermaidParts.mermaidCode}</code></pre></div>`;
          wrapCodeBlocks(textDiv, elements);
          // Wait for diagram to render, then type the rest
          setTimeout(() => {
            // If there is trailing text, type it after the diagram
            if (mermaidParts.rest) {
              const trailingDiv = document.createElement("div");
              trailingDiv.className = "content-wrapper";
              textDiv.appendChild(trailingDiv);
              optimizedTypeWriter(
                elements,
                mermaidParts.rest,
                trailingDiv,
                () => {
                  markdownService.clearPartialCache();
                  scrollToBottom(elements);
                }
              );
            } else {
              markdownService.clearPartialCache();
              scrollToBottom(elements);
            }
          }, 600); // Give time for diagram to render
        }, 1000); // Always show animation for at least 1 second
      });
    } else {
      // No mermaid, type as usual
      optimizedTypeWriter(elements, responseText, textDiv, () => {
        markdownService.clearPartialCache();
        wrapCodeBlocks(textDiv, elements);
        scrollToBottom(elements);
      });
    }
  }, 1000); // 800ms thinking animation duration
}
