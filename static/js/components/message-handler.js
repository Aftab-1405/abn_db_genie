// message-handler.js - Simplified and optimized
import { markdownService } from "../services/markdown-service.js";
import { optimizedTypeWriter, createThinkingAnimation } from "./typewriter.js";
import { wrapCodeBlocks } from "./code-blocks.js";
import { scrollToBottom } from "../utils/scroll-utils.js";

/**
 * Creates avatar image for user or AI
 */
export function createSenderImage(sender) {
  const img = document.createElement("img");
  img.className = "message-avatar";
  img.src =
    sender === "user"
      ? "/static/images/user.png"
      : "/static/images/Brand Product.png";
  img.alt = `${sender} avatar`;
  img.loading = "lazy";
  img.width = "28";
  img.height = "28";

  return img;
}

/**
 * Add a message to the chat - simplified version
 */
export function addMessage(elements, content, sender) {
  elements.aiLogoContainer.style.display = "none";

  // Create message wrapper
  const messageWrapper = document.createElement("div");
  messageWrapper.className = `message message--${sender}`;

  // Create and add avatar
  const avatar = createSenderImage(sender);
  messageWrapper.appendChild(avatar);

  // Create text container
  const textDiv = document.createElement("div");
  textDiv.className = `message__content chat-prose`;
  messageWrapper.appendChild(textDiv);

  // ALWAYS create content wrapper (even if empty) for consistent styling
  const contentWrapper = document.createElement("div");
  contentWrapper.className = "content-wrapper";
  textDiv.appendChild(contentWrapper);

  // Process content if provided
  if (content) {
    // Process markdown
    const processedContent = markdownService.processFullMarkdown(content);
    contentWrapper.innerHTML = processedContent;

    // Add interactive functionality to code blocks after a small delay
    requestAnimationFrame(() => {
      wrapCodeBlocks(contentWrapper, elements);
    });
  }

  // Add to chat
  elements.chat.appendChild(messageWrapper);

  // Animate message appearance
  requestAnimationFrame(() => {
    messageWrapper.classList.add("message--visible");
  });

  scrollToBottom(elements);
  return { messageWrapper, textDiv, avatar, contentWrapper };
}

/**
 * Appends a chunk of streamed AI response to the message content.
 * Creates the contentWrapper if it doesn't exist.
 */
export function appendGenieStreamChunk(elements, genieMessageElements, chunk) {
  const textDiv = genieMessageElements.textDiv;
  let contentContainer = textDiv.querySelector(".content-wrapper");

  if (!contentContainer) {
    contentContainer = document.createElement("div");
    contentContainer.className = "content-wrapper";
    textDiv.appendChild(contentContainer);
  }

  // Maintain a raw-text buffer on the container so we can incrementally
  // process partial markdown without losing the original stream.
  const prevRaw = contentContainer.getAttribute("data-raw") || "";
  const newRaw = prevRaw + chunk;
  contentContainer.setAttribute("data-raw", newRaw);

  // Process the partial markdown into HTML and update the container.
  // The markdownService handles sanitization and semantic class additions
  // so code blocks / mermaid detection will work incrementally.
  try {
    const processed = markdownService.processPartialMarkdown(newRaw, null);
    // Replace innerHTML with the processed partial HTML
    contentContainer.innerHTML = processed;

    // Ensure interactive features on code blocks are applied incrementally.
    // wrapCodeBlocks is idempotent and will skip already-processed blocks.
    requestAnimationFrame(() => {
      try {
        wrapCodeBlocks(contentContainer, elements);
      } catch (e) {
        console.debug?.("wrapCodeBlocks incremental error:", e);
      }
    });
  } catch (e) {
    // Fallback: append as plain text if partial parse fails.
    contentContainer.textContent = newRaw;
    console.debug?.("Partial render failed, falling back to text.", e);
  }

  scrollToBottom(elements);
}

/**
 * Add AI response with typing effect - simplified
 */
export function addGenieResponseWithTypingEffect(elements, responseText) {
  // Add empty message bubble first (contentWrapper is created inside)
  const { messageWrapper, textDiv, avatar, contentWrapper } = addMessage(elements, "", "ai");
  if (!messageWrapper) return;

  // Start thinking animation
  const thinkingAnimation = createThinkingAnimation(avatar);

  setTimeout(() => {
    thinkingAnimation.stop();

    // Use the contentWrapper that was already created in addMessage
    // Start typewriter effect
    optimizedTypeWriter(elements, responseText, contentWrapper, () => {
      // Cleanup and finalize
      markdownService.clearPartialCache();

      // Process code blocks after typing is complete
      setTimeout(() => {
        wrapCodeBlocks(contentWrapper, elements);
        scrollToBottom(elements);
      }, 100);
    });
  }, 1000);
}
