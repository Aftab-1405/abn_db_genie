// static/js/events.js

import { handleConnectDb, executeSqlString } from "./sql.js";
import {
  addMessage,
  wrapCodeBlocks,
  scrollToBottom,
  showNotification,
} from "./ui.js";
import { sendUserInput } from "./chat.js";

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

    // Prevent large UI transitions (colors, shadows, etc.) during theme switch.
    // Add a temporary guard class and remove it after two frames so regular UI transitions still work later.
    html.classList.add('no-theme-transition');

    if (theme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }

    localStorage.setItem("theme", theme);

    // Allow other components to react immediately without triggering heavy transitions.
    window.dispatchEvent(new CustomEvent("themeChanged", { detail: { theme } }));

    // Remove guard after two frames to re-enable transitions for user interactions.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      html.classList.remove('no-theme-transition');
    }));
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
  // If the inline script in index.html already applied the theme, skip re-applying to avoid flicker.
  // The inline script sets the documentElement 'dark' class and persists a value; we can detect that.
  const alreadyHasThemeClass = document.documentElement.classList.contains("dark") || document.documentElement.classList.contains("no-theme-transition");
  const savedTheme = localStorage.getItem("theme");

  if (alreadyHasThemeClass && savedTheme) {
    // Theme already applied by server-side/inline script, only dispatch event to sync components.
    window.dispatchEvent(new CustomEvent("themeChanged", { detail: { theme: savedTheme } }));
    return;
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
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

  // Track if server connection is established
  let serverConnected = false;

  // Connect to selected database or open modal for credentials
  elements.connectDbButton.addEventListener("click", () => {
    const modal = document.getElementById("db-connection-modal");
    // If not connected to server, open modal for credentials
    if (!serverConnected || elements.databasesDropdown.options.length === 0) {
      if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
      }
    } else {
      // If already connected, connect to selected database
      const dbName = elements.databasesDropdown.value;
      if (!dbName) {
        showNotification(elements, "Please select a database", "error");
        return;
      }
      // Use existing handleConnectDb logic
      handleConnectDb(elements);
    }
  });

  // Handle DB Connection Modal actions
  const dbModal = document.getElementById("db-connection-modal");
  const dbForm = document.getElementById("db-connection-form");
  const dbCancel = document.getElementById("db-connection-cancel");
  if (dbModal && dbForm && dbCancel) {
    dbCancel.addEventListener("click", () => {
      dbModal.classList.add("hidden");
      dbModal.classList.remove("flex");
      dbForm.reset();
    });
    dbForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const host = dbForm["host"].value;
      const port = dbForm["port"].value;
      const user = dbForm["user"].value;
      const password = dbForm["password"].value;
      // Call backend API to connect and fetch schemas
      const resp = await fetch("/connect_db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host, port, user, password }),
      });
      const data = await resp.json();
      if (data.status === "connected") {
        showNotification(
          elements,
          `Connected to database at ${host}:${port}`,
          "success"
        );
        // Populate schemas dropdown
        const dropdown = elements.databasesDropdown;
        dropdown.innerHTML = "";
        if (Array.isArray(data.schemas)) {
          data.schemas.forEach((db) => {
            const opt = document.createElement("option");
            opt.value = db;
            opt.textContent = db;
            dropdown.appendChild(opt);
          });
        }
        serverConnected = true;
        dbModal.classList.add("hidden");
        dbModal.classList.remove("flex");
        dbForm.reset();
      } else {
        showNotification(
          elements,
          data.message || "Failed to connect to the database",
          "error"
        );
      }
    });
  }

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
      "conversation-item cursor-pointer block px-4 py-3 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-600 rounded-lg border border-transparent hover:border-neutral-200 dark:hover:border-neutral-500 transition-all duration-200 w-full max-w-full";

    // Create a wrapper for flex layout
    const wrapper = document.createElement("div");
    wrapper.className = "flex justify-between items-start";

    // Format the date only (no time)
    const date = new Date(conv.timestamp);
    const formattedDate = date.toLocaleDateString();

    // Content div
    const contentDiv = document.createElement("div");
    contentDiv.className =
      "flex flex-col gap-1 flex-grow min-w-0 w-full max-w-full";
    contentDiv.innerHTML = `
      <div class="font-medium text-neutral-900 dark:text-neutral-100 truncate w-full max-w-full">
        ${conv.preview || "New Conversation"}
      </div>
      <div class="text-xs text-neutral-500 dark:text-neutral-400">
        ${formattedDate}
      </div>
    `;

    // Delete button
    const deleteButton = document.createElement("button");
    deleteButton.className =
      "delete-conversation-btn opacity-0 group-hover:opacity-100 ml-2 p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-all duration-200";
    deleteButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-red-600" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
    `;

    // Add hover class to parent for delete button visibility
    conversationItem.classList.add("group");

    // Delete button click handler
    deleteButton.addEventListener("click", async (ev) => {
      ev.stopPropagation(); // Prevent conversation from being loaded

      try {
        const response = await fetch(`/delete_conversation/${conv.id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          // Remove conversation item from UI
          conversationItem.remove();
          showNotification(
            elements,
            "Conversation deleted successfully",
            "success"
          );

          // If this was the last conversation, show the no conversations message
          if (conversationListContainer.children.length === 0) {
            const emptyMessage = document.createElement("div");
            emptyMessage.id = "no-conversations-message";
            emptyMessage.className =
              "text-neutral-500 dark:text-neutral-400 text-center py-8";
            emptyMessage.textContent = "No conversations yet";
            conversationListContainer.appendChild(emptyMessage);
          }
        } else {
          showNotification(elements, "Failed to delete conversation", "error");
        }
      } catch (error) {
        showNotification(elements, "Error deleting conversation", "error");
      }
    });

    // Add content and delete button to wrapper
    wrapper.appendChild(contentDiv);
    wrapper.appendChild(deleteButton);
    conversationItem.appendChild(wrapper);

    // Conversation click handler
    contentDiv.addEventListener("click", (ev) => {
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

    // Process messages sequentially to ensure proper rendering
    for (const msg of data.conversation.messages) {
      addMessage(elements, msg.content, msg.sender);
      const lastWrapper = elements.chat.lastElementChild;
      const textDiv = lastWrapper?.querySelector(`.${msg.sender}-message-text`);

      if (textDiv) {
        // Process code blocks and wait for the content to be ready
        wrapCodeBlocks(textDiv, elements);

        // Force a reflow to ensure the DOM is updated
        void textDiv.offsetHeight;

        // For messages containing mermaid diagrams, ensure they're visible
        if (msg.content.includes("```mermaid")) {
          const mermaidDivs = textDiv.querySelectorAll(".mermaid-diagram");
          mermaidDivs.forEach((div) => {
            div.classList.remove("opacity-0", "scale-95");
            div.classList.add("opacity-100", "scale-100");
          });
        }
      }
    }

    scrollToBottom(elements);
    showNotification(elements, "Conversation loaded", "success");
  }
}

// Enhanced SQL Editor Toggle Functionality
const sqlEditorToggle = document.getElementById("sql-editor-toggle");
const sqlEditorPopup = document.getElementById("sql-editor-popup");
const sqlEditorClose = document.getElementById("sql-editor-close");

// SQL Editor state management
const sqlEditorState = {
  isOpen: false,
};

if (sqlEditorToggle && sqlEditorPopup && sqlEditorClose) {
  // Ensure editor starts closed (fix for auto-opening issue)
  sqlEditorPopup.classList.add("translate-x-full");
  sqlEditorPopup.classList.remove("translate-x-0");

  // Open SQL Editor
  sqlEditorToggle.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    openEditor();
  });

  // Close SQL Editor
  sqlEditorClose.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    closeEditor();
  });

  // Close editor when clicking outside
  document.addEventListener("click", function (e) {
    if (
      sqlEditorState.isOpen &&
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

    // Focus on editor if CodeMirror is available
    setTimeout(() => {
      if (window.sqlEditor && window.sqlEditor.focus) {
        window.sqlEditor.focus();
      }
    }, 300);
  }

  function closeEditor() {
    // Hide the popup completely and reset all styles
    sqlEditorPopup.classList.remove("translate-x-0");
    sqlEditorPopup.classList.add("translate-x-full");
    sqlEditorState.isOpen = false;
    sqlEditorPopup.style.height = "";
    sqlEditorPopup.classList.remove("min-h-0");
    // Show content area for next open
    const contentArea = sqlEditorPopup.querySelector(".sql-editor-content");
    if (contentArea) {
      contentArea.style.display = "flex";
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

    // Escape to close editor (only if open)
    if (e.key === "Escape" && sqlEditorState.isOpen) {
      closeEditor();
    }
  });
}
