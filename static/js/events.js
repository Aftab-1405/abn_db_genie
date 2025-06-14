// static/js/events.js

import { handleConnectDb, executeSqlString } from "./sql.js";
import {
  addMessage,
  wrapCodeBlocks,
  scrollToBottom,
  showNotification,
} from "./ui.js";
import { handleAIResponse, sendUserInput, handleError } from "./chat.js";

// Reusable API response handler with error notification
const handleApiResponse = async (fetchPromise, errorMessage, elements) => {
  try {
    const resp = await fetchPromise;
    const data = await resp.json();
    if (data.status === "success") return data;
    throw new Error(`Unexpected response: ${data.status}`);
  } catch {
    showNotification(elements, errorMessage, "error");
    return null;
  }
};

// Theme management utilities
const ThemeManager = {
  // Get current theme
  getCurrentTheme() {
    return document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
  },

  // Set theme and persist to localStorage
  setTheme(theme) {
    const html = document.documentElement;
    if (theme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);

    // Dispatch custom event for other components to listen to
    window.dispatchEvent(
      new CustomEvent("themeChanged", {
        detail: { theme },
      })
    );
  },

  // Toggle between light and dark themes
  toggleTheme() {
    const currentTheme = this.getCurrentTheme();
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    this.setTheme(newTheme);
    return newTheme;
  },

  // Initialize theme on page load (backup in case inline script fails)
  initializeTheme() {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const theme = savedTheme || (prefersDark ? "dark" : "light");
    this.setTheme(theme);
  },

  // Listen for system theme changes
  watchSystemTheme() {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", (e) => {
      // Only auto-switch if user hasn't manually set a preference
      if (!localStorage.getItem("theme")) {
        this.setTheme(e.matches ? "dark" : "light");
      }
    });
  },
};

// Initialize the application and load conversations automatically
export async function initializeApp(elements) {
  // Initialize theme (backup for inline script)
  ThemeManager.initializeTheme();

  // Watch for system theme changes
  ThemeManager.watchSystemTheme();

  // Load conversations automatically on page load
  await fetchAndDisplayConversations(elements);
}

// Bind all UI interactions and app events
export function initializeEventBindings(elements) {
  elements.html = document.documentElement;

  // Enhanced theme toggle with better UX
  elements.themeToggle.addEventListener("change", () => {
    const newTheme = ThemeManager.toggleTheme();
    const isDark = newTheme === "dark";

    // Update SQL editor theme if it exists
    if (elements.sqlEditor) {
      elements.sqlEditor.setOption("theme", isDark ? "dracula" : "default");
    }

    // Update toggle state to match current theme
    elements.themeToggle.checked = isDark;
  });

  // Listen for theme changes from other sources
  window.addEventListener("themeChanged", (e) => {
    const isDark = e.detail.theme === "dark";

    // Update toggle state
    if (elements.themeToggle) {
      elements.themeToggle.checked = isDark;
    }

    // Update SQL editor theme
    if (elements.sqlEditor) {
      elements.sqlEditor.setOption("theme", isDark ? "dracula" : "default");
    }
  });

  // Initialize theme toggle state on page load
  if (elements.themeToggle) {
    elements.themeToggle.checked = ThemeManager.getCurrentTheme() === "dark";
  }

  // Toggle sidebar (mobile)
  const SIDEBAR_HIDDEN_CLASS = "-translate-x-full";
  const SIDEBAR_VISIBLE_CLASS = "md:ml-64";
  const toggleSidebar = () => {
    elements.sidebar.classList.toggle(SIDEBAR_HIDDEN_CLASS);
    elements.mainContent.classList.toggle(SIDEBAR_VISIBLE_CLASS);
  };
  [elements.toggleButton, elements.sidebarCloseButton].forEach((btn) => {
    if (btn) btn.addEventListener("click", toggleSidebar);
  });

  // Sync sidebar visibility with screen size
  const handleMediaChange = (e) => {
    if (e.matches) {
      elements.sidebar.classList.remove(SIDEBAR_HIDDEN_CLASS);
      elements.mainContent.classList.add(SIDEBAR_VISIBLE_CLASS);
    } else {
      elements.sidebar.classList.add(SIDEBAR_HIDDEN_CLASS);
      elements.mainContent.classList.remove(SIDEBAR_VISIBLE_CLASS);
    }
  };
  elements.mediaQuery.addEventListener("change", handleMediaChange);
  handleMediaChange(elements.mediaQuery);

  // Connect to selected database
  elements.connectDbButton.addEventListener("click", () => {
    handleConnectDb(elements);
  });

  // Start a new conversation
  elements.newConversationBtn.addEventListener("click", async () => {
    const data = await handleApiResponse(
      fetch("/new_conversation", { method: "POST" }),
      "Failed to start new conversation",
      elements
    );

    if (data) {
      sessionStorage.setItem("conversation_id", data.conversation_id);
      elements.chat.innerHTML = "";
      showNotification(elements, "New conversation started", "success");
      // Refresh conversation list to show the new conversation
      await fetchAndDisplayConversations(elements);
    }
  });

  // Toggle profile dropdown menu
  const toggleProfileMenu = () => {
    elements.profileMenu.classList.toggle("invisible");
    elements.profileMenu.classList.toggle("opacity-0");
    elements.profileMenu.classList.toggle("scale-95");
  };
  elements.profileBtn.addEventListener("click", toggleProfileMenu);

  // Open settings from profile dropdown
  const firstProfileLink = document.querySelector(
    "#profile-menu a:first-child"
  );
  if (firstProfileLink) {
    firstProfileLink.addEventListener("click", (ev) => {
      ev.preventDefault();
      elements.settingsModal.classList.remove("invisible");
      elements.profileMenu.classList.add("invisible", "opacity-0", "scale-95");
    });
  }

  // Close settings modal via close button
  elements.settingsModalClose.addEventListener("click", () => {
    elements.settingsModal.classList.add("invisible");
  });

  // Close settings modal on outside click
  elements.settingsModal.addEventListener("click", (ev) => {
    if (!ev.target.closest(".max-w-md")) {
      elements.settingsModal.classList.add("invisible");
    }
  });

  // Hide profile menu on outside click
  document.addEventListener("click", (ev) => {
    if (
      !elements.profileMenu.contains(ev.target) &&
      !elements.profileBtn.contains(ev.target)
    ) {
      elements.profileMenu.classList.add("invisible", "opacity-0", "scale-95");
    }
  });

  // Auto resize input area
  elements.adjustTextInputHeight = () => {
    const ti = elements.textInput;
    ti.style.height = "auto";
    ti.style.height = `${ti.scrollHeight}px`;
    ti.style.overflowY = ti.scrollHeight > 192 ? "auto" : "hidden";
  };
  elements.textInput.addEventListener("input", () => {
    elements.adjustTextInputHeight();
  });

  // Handle message submission
  elements.sendIcon.addEventListener("click", () => {
    sendUserInput(elements);
  });
  elements.textInput.addEventListener("keypress", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      elements.sendIcon.click();
    }
  });

  // Execute SQL query from CodeMirror
  elements.executeQueryButton.addEventListener("click", async () => {
    const sqlQ = elements.sqlEditor.getValue();
    if (!sqlQ) return;
    const orig = elements.executeQueryButton.innerHTML;
    elements.executeQueryButton.disabled = true;
    elements.executeQueryButton.innerHTML = elements.LOADING_SPINNER_HTML;
    await executeSqlString(elements, sqlQ);
    elements.executeQueryButton.innerHTML = orig;
    elements.executeQueryButton.disabled = false;
  });

  // Close query result modal
  elements.closeBtn.addEventListener("click", () => {
    elements.queryResultModal.classList.replace("flex", "hidden");
  });
  window.addEventListener("click", (ev) => {
    if (ev.target === elements.queryResultModal) {
      elements.queryResultModal.classList.replace("flex", "hidden");
    }
  });
}

// Fetch and render past conversations in the sidebar
export async function fetchAndDisplayConversations(elements) {
  // Show loading state
  const noConversationsMessage = document.getElementById(
    "no-conversations-message"
  );
  if (noConversationsMessage) {
    noConversationsMessage.textContent = "Loading conversations...";
    noConversationsMessage.style.display = "block";
  }

  const data = await handleApiResponse(
    fetch("/get_conversations"),
    "Failed to fetch conversations",
    elements
  );

  if (data) {
    populateConversations(elements, data.conversations);
  } else {
    // Handle error state
    if (noConversationsMessage) {
      noConversationsMessage.textContent = "Failed to load conversations";
      noConversationsMessage.style.display = "block";
    }
  }
}

// Create conversation entries for the sidebar
function populateConversations(elements, conversations) {
  const conversationListContainer =
    elements.conversationList || document.getElementById("conversation-list");
  const noConversationsMessage = document.getElementById(
    "no-conversations-message"
  );

  // Clear existing content
  conversationListContainer.innerHTML = "";

  if (!conversations || conversations.length === 0) {
    // Show no conversations message
    const emptyMessage = document.createElement("div");
    emptyMessage.id = "no-conversations-message";
    emptyMessage.className =
      "text-neutral-500 dark:text-neutral-400 text-center py-8";
    emptyMessage.textContent = "No conversations yet";
    conversationListContainer.appendChild(emptyMessage);
    return;
  }

  // Hide the no conversations message if it exists
  if (noConversationsMessage) {
    noConversationsMessage.style.display = "none";
  }

  const frag = document.createDocumentFragment();

  conversations.forEach((conv) => {
    const conversationItem = document.createElement("div");
    conversationItem.className =
      "conversation-item cursor-pointer block px-4 py-3 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-600 rounded-lg border border-transparent hover:border-neutral-200 dark:hover:border-neutral-500 transition-all duration-200";

    // Format the date
    const date = new Date(conv.timestamp);
    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    conversationItem.innerHTML = `
      <div class="flex flex-col gap-1">
        <div class="font-medium text-neutral-900 dark:text-neutral-100 truncate">
          ${conv.preview || "New Conversation"}
        </div>
        <div class="text-xs text-neutral-500 dark:text-neutral-400">
          ${formattedDate} at ${formattedTime}
        </div>
      </div>
    `;

    conversationItem.addEventListener("click", (ev) => {
      ev.preventDefault();
      loadConversation(elements, conv.id);

      // Add visual feedback for selected conversation
      document.querySelectorAll(".conversation-item").forEach((item) => {
        item.classList.remove(
          "bg-blue-50",
          "dark:bg-blue-900",
          "border-blue-200",
          "dark:border-blue-700"
        );
      });
      conversationItem.classList.add(
        "bg-blue-50",
        "dark:bg-blue-900",
        "border-blue-200",
        "dark:border-blue-700"
      );
    });

    frag.appendChild(conversationItem);
  });

  conversationListContainer.appendChild(frag);
}

// Load a specific conversation thread
async function loadConversation(elements, conversationId) {
  const data = await handleApiResponse(
    fetch(`/get_conversation/${conversationId}`),
    "Failed to load conversation",
    elements
  );

  if (data) {
    sessionStorage.setItem("conversation_id", conversationId);
    elements.chat.innerHTML = "";

    data.conversation.messages.forEach((msg) => {
      addMessage(elements, msg.content, msg.sender);
      const lastWrapper = elements.chat.lastElementChild;
      const textDiv = lastWrapper?.querySelector(`.${msg.sender}-message-text`);
      if (textDiv) wrapCodeBlocks(textDiv, elements);
    });

    scrollToBottom(elements);
    showNotification(elements, "Conversation loaded", "success");
  }
}

// Enhanced SQL Editor Toggle Functionality
const sqlEditorToggle = document.getElementById("sql-editor-toggle");
const sqlEditorPopup = document.getElementById("sql-editor-popup");
const sqlEditorClose = document.getElementById("sql-editor-close");
const sqlEditorMinimize = document.getElementById("sql-editor-minimize");

// SQL Editor state management
const sqlEditorState = {
  isOpen: false,
  isMinimized: false,
  previousHeight: null,
};

if (sqlEditorToggle && sqlEditorPopup && sqlEditorClose && sqlEditorMinimize) {
  // Ensure editor starts closed (fix for auto-opening issue)
  sqlEditorPopup.classList.add("translate-x-full");
  sqlEditorPopup.classList.remove("translate-x-0");

  // Open SQL Editor
  sqlEditorToggle.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    if (sqlEditorState.isMinimized) {
      // If minimized, restore to full size
      restoreEditor();
    } else {
      // Normal open
      openEditor();
    }
  });

  // Close SQL Editor
  sqlEditorClose.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    closeEditor();
  });

  // Minimize SQL Editor
  sqlEditorMinimize.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    if (sqlEditorState.isMinimized) {
      restoreEditor();
    } else {
      minimizeEditor();
    }
  });

  // Close editor when clicking outside (but not when minimized)
  document.addEventListener("click", function (e) {
    if (
      sqlEditorState.isOpen &&
      !sqlEditorState.isMinimized &&
      !sqlEditorPopup.contains(e.target) &&
      !sqlEditorToggle.contains(e.target)
    ) {
      closeEditor();
    }
  });

  // Prevent clicks inside the editor from closing it
  sqlEditorPopup.addEventListener("click", function (e) {
    e.stopPropagation();
  });

  // Functions for editor state management
  function openEditor() {
    sqlEditorPopup.classList.remove("translate-x-full");
    sqlEditorPopup.classList.add("translate-x-0");
    sqlEditorState.isOpen = true;
    sqlEditorState.isMinimized = false;

    // Update minimize button icon to minimize
    updateMinimizeButton(false);

    // Focus on editor if CodeMirror is available
    setTimeout(() => {
      if (window.sqlEditor && window.sqlEditor.focus) {
        window.sqlEditor.focus();
      }
    }, 300);
  }

  function closeEditor() {
    sqlEditorPopup.classList.remove("translate-x-0");
    sqlEditorPopup.classList.add("translate-x-full");
    sqlEditorState.isOpen = false;
    sqlEditorState.isMinimized = false;

    // Reset any minimized state
    const contentArea = sqlEditorPopup.querySelector(
      ".flex-1.flex.flex-col.min-h-0"
    );
    if (contentArea) {
      contentArea.style.display = "flex";
    }
    sqlEditorPopup.classList.add("h-2/3");
    sqlEditorPopup.style.height = "";

    updateMinimizeButton(false);
  }

  function minimizeEditor() {
    // Store current height classes
    sqlEditorState.previousHeight = sqlEditorPopup.className;

    // Hide the main content area (everything except header)
    const contentArea = sqlEditorPopup.querySelector(
      ".flex-1.flex.flex-col.min-h-0"
    );
    if (contentArea) {
      contentArea.style.display = "none";
    }

    // Remove height classes and set to auto for header-only display
    sqlEditorPopup.classList.remove("h-2/3");
    sqlEditorPopup.style.height = "auto";

    sqlEditorState.isMinimized = true;
    updateMinimizeButton(true);
  }

  function restoreEditor() {
    // Show the content area
    const contentArea = sqlEditorPopup.querySelector(
      ".flex-1.flex.flex-col.min-h-0"
    );
    if (contentArea) {
      contentArea.style.display = "flex";
    }

    // Restore height classes
    sqlEditorPopup.classList.add("h-2/3");
    sqlEditorPopup.style.height = "";

    sqlEditorState.isMinimized = false;
    updateMinimizeButton(false);
  }

  function updateMinimizeButton(isMinimized) {
    const minimizeBtn = document.getElementById("sql-editor-minimize");
    const minimizeIcon = minimizeBtn.querySelector("svg");

    if (isMinimized) {
      // Change to restore icon (square)
      minimizeIcon.innerHTML = `
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
      `;
      minimizeBtn.title = "Restore Editor";
    } else {
      // Change back to minimize icon (line)
      minimizeIcon.innerHTML = `
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
      `;
      minimizeBtn.title = "Minimize Editor";
    }
  }

  // Keyboard shortcuts
  document.addEventListener("keydown", function (e) {
    // Ctrl/Cmd + Shift + S to toggle SQL editor
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "S") {
      e.preventDefault();
      if (sqlEditorState.isOpen) {
        closeEditor();
      } else {
        openEditor();
      }
    }

    // Escape to close editor (only if open and not minimized)
    if (
      e.key === "Escape" &&
      sqlEditorState.isOpen &&
      !sqlEditorState.isMinimized
    ) {
      closeEditor();
    }
  });
}
