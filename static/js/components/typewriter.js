// static/js/components/typewriter.js
import { markdownService } from "../services/markdown-service.js";

/**
 * Typewriter Animation - Handles text animation effects with smart rendering
 * Provides optimized performance with CONSISTENT fast speed for all text lengths
 */

// Ultra-fast optimized typewriter with consistent speed
export function optimizedTypeWriter(elements, text, element, callback) {
  const words = text.split(" ");
  let i = 0,
    j = 0;
  let currentText = "";
  let isUserScrolling = false;
  let scrollTimeout;
  let animationId;
  let lastProcessedLength = 0;

  // CONSISTENT FAST SPEED: Fixed characters per frame regardless of text length
  const CHARS_PER_FRAME = 8; // Consistent fast speed for all responses
  const MARKDOWN_PROCESS_INTERVAL = 20; // Process markdown every 20 characters

  let frameCounter = 0;

  function animateText() {
    frameCounter++;

    // Type CONSISTENT number of characters per frame for ALL text lengths
    for (let k = 0; k < CHARS_PER_FRAME && i < words.length; k++) {
      if (i < words.length) {
        currentText += words[i].charAt(j);

        j++;
        if (j === words[i].length + 1) {
          j = 0;
          i++;
          currentText += " ";
        }
      }
    }

    // Process markdown at consistent intervals for smooth performance
    if (
      currentText.length - lastProcessedLength >= MARKDOWN_PROCESS_INTERVAL ||
      i >= words.length
    ) {
      element.innerHTML = markdownService.processPartialMarkdown(
        currentText.trim(),
        text
      );
      lastProcessedLength = currentText.length;
    }

    // Auto-scroll only if user isn't manually scrolling
    if (!isUserScrolling) {
      elements.chat.parentElement.scrollTop =
        elements.chat.parentElement.scrollHeight;
    }

    if (i < words.length) {
      animationId = requestAnimationFrame(animateText);
    } else {
      // Final render to ensure complete content display
      element.innerHTML = markdownService.processFullMarkdown(text);
      if (callback) callback();
    }
  }

  function handleUserScroll() {
    isUserScrolling = true;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const atBottom =
        Math.abs(
          elements.chat.parentElement.scrollHeight -
            elements.chat.parentElement.scrollTop -
            elements.chat.parentElement.clientHeight
        ) < 10;
      if (atBottom) isUserScrolling = false;
    }, 800);
  }

  // Track user scroll behavior
  elements.chat.parentElement.addEventListener("wheel", handleUserScroll, {
    passive: true,
  });
  elements.chat.parentElement.addEventListener("touchmove", handleUserScroll, {
    passive: true,
  });

  animationId = requestAnimationFrame(animateText);

  // Return cleanup function
  return () => {
    cancelAnimationFrame(animationId);
    elements.chat.parentElement.removeEventListener("wheel", handleUserScroll);
    elements.chat.parentElement.removeEventListener(
      "touchmove",
      handleUserScroll
    );
  };
}

// Alternative: Even faster consistent speed option
export function ultraFastTypeWriter(elements, text, element, callback) {
  const words = text.split(" ");
  let i = 0,
    j = 0;
  let currentText = "";
  let isUserScrolling = false;
  let scrollTimeout;
  let animationId;
  let lastProcessedLength = 0;

  // ULTRA FAST: More characters per frame for very rapid typing effect
  const CHARS_PER_FRAME = 15; // Ultra fast consistent speed
  const MARKDOWN_PROCESS_INTERVAL = 30; // Less frequent markdown processing for better performance

  let frameCounter = 0;

  function animateText() {
    frameCounter++;

    // Type many characters per frame for ultra-fast effect
    for (let k = 0; k < CHARS_PER_FRAME && i < words.length; k++) {
      if (i < words.length) {
        currentText += words[i].charAt(j);

        j++;
        if (j === words[i].length + 1) {
          j = 0;
          i++;
          currentText += " ";
        }
      }
    }

    // Less frequent markdown processing for better performance
    if (
      currentText.length - lastProcessedLength >= MARKDOWN_PROCESS_INTERVAL ||
      i >= words.length
    ) {
      element.innerHTML = markdownService.processPartialMarkdown(
        currentText.trim(),
        text
      );
      lastProcessedLength = currentText.length;
    }

    // Auto-scroll management
    if (!isUserScrolling) {
      elements.chat.parentElement.scrollTop =
        elements.chat.parentElement.scrollHeight;
    }

    if (i < words.length) {
      animationId = requestAnimationFrame(animateText);
    } else {
      element.innerHTML = markdownService.processFullMarkdown(text);
      if (callback) callback();
    }
  }

  function handleUserScroll() {
    isUserScrolling = true;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const atBottom =
        Math.abs(
          elements.chat.parentElement.scrollHeight -
            elements.chat.parentElement.scrollTop -
            elements.chat.parentElement.clientHeight
        ) < 10;
      if (atBottom) isUserScrolling = false;
    }, 800);
  }

  elements.chat.parentElement.addEventListener("wheel", handleUserScroll, {
    passive: true,
  });
  elements.chat.parentElement.addEventListener("touchmove", handleUserScroll, {
    passive: true,
  });

  animationId = requestAnimationFrame(animateText);

  return () => {
    cancelAnimationFrame(animationId);
    elements.chat.parentElement.removeEventListener("wheel", handleUserScroll);
    elements.chat.parentElement.removeEventListener(
      "touchmove",
      handleUserScroll
    );
  };
}

// AI Thinking Animation - Shows light ring around logo while thinking
export function createThinkingAnimation(aiAvatarElement) {
  // Add CSS animation if not already present
  if (!document.getElementById("thinking-animation-styles")) {
    const style = document.createElement("style");
    style.id = "thinking-animation-styles";
    style.textContent = `
      @keyframes thinking-ring {
        0% {
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          transform: scale(1);
        }
        50% {
          box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3);
          transform: scale(1.05);
        }
        100% {
          box-shadow: 0 0 0 12px rgba(59, 130, 246, 0);
          transform: scale(1);
        }
      }

      @keyframes thinking-pulse {
        0%, 100% {
          opacity: 0.8;
        }
        50% {
          opacity: 1;
        }
      }

      .ai-thinking {
        animation: thinking-ring 1.5s ease-out infinite, thinking-pulse 2s ease-in-out infinite;
        position: relative;
        z-index: 1;
      }

      .ai-thinking::before {
        content: '';
        position: absolute;
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        border: 2px solid rgba(59, 130, 246, 0.5);
        border-radius: 50%;
        animation: thinking-ring 1.5s ease-out infinite reverse;
      }
    `;
    document.head.appendChild(style);
  }

  // Add thinking effect to AI avatar only
  aiAvatarElement.classList.add("ai-thinking");

  return {
    stop: () => {
      aiAvatarElement.classList.remove("ai-thinking");
    },
  };
}

// Legacy typewriter function for backward compatibility
export function typeWriter(elements, text, element, isMarkdown, callback) {
  if (isMarkdown) {
    return optimizedTypeWriter(elements, text, element, callback);
  }

  // Simple typewriter for non-markdown content with consistent speed
  const words = text.split(" ");
  let i = 0,
    j = 0;
  let currentText = "";
  let animationId;

  // Consistent speed for non-markdown content too
  const CHARS_PER_FRAME = 8;
  let charCount = 0;

  function animateText() {
    // Type consistent characters per frame
    for (let k = 0; k < CHARS_PER_FRAME && i < words.length; k++) {
      if (i < words.length) {
        currentText += words[i].charAt(j);
        j++;
        if (j === words[i].length + 1) {
          j = 0;
          i++;
          currentText += " ";
        }
      }
    }

    element.innerHTML = DOMPurify.sanitize(currentText);

    if (i < words.length) {
      animationId = requestAnimationFrame(animateText);
    } else if (callback) {
      callback();
    }
  }

  animationId = requestAnimationFrame(animateText);
  return () => cancelAnimationFrame(animationId);
}
