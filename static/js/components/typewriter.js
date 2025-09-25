/**
 * Modern Typewriter Animation Module
 * Uses CSS animations and Web Animations API for better performance
 * Creates smooth, GPU-accelerated text reveal effects
 */

import { markdownService } from "../services/markdown-service.js";

// ============================
// Constants
// ============================
const WORD_DELAY = 100; // Delay between word reveals in ms
const LINE_DELAY = 200; // Delay between line reveals in ms

// ============================
// CSS-Based Typewriter Animation
// ============================

/**
 * Creates a modern, performance-optimized typing animation using CSS
 * @param {Object} elements - DOM references
 * @param {string} text - The text to animate
 * @param {HTMLElement} element - Target container
 * @param {Function} callback - Completion callback
 */
export function optimizedTypeWriter(elements, text, element, callback) {
  // Inject CSS if not already present
  injectTypewriterCSS();

  // Process the markdown first (no need for partial processing)
  const processedHTML = markdownService.processFullMarkdown(text);
  element.innerHTML = processedHTML;

  // Create the animation based on content type
  const animationType = detectContentType(text);

  switch (animationType) {
    case "code":
      return createCodeRevealAnimation(element, callback);
    case "list":
      return createListAnimation(element, callback);
    case "paragraph":
      return createParagraphAnimation(element, callback);
    default:
      return createDefaultAnimation(element, callback);
  }
}

/**
 * Detect the primary content type for appropriate animation
 */
function detectContentType(text) {
  if (text.includes("```") || text.includes("`")) return "code";
  if (text.includes("\n- ") || text.includes("\n* ") || text.includes("\n1. "))
    return "list";
  if (text.split("\n\n").length > 2) return "paragraph";
  return "default";
}

/**
 * Code block reveal animation - reveals code blocks with a typing cursor effect
 */
function createCodeRevealAnimation(element, callback) {
  const codeBlocks = element.querySelectorAll("pre");
  const textNodes = getTextNodes(element);

  // Hide everything initially
  element.style.opacity = "0";

  let delay = 0;
  const animations = [];

  // Animate text first
  textNodes.forEach((node, index) => {
    if (node.textContent.trim()) {
      const wrapper = wrapTextNode(node);
      wrapper.style.opacity = "0";

      const animation = wrapper.animate(
        [
          { opacity: 0, transform: "translateY(10px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        {
          duration: 600,
          delay: delay,
          fill: "forwards",
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        }
      );

      animations.push(animation);
      delay += 100;
    }
  });

  // Animate code blocks with typing effect
  codeBlocks.forEach((block, index) => {
    block.classList.add("typing-animation");
    block.style.animationDelay = `${delay}ms`;
    delay += 1000;
  });

  // Show the container
  element.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: 300,
    fill: "forwards",
  });

  // Call callback after all animations
  const totalDuration = delay + 1000;
  const timeoutId = setTimeout(() => {
    cleanup(element);
    callback?.();
  }, totalDuration);

  return () => {
    // Cancel any running Web Animations to avoid leaks (guard before calling)
    animations.forEach((anim) => {
      if (anim && typeof anim.cancel === "function") {
        anim.cancel();
      }
    });
    clearTimeout(timeoutId);
    cleanup(element);
  };
}

/**
 * List animation - reveals list items one by one
 */
function createListAnimation(element, callback) {
  const listItems = element.querySelectorAll("li, p, h1, h2, h3, h4, h5, h6");

  element.style.opacity = "1";

  // Hide all items initially
  listItems.forEach((item) => {
    item.style.opacity = "0";
    item.style.transform = "translateX(-20px)";
  });

  // Animate each item
  const animations = [];
  listItems.forEach((item, index) => {
    const animation = item.animate(
      [
        { opacity: 0, transform: "translateX(-20px)" },
        { opacity: 1, transform: "translateX(0)" },
      ],
      {
        duration: 400,
        delay: index * LINE_DELAY,
        fill: "forwards",
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      }
    );

    animations.push(animation);
  });

  const totalDuration = listItems.length * LINE_DELAY + 400;
  const timeoutId = setTimeout(() => {
    cleanup(element);
    callback?.();
  }, totalDuration);

  return () => {
    animations.forEach((anim) => {
      if (anim && typeof anim.cancel === "function") anim.cancel();
    });
    clearTimeout(timeoutId);
    cleanup(element);
  };
}

/**
 * Paragraph animation - reveals paragraphs with word-by-word effect
 */
function createParagraphAnimation(element, callback) {
  const paragraphs = element.querySelectorAll("p, h1, h2, h3, h4, h5, h6");

  element.style.opacity = "1";

  let totalDelay = 0;
  const animations = [];

  paragraphs.forEach((paragraph, pIndex) => {
    const words = paragraph.textContent.split(" ");

    // Split into word spans
    paragraph.innerHTML = words
      .map(
        (word) =>
          `<span class="word-reveal" style="opacity: 0; display: inline-block;">${word}&nbsp;</span>`
      )
      .join("");

    const wordSpans = paragraph.querySelectorAll(".word-reveal");

    wordSpans.forEach((span, wIndex) => {
      const animation = span.animate(
        [
          { opacity: 0, transform: "translateY(20px) scale(0.8)" },
          { opacity: 1, transform: "translateY(0) scale(1)" },
        ],
        {
          duration: 300,
          delay: totalDelay + wIndex * WORD_DELAY,
          fill: "forwards",
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        }
      );

      animations.push(animation);
    });

    totalDelay += words.length * WORD_DELAY + LINE_DELAY;
  });

  setTimeout(() => {
    cleanup(element);
    callback?.();
  }, totalDelay + 300);

  return () => {
    animations.forEach((anim) => {
      if (anim && typeof anim.cancel === "function") anim.cancel();
    });
    // No long-running timeout here to clear (handled above)
    cleanup(element);
  };
}

/**
 * Default animation - simple fade in with slight stagger
 */
function createDefaultAnimation(element, callback) {
  const blocks = Array.from(element.children);

  element.style.opacity = "1";

  const animations = blocks.map((block, index) => {
    block.style.opacity = "0";

    return block.animate(
      [
        { opacity: 0, transform: "translateY(15px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      {
        duration: 500,
        delay: index * 150,
        fill: "forwards",
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      }
    );
  });

  const totalDuration = blocks.length * 150 + 500;
  const timeoutId = setTimeout(() => {
    cleanup(element);
    callback?.();
  }, totalDuration);

  return () => {
    animations.forEach((anim) => {
      if (anim && typeof anim.cancel === "function") anim.cancel();
    });
    clearTimeout(timeoutId);
    cleanup(element);
  };
}

// ============================
// Helper Functions
// ============================

/**
 * Get all text nodes in an element
 */
function getTextNodes(element) {
  const textNodes = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode: function (node) {
      // Skip code blocks and empty text
      const parentTag = node.parentElement?.tagName;
      if (
        parentTag === "CODE" ||
        parentTag === "PRE" ||
        !node.textContent.trim()
      ) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }

  return textNodes;
}

/**
 * Wrap a text node in a span for animation
 */
function wrapTextNode(textNode) {
  const span = document.createElement("span");
  span.textContent = textNode.textContent;
  if (textNode.parentNode) {
    textNode.parentNode.replaceChild(span, textNode);
  }
  return span;
}

/**
 * Clean up animation classes and styles
 */
function cleanup(element) {
  // Remove animation classes
  element.querySelectorAll(".typing-animation, .word-reveal").forEach((el) => {
    el.classList.remove("typing-animation", "word-reveal");
    el.style.cssText = "";
  });

  // Reset container styles
  element.style.cssText = "";
}

/**
 * Inject CSS for animations
 */
function injectTypewriterCSS() {
  if (document.getElementById("modern-typewriter-styles")) return;

  const style = document.createElement("style");
  style.id = "modern-typewriter-styles";
  style.textContent = `
    /* Typing cursor effect for code blocks */
    @keyframes typing-cursor {
      0%, 50% { border-right: 2px solid transparent; }
      51%, 100% { border-right: 2px solid currentColor; }
    }
    
    @keyframes code-reveal {
      0% {
        width: 0;
        opacity: 0;
      }
      1% {
        opacity: 1;
      }
      100% {
        width: 100%;
        opacity: 1;
      }
    }
    
    .typing-animation {
      overflow: hidden;
      white-space: nowrap;
      animation: code-reveal 2s steps(40, end) forwards,
                 typing-cursor 1s step-end infinite;
    }
    
    .typing-animation:after {
      content: '';
      display: inline-block;
      width: 2px;
      height: 1em;
      background: currentColor;
      animation: typing-cursor 1s step-end infinite;
    }
    
    /* Smooth reveal animations */
    .word-reveal {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* Hardware acceleration for smooth animations */
    .typing-animation,
    .word-reveal {
      will-change: transform, opacity;
      transform: translateZ(0);
    }
    
    /* Responsive adjustments */
    @media (max-width: 640px) {
      .typing-animation {
        white-space: pre-wrap;
        animation-duration: 1.5s;
      }
    }
    
    /* Reduce motion for accessibility */
    @media (prefers-reduced-motion: reduce) {
      .typing-animation,
      .word-reveal {
        animation: none !important;
        transition: none !important;
        opacity: 1 !important;
        transform: none !important;
      }
    }
  `;

  document.head.appendChild(style);
}

// ============================
// Enhanced AI Thinking Animation
// ============================

/**
 * Creates a modern, GPU-accelerated thinking animation
 */
export function createThinkingAnimation(aiAvatarElement) {
  injectThinkingCSS();

  // Add multiple animation layers
  aiAvatarElement.classList.add("ai-thinking-modern");

  // Create floating particles effect
  createParticlesEffect(aiAvatarElement);

  return {
    stop: () => {
      aiAvatarElement.classList.remove("ai-thinking-modern");
      // Remove particles
      const particles = aiAvatarElement.querySelectorAll(".thinking-particle");
      particles.forEach((particle) => particle.remove());
    },
  };
}

/**
 * Create floating particles around the avatar
 */
function createParticlesEffect(avatar) {
  const particlesCount = 6;

  for (let i = 0; i < particlesCount; i++) {
    const particle = document.createElement("div");
    particle.className = "thinking-particle";
    particle.style.animationDelay = `${i * 0.3}s`;
    avatar.appendChild(particle);
  }
}

/**
 * Inject CSS for thinking animation
 */
function injectThinkingCSS() {
  if (document.getElementById("modern-thinking-styles")) return;

  const style = document.createElement("style");
  style.id = "modern-thinking-styles";
  style.textContent = `
    @keyframes modern-thinking {
      0%, 100% {
        transform: scale(1) rotate(0deg);
        filter: brightness(1) hue-rotate(0deg);
      }
      25% {
        transform: scale(1.05) rotate(2deg);
        filter: brightness(1.2) hue-rotate(90deg);
      }
      50% {
        transform: scale(1.1) rotate(-2deg);
        filter: brightness(1.4) hue-rotate(180deg);
      }
      75% {
        transform: scale(1.05) rotate(1deg);
        filter: brightness(1.2) hue-rotate(270deg);
      }
    }
    
    @keyframes particle-float {
      0%, 100% {
        transform: translateY(0px) translateX(0px) scale(0);
        opacity: 0;
      }
      10% {
        opacity: 1;
        transform: scale(1);
      }
      90% {
        opacity: 1;
      }
      100% {
        transform: translateY(-20px) translateX(10px) scale(0);
        opacity: 0;
      }
    }
    
    @keyframes glow-pulse {
      0%, 100% {
        box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
      }
      50% {
        box-shadow: 0 0 30px rgba(168, 85, 247, 0.8);
      }
    }
    
    .ai-thinking-modern {
      animation: modern-thinking 3s ease-in-out infinite,
                 glow-pulse 2s ease-in-out infinite;
      position: relative;
      z-index: 1;
      will-change: transform, filter;
    }
    
    .thinking-particle {
      position: absolute;
      width: 4px;
      height: 4px;
      background: linear-gradient(45deg, #a855f7, #06b6d4);
      border-radius: 50%;
      animation: particle-float 2s ease-in-out infinite;
      pointer-events: none;
      top: 50%;
      left: 50%;
    }
    
    .thinking-particle:nth-child(1) { left: 20%; animation-delay: 0s; }
    .thinking-particle:nth-child(2) { left: 80%; animation-delay: 0.3s; }
    .thinking-particle:nth-child(3) { top: 20%; animation-delay: 0.6s; }
    .thinking-particle:nth-child(4) { top: 80%; animation-delay: 0.9s; }
    .thinking-particle:nth-child(5) { left: 60%; top: 30%; animation-delay: 1.2s; }
    .thinking-particle:nth-child(6) { left: 40%; top: 70%; animation-delay: 1.5s; }
    
    /* Accessibility */
    @media (prefers-reduced-motion: reduce) {
      .ai-thinking-modern,
      .thinking-particle {
        animation: none !important;
      }
    }
  `;

  document.head.appendChild(style);
}
