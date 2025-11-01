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
  } catch (error) {
    console.error("API Error:", error);
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
    html.classList.add("no-theme-transition");

    if (theme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }

    try {
      localStorage.setItem("theme", theme);
    } catch (error) {
      console.warn("Failed to save theme to localStorage:", error);
    }

    // Allow other components to react immediately without triggering heavy transitions.
    window.dispatchEvent(
      new CustomEvent("themeChanged", { detail: { theme } })
    );

    // Remove guard after two frames to re-enable transitions for user interactions.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        html.classList.remove("no-theme-transition");
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
    // If the inline script in index.html already applied the theme, skip re-applying to avoid flicker.
    // The inline script sets the documentElement 'dark' class and persists a value; we can detect that.
    const alreadyHasThemeClass =
      document.documentElement.classList.contains("dark") ||
      document.documentElement.classList.contains("no-theme-transition");

    let savedTheme = null;
    try {
      savedTheme = localStorage.getItem("theme");
    } catch (error) {
      console.warn("Failed to read theme from localStorage:", error);
    }

    if (alreadyHasThemeClass && savedTheme) {
      // Theme already applied by server-side/inline script, only dispatch event to sync components.
      window.dispatchEvent(
        new CustomEvent("themeChanged", { detail: { theme: savedTheme } })
      );
      return;
    }

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
      let hasManualPreference = false;
      try {
        hasManualPreference = Boolean(localStorage.getItem("theme"));
      } catch (error) {
        console.warn(
          "Failed to check localStorage for theme preference:",
          error
        );
      }

      if (!hasManualPreference) {
        this.setTheme(e.matches ? "dark" : "light");
      }
    });
  },
};

// Helper function to schedule conversations load
const scheduleConversationsLoad = (elements) => {
  const loadConversations = () => {
    fetchAndDisplayConversations(elements).catch((error) => {
      console.warn("Failed to load conversations on initialization:", error);
    });
  };

  if (window.requestIdleCallback) {
    requestIdleCallback(loadConversations, { timeout: 500 });
  } else {
    requestAnimationFrame(() => setTimeout(loadConversations, 60));
  }
};

// Initialize the application and load conversations automatically
export async function initializeApp(elements) {
  // Initialize theme (backup for inline script)
  ThemeManager.initializeTheme();

  // Watch for system theme changes
  ThemeManager.watchSystemTheme();

  // Defer loading conversations slightly so the browser can paint the chat
  // container and logo first.
  scheduleConversationsLoad(elements);

  // Clear any lingering conversation id from previous sessions so that
  // typing immediately after load (without clicking New Chat) creates a new
  // conversation by default. If the user intentionally opens a conversation
  // via the UI, loadConversation sets the conversation id.
  try {
    sessionStorage.removeItem("conversation_id");
  } catch (error) {
    console.warn("Failed to clear conversation_id from sessionStorage:", error);
  }
}

// Helper function to handle theme toggle change
const handleThemeToggleChange = (elements) => {
  const newTheme = ThemeManager.toggleTheme();
  const isDark = newTheme === "dark";

  // Update SQL editor theme if it exists
  elements.sqlEditor?.setOption?.("theme", isDark ? "dracula" : "default");

  // Update toggle state to match current theme
  if (elements.themeToggle) {
    elements.themeToggle.checked = isDark;
  }
};

// Helper function to handle theme changes from other sources
const handleThemeChanged = (elements, event) => {
  const isDark = event.detail.theme === "dark";

  // Update toggle state
  if (elements.themeToggle) {
    elements.themeToggle.checked = isDark;
  }

  // Update SQL editor theme
  elements.sqlEditor?.setOption?.("theme", isDark ? "dracula" : "default");
};

// Helper function to handle conversation preview updates
const handleConversationPreviewUpdate = (elements, event) => {
  const detail = event.detail || {};
  const conversationId = detail.conversation_id;
  const preview = detail.preview;
  if (conversationId) {
    upsertConversationPreview(elements, conversationId, preview);
  }
};

// Helper function to setup sidebar toggle functionality
const setupSidebarToggle = (elements) => {
  const SIDEBAR_HIDDEN_CLASS = "-translate-x-full";
  const SIDEBAR_VISIBLE_CLASS = "md:ml-64";

  const toggleSidebar = () => {
    elements.sidebar.classList.toggle(SIDEBAR_HIDDEN_CLASS);
    elements.mainContent.classList.toggle(SIDEBAR_VISIBLE_CLASS);
  };

  [elements.toggleButton, elements.sidebarCloseButton].forEach((btn) => {
    btn?.addEventListener("click", toggleSidebar);
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
};

// Helper function to handle database connection form submission
const handleDbConnectionForm = async (elements, formData) => {
  const { host, port, user, password } = formData;

  try {
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

      // Populate schemas dropdown - handle both 'schemas' and 'databases' keys
      const databases = data.schemas || data.databases || [];
      populateSchemas(elements, databases);

      // Log for debugging
      console.debug('Connected to server, databases:', databases);

      return true;
    } else {
      showNotification(
        elements,
        data.message || "Failed to connect to the database",
        "error"
      );
      return false;
    }
  } catch (error) {
    console.error("Database connection error:", error);
    showNotification(elements, "Connection error occurred", "error");
    return false;
  }
};

// Helper function to populate schemas dropdown
const populateSchemas = (elements, schemas) => {
  const dropdown = elements.databasesDropdown;
  dropdown.innerHTML = "";

  // Add placeholder option first
  const placeholderOpt = document.createElement("option");
  placeholderOpt.value = "";
  placeholderOpt.textContent = "Select database...";
  dropdown.appendChild(placeholderOpt);

  if (Array.isArray(schemas)) {
    schemas.forEach((db) => {
      const opt = document.createElement("option");
      opt.value = db;
      opt.textContent = db;
      dropdown.appendChild(opt);
    });
  }
};

// Helper function to update connection status UI - Make it globally available
window.updateConnectionStatus = function(isConnected, dbName = '') {
  const connectBtn = document.getElementById('connect-db');
  const disconnectBtn = document.getElementById('disconnect-db');
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');
  const dbDropdown = document.getElementById('databases');

  if (connectBtn && disconnectBtn && statusIndicator && statusText) {
    if (isConnected) {
      // Connected to server - enable disconnect, disable connect
      connectBtn.disabled = true;
      connectBtn.classList.add('opacity-50');
      disconnectBtn.disabled = false;
      disconnectBtn.classList.remove('opacity-50');

      // Enable dropdown for database selection
      if (dbDropdown) {
        dbDropdown.disabled = false;
      }

      if (dbName) {
        // Connected to specific database
        statusIndicator.className = 'w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse';
        statusText.textContent = `Connected: ${dbName}`;
      } else {
        // Connected to server only
        statusIndicator.className = 'w-1.5 h-1.5 rounded-full bg-green-500';
        statusText.textContent = 'Server connected';
      }
      statusText.className = 'app-text-secondary text-xs';
    } else {
      // Disconnected state
      connectBtn.disabled = false;
      connectBtn.classList.remove('opacity-50');
      disconnectBtn.disabled = true;
      disconnectBtn.classList.add('opacity-50');
      statusIndicator.className = 'w-1.5 h-1.5 rounded-full bg-gray-400';
      statusText.textContent = 'Not connected';
      statusText.className = 'app-text-secondary text-xs';

      // Disable dropdown when not connected
      if (dbDropdown) {
        dbDropdown.disabled = true;
      }
    }
  }
};

// Helper function to setup database connection modal
const setupDbConnectionModal = (elements) => {
  const dbModal = document.getElementById("db-connection-modal");
  const dbForm = document.getElementById("db-connection-form");
  const dbCancel = document.getElementById("db-connection-cancel");

  const disconnectBtn = document.getElementById('disconnect-db');

  if (!dbModal || !dbForm || !dbCancel) return;

  // Use elements.serverConnected as shared state across the UI
  if (typeof elements.serverConnected === 'undefined') elements.serverConnected = false;

  // Connect button ONLY opens modal for server connection
  elements.connectDbButton.addEventListener("click", () => {
    dbModal.classList.remove("hidden");
    dbModal.classList.add("flex");
  });

  // Database selection via dropdown change event
  elements.databasesDropdown.addEventListener("change", async () => {
    const dbName = elements.databasesDropdown.value;
    if (!dbName) {
      // User selected placeholder option
      window.updateConnectionStatus(true); // Server connected, no database
      return;
    }

    // Automatically connect to selected database
    await handleConnectDb(elements);
  });

  dbCancel.addEventListener("click", () => {
    dbModal.classList.add("hidden");
    dbModal.classList.remove("flex");
    dbForm.reset();
  });

  dbForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
      host: dbForm["host"].value,
      port: dbForm["port"].value,
      user: dbForm["user"].value,
      password: dbForm["password"].value,
    };

    // Show loading state on the submit button and disable inputs to indicate progress
    const submitBtn = document.getElementById('db-connection-submit');
    const origHtml = elements.setButtonLoading ? elements.setButtonLoading(submitBtn) : null;

    // Also disable form inputs during request
    const inputs = Array.from(dbForm.querySelectorAll('input'));
    inputs.forEach(i => i.disabled = true);

    let success = false;
    try {
      success = await handleDbConnectionForm(elements, formData);

      if (success) {
        elements.serverConnected = true;
        dbModal.classList.add("hidden");
        dbModal.classList.remove("flex");
        dbForm.reset();
        // Update connection status UI
        window.updateConnectionStatus(true);
      }
    } finally {
      // Restore button state and inputs regardless of success/failure
      if (elements.clearButtonLoading) {
        elements.clearButtonLoading(submitBtn, origHtml);
      } else if (submitBtn) {
        submitBtn.disabled = false;
        if (origHtml !== null) submitBtn.innerHTML = origHtml;
      }
      inputs.forEach(i => i.disabled = false);
    }
  });

  // Disconnect button behavior
  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', async () => {
      const orig = elements.setButtonLoading ? elements.setButtonLoading(disconnectBtn) : null;
      try {
        const resp = await fetch('/disconnect_db', { method: 'POST' });
        const data = await resp.json();
        if (data?.status === 'success') {
          elements.serverConnected = false;
          // Clear dropdown
          elements.databasesDropdown.innerHTML = '';
          showNotification(elements, 'Disconnected from database server', 'success');
          // Update connection status UI
          window.updateConnectionStatus(false);

          // Inform other tabs (optional): set a localStorage flag to notify other pages
          try { localStorage.setItem('dbDisconnectedAt', Date.now().toString()); } catch (e) {}
        } else {
          showNotification(elements, data?.message || 'Failed to disconnect', 'error');
        }
      } catch (err) {
        console.error('Disconnect error:', err);
        showNotification(elements, 'Failed to disconnect', 'error');
      } finally {
        if (elements.clearButtonLoading) {
          elements.clearButtonLoading(disconnectBtn, orig);
        } else {
          disconnectBtn.disabled = false;
          if (orig !== null) disconnectBtn.innerHTML = orig;
        }
      }
    });
  }
};

// Helper function to setup profile menu
const setupProfileMenu = (elements) => {
  const toggleProfileMenu = () => {
    // If menu is invisible, show it with animations
    if (elements.profileMenu.classList.contains("invisible")) {
      elements.profileMenu.classList.remove("invisible");
      // Use requestAnimationFrame to ensure the transition happens
      requestAnimationFrame(() => {
        elements.profileMenu.classList.remove("opacity-0", "scale-95", "translate-y-2");
      });
    } else {
      // If menu is visible, hide it with animations
      elements.profileMenu.classList.add("opacity-0", "scale-95", "translate-y-2");
      // Wait for transition to complete before making it invisible
      setTimeout(() => {
        elements.profileMenu.classList.add("invisible");
      }, 200); // Match this with your transition duration
    }
  };

  elements.profileBtn.addEventListener("click", toggleProfileMenu);

  // Open settings from profile dropdown
  const firstProfileLink = document.querySelector(
    "#profile-menu a:first-child"
  );
  firstProfileLink?.addEventListener("click", (ev) => {
    ev.preventDefault();
    elements.settingsModal.classList.remove("invisible");
    elements.profileMenu.classList.add("invisible", "opacity-0", "scale-95");
  });

  // Function to show settings modal with animation
  const showSettingsModal = () => {
    elements.settingsModal.classList.remove('invisible');
    // Use requestAnimationFrame to ensure the transition happens
    requestAnimationFrame(() => {
      const modalContent = elements.settingsModal.querySelector('.app-surface-secondary');
      modalContent.classList.remove('scale-95', 'opacity-0');
    });
  };

  // Function to hide settings modal with animation
  const hideSettingsModal = () => {
    const modalContent = elements.settingsModal.querySelector('.app-surface-secondary');
    modalContent.classList.add('scale-95', 'opacity-0');
    // Wait for animation to complete before hiding
    setTimeout(() => {
      elements.settingsModal.classList.add('invisible');
    }, 300); // Match this with your transition duration
  };

  // Close settings modal via close button
  elements.settingsModalClose.addEventListener("click", hideSettingsModal);

  // Close settings modal on outside click
  elements.settingsModal.addEventListener("click", (ev) => {
    if (!ev.target.closest(".app-surface-secondary")) {
      hideSettingsModal();
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

  // Handle logout
  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener("click", async (ev) => {
      ev.preventDefault();

      try {
        // Step 1: Disconnect from database if connected
        if (elements.serverConnected) {
          try {
            await fetch('/disconnect_db', { method: 'POST' });
            console.debug('Database disconnected during logout');
          } catch (dbError) {
            console.debug('Database disconnect error during logout:', dbError);
            // Continue with logout even if disconnect fails
          }
        }

        // Step 2: Clear frontend state
        elements.serverConnected = false;
        if (elements.databasesDropdown) {
          elements.databasesDropdown.innerHTML = '';
        }
        if (typeof window.updateConnectionStatus === 'function') {
          window.updateConnectionStatus(false);
        }

        // Step 3: Clear localStorage flags
        try {
          localStorage.removeItem('dbDisconnectedAt');
        } catch (e) {
          console.debug('localStorage clear error:', e);
        }

        // Step 4: Import Firebase auth dynamically
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js");
        const { getAuth, signOut } = await import("https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js");

        // Firebase configuration
        const firebaseConfig = {
          apiKey: "AIzaSyCzmz7H7OgKXQplbg1UNMuQ2B4QMwU_FT4",
          authDomain: "myproject-5216c.firebaseapp.com",
          projectId: "myproject-5216c",
          storageBucket: "myproject-5216c.appspot.com",
          messagingSenderId: "89584435724",
          appId: "1:89584435724:web:0a5d357fc2c76e554b6429",
        };

        // Step 5: Initialize Firebase and sign out
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        await signOut(auth);

        // Step 6: Clear session on backend (this should also clean up DB connections)
        await fetch("/logout", { method: "POST" });

        // Step 7: Redirect to auth page
        window.location.replace("/auth");
      } catch (error) {
        console.error("Logout error:", error);
        showNotification(elements, "Failed to logout. Please try again.", "error");
      }
    });
  }
};

// Helper function to setup input handling
const setupInputHandling = (elements) => {
  // Auto resize input area
  elements.adjustTextInputHeight = () => {
    const ti = elements.textInput;
    ti.style.height = "auto";
    ti.style.height = `${ti.scrollHeight}px`;
    ti.style.overflowY = ti.scrollHeight > 192 ? "auto" : "hidden";
  };

  elements.textInput.addEventListener("input", elements.adjustTextInputHeight);

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
};

// Helper function to setup SQL query execution
const setupSqlQueryExecution = (elements) => {
  elements.executeQueryButton.addEventListener("click", async () => {
    const sqlQ = elements.sqlEditor.getValue();
    if (!sqlQ) return;

    const orig = elements.setButtonLoading ? elements.setButtonLoading(elements.executeQueryButton) : null;

    try {
      await executeSqlString(elements, sqlQ);
    } finally {
      if (elements.clearButtonLoading) {
        elements.clearButtonLoading(elements.executeQueryButton, orig);
      } else {
        elements.executeQueryButton.disabled = false;
        if (orig !== null) elements.executeQueryButton.innerHTML = orig;
      }
    }
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
};

// Bind all UI interactions and app events
export function initializeEventBindings(elements) {
  elements.html = document.documentElement;

  // Enhanced theme toggle with better UX
  elements.themeToggle.addEventListener("change", () =>
    handleThemeToggleChange(elements)
  );

  // Listen for theme changes from other sources
  window.addEventListener("themeChanged", (e) =>
    handleThemeChanged(elements, e)
  );

  // Update sidebar previews in real-time when a new prompt is sent
  window.addEventListener("conversationPreviewUpdated", (e) =>
    handleConversationPreviewUpdate(elements, e)
  );

  // Initialize theme toggle state on page load
  if (elements.themeToggle) {
    elements.themeToggle.checked = ThemeManager.getCurrentTheme() === "dark";
  }

  // Setup all UI components
  setupSidebarToggle(elements);
  setupDbConnectionModal(elements);
  setupProfileMenu(elements);
  setupInputHandling(elements);
  setupSqlQueryExecution(elements);

  // Start a new conversation
  elements.newConversationBtn.addEventListener("click", async () => {
    const data = await handleApiResponse(
      fetch("/new_conversation", { method: "POST" }),
      "Failed to start new conversation",
      elements
    );

    if (data) {
      try {
        sessionStorage.setItem("conversation_id", data.conversation_id);
      } catch (error) {
        console.warn(
          "Failed to save conversation_id to sessionStorage:",
          error
        );
      }

      // Clear chat area and restore the centered AI logo (same as initial load)
      elements.chat.innerHTML = "";
      if (elements.aiLogoContainer) {
        elements.aiLogoContainer.style.display = "flex";
      }
      showNotification(elements, "New conversation started", "success");
      // Refresh conversation list to show the new conversation
      await fetchAndDisplayConversations(elements);
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
  } else if (noConversationsMessage) {
    // Handle error state
    noConversationsMessage.textContent = "Failed to load conversations";
    noConversationsMessage.style.display = "block";
  }
}

// Helper function to create delete button
const createDeleteButton = () => {
  const deleteButton = document.createElement("button");
  deleteButton.className =
    "delete-conversation-btn opacity-0 group-hover:opacity-100 ml-2 p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-all duration-200";
  deleteButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-red-600" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
    </svg>
  `;
  return deleteButton;
};

// Helper function to handle conversation deletion
const handleConversationDeletion = async (
  elements,
  conversationItem,
  conversationId
) => {
  try {
    const response = await fetch(`/delete_conversation/${conversationId}`, {
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

      handleCurrentConversationDeletion(elements, conversationId);
      handleEmptyConversationList();
    } else {
      showNotification(elements, "Failed to delete conversation", "error");
    }
  } catch (error) {
    console.error("Error deleting conversation:", error);
    showNotification(elements, "Error deleting conversation", "error");
  }
};

// Helper function to handle current conversation deletion
const handleCurrentConversationDeletion = (elements, deletedConversationId) => {
  let currentConv = null;
  try {
    currentConv = sessionStorage.getItem("conversation_id");
  } catch (error) {
    console.warn("Failed to read conversation_id from sessionStorage:", error);
  }

  if (currentConv && String(currentConv) === String(deletedConversationId)) {
    try {
      sessionStorage.removeItem("conversation_id");
    } catch (error) {
      console.warn(
        "Failed to remove conversation_id from sessionStorage:",
        error
      );
    }

    const chatEl = elements?.chat;
    const logoEl = elements?.aiLogoContainer;

    if (chatEl) {
      animateChatClear(chatEl, logoEl);
    } else if (logoEl) {
      logoEl.style.display = "flex";
    }
  }
};

// Helper function to animate chat clearing
const animateChatClear = (chatEl, logoEl) => {
  // If chat is already empty, just ensure logo is visible
  if (!chatEl.hasChildNodes()) {
    chatEl.innerHTML = "";
    logoEl?.style && (logoEl.style.display = "flex");
    return;
  }

  // Apply inline transition (no changes to Tailwind files)
  chatEl.style.transition = "opacity 220ms ease, transform 220ms ease";
  // Ensure starting state
  chatEl.style.opacity = chatEl.style.opacity || "1";
  chatEl.style.transform = chatEl.style.transform || "translateY(0)";

  // Trigger the fade+lift
  requestAnimationFrame(() => {
    chatEl.style.opacity = "0";
    chatEl.style.transform = "translateY(-8px)";
  });

  // After transition, clear content and reset styles
  setTimeout(() => {
    chatEl.innerHTML = "";
    chatEl.style.transition = "";
    chatEl.style.opacity = "";
    chatEl.style.transform = "";
    logoEl?.style && (logoEl.style.display = "flex");
  }, 260);
};

// Helper function to handle empty conversation list
const handleEmptyConversationList = () => {
  const conversationListContainer =
    document.getElementById("conversation-list");
  if (conversationListContainer?.children.length === 0) {
    const emptyMessage = document.createElement("div");
    emptyMessage.id = "no-conversations-message";
    emptyMessage.className =
      "text-neutral-500 dark:text-neutral-400 text-center py-8";
    emptyMessage.textContent = "No conversations yet";
    conversationListContainer.appendChild(emptyMessage);
  }
};

// Create conversation entries for the sidebar
function populateConversations(elements, conversations) {
  const conversationListContainer =
    elements.conversationList || document.getElementById("conversation-list");
  const noConversationsMessage = document.getElementById(
    "no-conversations-message"
  );

  // Clear existing content
  conversationListContainer.innerHTML = "";

  if (!conversations?.length) {
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
    const conversationItem = createConversationItem(elements, conv);
    frag.appendChild(conversationItem);
  });

  conversationListContainer.appendChild(frag);
}

// Helper function to create a conversation item
const createConversationItem = (elements, conv) => {
  const conversationItem = document.createElement("div");
  // Attach conversation id so we can update this item later without refetching
  conversationItem.setAttribute("data-conversation-id", conv.id);
  conversationItem.className =
    "conversation-item cursor-pointer block px-4 py-3 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-600 rounded-lg border border-transparent hover:border-neutral-200 dark:hover:border-neutral-500 transition-all duration-200 w-full max-w-full group";

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
  const deleteButton = createDeleteButton();

  // Delete button click handler
  deleteButton.addEventListener("click", async (ev) => {
    ev.stopPropagation(); // Prevent conversation from being loaded
    await handleConversationDeletion(elements, conversationItem, conv.id);
  });

  // Add content and delete button to wrapper
  wrapper.appendChild(contentDiv);
  wrapper.appendChild(deleteButton);
  conversationItem.appendChild(wrapper);

  // Conversation click handler (attach to the whole item so clicks anywhere
  // on the row -- not only the text area -- trigger loading)
  conversationItem.addEventListener("click", (ev) => {
    ev.preventDefault();
    // Ignore clicks that originated from the delete button
    if (ev.target.closest('.delete-conversation-btn')) return;
    loadConversation(elements, conv.id);
    highlightSelectedConversation(conversationItem);
  });

  return conversationItem;
};

// Helper function to highlight selected conversation
const highlightSelectedConversation = (selectedItem) => {
  document.querySelectorAll(".conversation-item").forEach((item) => {
    item.classList.remove(
      "bg-blue-50",
      "dark:bg-blue-900",
      "border-blue-200",
      "dark:border-blue-700"
    );
  });
  selectedItem.classList.add(
    "bg-blue-50",
    "dark:bg-blue-900",
    "border-blue-200",
    "dark:border-blue-700"
  );
};

// Helper function to update conversation preview header
const updateConversationHeader = (contentDiv, preview) => {
  const headerEl = contentDiv.querySelector(".font-medium");
  const headerText = headerEl?.textContent?.trim() || "";

  if (!headerEl || headerText === "" || headerText === "New Conversation") {
    if (headerEl) {
      headerEl.textContent = preview || "New Conversation";
    } else {
      const h = document.createElement("div");
      h.className =
        "font-medium text-neutral-900 dark:text-neutral-100 truncate w-full max-w-full";
      h.textContent = preview || "New Conversation";
      contentDiv.prepend(h);
    }
  }
};

// Helper function to update conversation date
const updateConversationDate = (contentDiv, formattedDate) => {
  const dateEl = contentDiv.querySelector(".text-xs");

  if (dateEl) {
    dateEl.textContent = formattedDate;
  } else {
    const d = document.createElement("div");
    d.className = "text-xs text-neutral-500 dark:text-neutral-400";
    d.textContent = formattedDate;
    contentDiv.appendChild(d);
  }
};

// Helper function to animate conversation item
const animateConversationItem = (item, isNew = false) => {
  try {
    if (item.animate) {
      if (isNew) {
        // Slide + fade-in for new items
        item.animate(
          [
            { opacity: 0, transform: "translateX(-8px)" },
            { opacity: 1, transform: "translateX(0)" },
          ],
          { duration: 320, easing: "cubic-bezier(0.2, 0, 0, 1)" }
        );
      }

      // Subtle highlight (runs in parallel)
      item.animate(
        [
          { backgroundColor: "rgba(250, 204, 21, 0.16)" },
          { backgroundColor: "transparent" },
        ],
        { duration: 420, easing: "ease-out" }
      );
    } else {
      // Fallback: inline transition
      if (isNew) {
        item.style.opacity = "0";
        item.style.transform = "translateX(-8px)";
        item.style.transition =
          "opacity 320ms cubic-bezier(0.2,0,0,1), transform 320ms cubic-bezier(0.2,0,0,1)";
        requestAnimationFrame(() => {
          item.style.opacity = "1";
          item.style.transform = "translateX(0)";
        });
        setTimeout(() => {
          item.style.transition = "";
          item.style.transform = "";
          item.style.opacity = "";
        }, 360);
      }

      item.style.transition = "background-color 420ms ease-out";
      item.style.backgroundColor = "rgba(250, 204, 21, 0.16)";
      setTimeout(() => {
        item.style.backgroundColor = "";
        item.style.transition = "";
      }, 440);
    }
  } catch (error) {
    console.warn("Animation failed:", error);
  }
};

// Upsert (update or insert) a conversation preview in the sidebar
function upsertConversationPreview(elements, conversationId, preview) {
  const conversationListContainer =
    elements.conversationList || document.getElementById("conversation-list");
  if (!conversationListContainer) return;

  // If there's a placeholder saying "No conversations yet", remove it when we upsert a real conversation
  const placeholder = conversationListContainer.querySelector(
    "#no-conversations-message"
  );
  placeholder?.remove();

  // Try to find existing item
  const existing = conversationListContainer.querySelector(
    `[data-conversation-id="${conversationId}"]`
  );
  const now = new Date();
  const formattedDate = now.toLocaleDateString();

  if (existing) {
    updateExistingConversation(
      elements,
      existing,
      conversationId,
      preview,
      formattedDate
    );
  } else {
    createNewConversationPreview(
      conversationListContainer,
      conversationId,
      preview,
      formattedDate
    );
  }
}

// Helper function to update existing conversation
const updateExistingConversation = (
  elements,
  existing,
  conversationId,
  preview,
  formattedDate
) => {
  const contentDiv =
    existing.querySelector(".flex.flex-col") || existing.querySelector("div");
  if (!contentDiv) return;

  updateConversationHeader(contentDiv, preview);
  updateConversationDate(contentDiv, formattedDate);

  // Check if this is the currently open conversation
  let currentConv = null;
  try {
    currentConv = sessionStorage.getItem("conversation_id");
  } catch (error) {
    console.warn("Failed to read conversation_id from sessionStorage:", error);
  }

  if (!currentConv || String(currentConv) !== String(conversationId)) {
    // Move to top for recency and animate
    const conversationListContainer = existing.parentElement;
    conversationListContainer?.prepend(existing);
    animateConversationItem(existing, false);
  }
};

// Helper function to create new conversation preview
const createNewConversationPreview = (
  conversationListContainer,
  conversationId,
  preview,
  formattedDate
) => {
  const conversationItem = document.createElement("div");
  conversationItem.setAttribute("data-conversation-id", conversationId);
  conversationItem.className =
    "conversation-item cursor-pointer block px-4 py-3 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-600 rounded-lg border border-transparent hover:border-neutral-200 dark:hover:border-neutral-500 transition-all duration-200 w-full max-w-full group";

  const wrapper = document.createElement("div");
  wrapper.className = "flex justify-between items-start";

  const contentDiv = document.createElement("div");
  contentDiv.className =
    "flex flex-col gap-1 flex-grow min-w-0 w-full max-w-full";
  contentDiv.innerHTML = `
    <div class="font-medium text-neutral-900 dark:text-neutral-100 truncate w-full max-w-full">
      ${preview || "New Conversation"}
    </div>
    <div class="text-xs text-neutral-500 dark:text-neutral-400">
      ${formattedDate}
    </div>
  `;

  // Add a minimal delete button to match UI (no handler here — user can refresh)
  const deleteButton = createDeleteButton();

  wrapper.appendChild(contentDiv);
  wrapper.appendChild(deleteButton);
  conversationItem.appendChild(wrapper);

  // Insert at top
  conversationListContainer.prepend(conversationItem);
  animateConversationItem(conversationItem, true);
  // Make the whole conversation item clickable (newly created previews)
  conversationItem.addEventListener('click', (ev) => {
    ev.preventDefault();
    if (ev.target.closest('.delete-conversation-btn')) return;
    loadConversation(elements, conversationId);
    highlightSelectedConversation(conversationItem);
  });
};

// Load a specific conversation thread
async function loadConversation(elements, conversationId) {
  const data = await handleApiResponse(
    fetch(`/get_conversation/${conversationId}`),
    "Failed to load conversation",
    elements
  );

  if (data) {
    try {
      sessionStorage.setItem("conversation_id", conversationId);
    } catch (error) {
      console.warn("Failed to save conversation_id to sessionStorage:", error);
    }

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
        // use getBoundingClientRect() (a function call) to avoid unused-expression lint errors
        textDiv.getBoundingClientRect();

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

// SQL Editor functionality setup
const setupSqlEditor = () => {
  const sqlEditorToggle = document.getElementById("sql-editor-toggle");
  const sqlEditorPopup = document.getElementById("sql-editor-popup");
  const sqlEditorClose = document.getElementById("sql-editor-close");

  if (!sqlEditorToggle || !sqlEditorPopup || !sqlEditorClose) return;

  // SQL Editor state management
  const sqlEditorState = { isOpen: false };

  // Ensure editor starts closed (fix for auto-opening issue)
  sqlEditorPopup.classList.add("translate-x-full");
  sqlEditorPopup.classList.remove("translate-x-0");

  const openEditor = () => {
    sqlEditorPopup.classList.remove("translate-x-full");
    sqlEditorPopup.classList.add("translate-x-0");
    sqlEditorPopup.classList.remove(
      "opacity-0",
      "pointer-events-none",
      "invisible"
    );
    sqlEditorPopup.setAttribute("aria-hidden", "false");
    sqlEditorState.isOpen = true;

    // Focus on editor if CodeMirror is available
    setTimeout(() => {
      window.sqlEditor?.focus?.();
    }, 300);
  };

  const closeEditor = () => {
    // Hide the popup completely and reset all styles
    sqlEditorPopup.classList.remove("translate-x-0");
    sqlEditorPopup.classList.add("translate-x-full");
    // also make it fully transparent and non-interactive to avoid any visible remnants
    sqlEditorPopup.classList.add(
      "opacity-0",
      "pointer-events-none",
      "invisible"
    );
    sqlEditorPopup.setAttribute("aria-hidden", "true");
    sqlEditorState.isOpen = false;
    sqlEditorPopup.style.height = "";
    sqlEditorPopup.classList.remove("min-h-0");

    // Show content area for next open
    const contentArea = sqlEditorPopup.querySelector(".sql-editor-content");
    if (contentArea) {
      contentArea.style.display = "flex";
    }
  };

  // Event listeners
  sqlEditorToggle.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openEditor();
  });

  sqlEditorClose.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeEditor();
  });

  // Close editor when clicking outside
  document.addEventListener("click", (e) => {
    if (
      sqlEditorState.isOpen &&
      !sqlEditorPopup.contains(e.target) &&
      !sqlEditorToggle.contains(e.target)
    ) {
      closeEditor();
    }
  });

  // Prevent clicks inside the editor from closing it
  sqlEditorPopup.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
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
};

// Initialize SQL Editor on page load
setupSqlEditor();
