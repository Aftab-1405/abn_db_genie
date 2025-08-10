/**
 * Typewriter Animation Module
 * This module provides functions for creating a smooth typewriter text animation
 * and an AI "thinking" visual effect.
 */

// ============================
// Imports
// ============================
// The markdownService is a placeholder for a service that would handle
// parsing and rendering markdown-formatted text.
import { markdownService } from "../services/markdown-service.js";

// ============================
// Configurable Constants
// ============================

// Controls the speed of the typewriter animation (higher is faster).
const CHARS_PER_FRAME = 8;
// The base number of characters to wait before updating the markdown render.
const BASE_MARKDOWN_INTERVAL = 20;
// Delay in milliseconds to detect if a user has stopped scrolling.
const SCROLL_DETECTION_DELAY = 800;
// Pixel threshold to consider the scroll position "at the bottom".
const SCROLL_BOTTOM_THRESHOLD = 10;

// ============================
// Typewriter Animation Function
// ============================

/**
 * Renders text with an optimized typewriter effect, handling markdown and auto-scrolling.
 * @param {Object} elements - DOM references (e.g., { chat: chatContainerElement }).
 * @param {string} text - The full string of text to be animated.
 * @param {HTMLElement} element - The DOM element where the text will be rendered.
 * @param {Function} [callback] - An optional function to call after the animation completes.
 * @returns {Function} A cleanup function to stop the animation and remove event listeners.
 */
export function optimizedTypeWriter(elements, text, element, callback) {
  // Split the full text into an array of characters for processing.
  const chars = text.split("");
  let index = 0; // Tracks the current position in the `chars` array.
  let currentText = ""; // The portion of the text currently displayed.
  let lastProcessedLength = 0; // Length of text at the last markdown render.
  let animationId; // Stores the ID from requestAnimationFrame to allow cancellation.
  let isUserScrolling = false; // Flag to disable auto-scroll if the user is scrolling.
  let scrollTimeout; // Timeout ID for detecting the end of a user's scroll.

  // Dynamically adjust the markdown processing interval based on the total text length
  // for better performance on very long texts.
  const MARKDOWN_PROCESS_INTERVAL = Math.max(
    BASE_MARKDOWN_INTERVAL,
    Math.floor(text.length / 50)
  );

  /**
   * Detects and handles manual scrolling by the user to prevent conflicts with auto-scrolling.
   */
  function handleUserScroll() {
    isUserScrolling = true;
    clearTimeout(scrollTimeout);

    // After a delay, check if the user has scrolled back to the bottom.
    scrollTimeout = setTimeout(() => {
      const parent = elements.chat.parentElement;
      const atBottom =
        Math.abs(parent.scrollHeight - parent.scrollTop - parent.clientHeight) <
        SCROLL_BOTTOM_THRESHOLD;

      // If at the bottom, re-enable auto-scrolling.
      if (atBottom) {
        isUserScrolling = false;
      }
    }, SCROLL_DETECTION_DELAY);
  }

  /**
   * The core animation loop that adds text and triggers rendering.
   */
  function animateText() {
    let charsThisFrame = 0;

    // Add a batch of characters to the current text in a single frame.
    while (charsThisFrame < CHARS_PER_FRAME && index < chars.length) {
      currentText += chars[index++];
      charsThisFrame++;
    }

    // To optimize performance, only process and render markdown after a certain number
    // of new characters have been added, or when the animation is complete.
    if (
      currentText.length - lastProcessedLength >= MARKDOWN_PROCESS_INTERVAL ||
      index >= chars.length
    ) {
      element.innerHTML = markdownService.processPartialMarkdown(
        currentText.trim(),
        text
      );
      lastProcessedLength = currentText.length;
    }

    // Automatically scroll to the bottom, but only if the user isn't scrolling manually.
    if (!isUserScrolling) {
      const parent = elements.chat.parentElement;
      parent.scrollTop = parent.scrollHeight;
    }

    // If there is more text to render, request the next animation frame.
    if (index < chars.length) {
      animationId = requestAnimationFrame(animateText);
    } else {
      // Once complete, do a final render with the full markdown processing.
      element.innerHTML = markdownService.processFullMarkdown(text);
      // Execute the callback function if it was provided.
      callback?.();
    }
  }

  // Attach event listeners for user scroll detection.
  const parentEl = elements.chat.parentElement;
  parentEl.addEventListener("wheel", handleUserScroll, { passive: true });
  parentEl.addEventListener("touchmove", handleUserScroll, { passive: true });

  // Start the animation.
  animationId = requestAnimationFrame(animateText);

  // Return a cleanup function to be called when the component unmounts or the animation is stopped.
  // This prevents memory leaks.
  return () => {
    cancelAnimationFrame(animationId);
    parentEl.removeEventListener("wheel", handleUserScroll);
    parentEl.removeEventListener("touchmove", handleUserScroll);
  };
}

// ============================
// AI Thinking Animation Function
// ============================

/**
 * Creates a multi-layered, pulsing CSS animation on an element to signify "thinking".
 * It dynamically injects the required CSS into the document head.
 * @param {HTMLElement} aiAvatarElement - The AI avatar DOM element to apply the animation to.
 * @returns {{stop: Function}} An object with a `stop` method to remove the animation.
 */
export function createThinkingAnimation(aiAvatarElement) {
  // Check if the styles have already been injected to prevent duplication.
  if (!document.getElementById("thinking-animation-styles")) {
    const style = document.createElement("style");
    style.id = "thinking-animation-styles";
    style.textContent = `
      @keyframes thinking-ring {
        0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); transform: scale(1); }
        50% { box-shadow: 0 0 20px 8px rgba(59, 130, 246, 0.3); transform: scale(1.05); }
        100% { box-shadow: 0 0 0 12px rgba(59, 130, 246, 0); transform: scale(1); }
      }
      @keyframes thinking-pulse {
        0%, 100% { opacity: 0.85; }
        50% { opacity: 1; }
      }
      @keyframes hue-rotate {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(360deg); }
      }
      @keyframes glow-blur {
        0%, 100% { filter: blur(0px); }
        50% { filter: blur(2px); }
      }
      .ai-thinking {
        animation: thinking-ring 1.5s ease-out infinite,
                   thinking-pulse 2s ease-in-out infinite,
                   hue-rotate 6s linear infinite;
        position: relative;
        z-index: 1;
      }
      .ai-thinking::before {
        content: '';
        position: absolute;
        top: -6px; left: -6px; right: -6px; bottom: -6px;
        border: 2px solid rgba(59, 130, 246, 0.5);
        border-radius: 50%;
        animation: thinking-ring 2s ease-out infinite reverse,
                   glow-blur 3s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
  }

  // Add the CSS class to the target element to start the animation.
  aiAvatarElement.classList.add("ai-thinking");

  // Return an object with a 'stop' method for cleanup.
  return {
    stop: () => aiAvatarElement.classList.remove("ai-thinking"),
  };
}
