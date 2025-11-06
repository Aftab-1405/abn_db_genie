// static/js/index.js

// 1) Import the event‐binder, database fetcher, and the executor from sql.js
import { initializeApp, initializeEventBindings } from "./events.js";
import { executeSqlString } from "./sql.js";

// 2) Build the `elements` object with all the needed DOM references
export const elements = {
  html: document.querySelector("html"),
  themeToggle: document.getElementById("theme-toggle"),

  sidebar: document.getElementById("sidebar"),
  toggleButton: document.getElementById("sidebar-toggle"),
  sidebarCloseButton: document.getElementById("sidebar-close"),

  databasesDropdown: document.getElementById("databases"),
  connectDbButton: document.getElementById("connect-db"),
  sqlEditorContainer: document.getElementById("sql-editor"),
  executeQueryButton: document.getElementById("execute-query"),
  sqlEditorToggle: document.getElementById("sql-editor-toggle"),

  newConversationBtn: document.getElementById("new-conversation"),
  seeConversationsBtn: document.getElementById("see-conversations"),
  conversationsModal: document.getElementById("conversations-modal"),
  conversationList: document.getElementById("conversation-list"),

  mainContent: document.getElementById("main-content"),
  mediaQuery: window.matchMedia("(min-width: 768px)"),

  chat: document.getElementById("chat"),

  profileBtn: document.getElementById("profile-btn"),
  profileMenu: document.getElementById("profile-menu"),
  logoutBtn: document.getElementById("logout-btn"),
  settingsModal: document.getElementById("settings-modal"),
  settingsModalClose: document.getElementById("settings-modal-close"),

  aiLogoContainer: document.getElementById("ai-logo-container"),
  textInput: document.getElementById("text-input"),
  sendIcon: document.getElementById("send-icon"),

  queryResultModal: document.getElementById("query-result-modal"),
  closeBtn: document.getElementById("query-result-modal-close-button"),
  queryResultTable: document.getElementById("query-result"),

  notificationArea: document.getElementById("notification-area"),

  // 3) We will populate this with the CodeMirror instance shortly
  sqlEditor: null,

  // 4) Helper functions for button loading states
  setButtonLoading: function(button) {
    if (!button) return null;
    button.disabled = true;
    button.classList.add('button-loading');
    return button.innerHTML; // Return original HTML for restoration
  },

  clearButtonLoading: function(button, originalHTML) {
    if (!button) return;
    button.disabled = false;
    button.classList.remove('button-loading');
    if (originalHTML) {
      button.innerHTML = originalHTML;
    }
  },

  // 5) *** This is the critical line ***
  //    Expose `executeSqlString` so that `ui.js` can call it when "Run" is clicked
  executeSqlString: executeSqlString,
};

// 6) This function sets up CodeMirror on #sql-editor
function initializeCodeMirror() {
  elements.sqlEditor = CodeMirror(elements.sqlEditorContainer, {
    mode: "text/x-sql",
    theme: "default", // Use default theme, custom CSS will handle theming
    lineNumbers: true,
    autoCloseBrackets: true,
    styleActiveLine: true,
    matchBrackets: true,
    value: "", // No default text
    viewportMargin: Infinity,
    lineWrapping: true,
  });

  // Add placeholder to CodeMirror
  const cm = elements.sqlEditor;
  const placeholder = "Enter SQL query...";
  const cmInput = cm.getInputField();
  cmInput.setAttribute("placeholder", placeholder);

  // Make the editor fill 100% height of its container
  function adjustEditorSize() {
    const cmEl = document.querySelector("#sql-editor .CodeMirror");
    if (cmEl) {
      cmEl.style.height = "100%";
    }
  }

  elements.sqlEditor.on("change", adjustEditorSize);
  window.addEventListener("resize", adjustEditorSize);
  adjustEditorSize();
}

// 7) When DOM is ready, do three things:
//    a) initialize CodeMirror
//    b) preload databases into the <select>
//    c) bind all event listeners
document.addEventListener("DOMContentLoaded", () => {
  // a)
  initializeCodeMirror();

  // b) Clear databases dropdown on load
  elements.databasesDropdown.innerHTML = "";

  // c)
  initializeEventBindings(elements);
  
  // On load, try to fetch databases and restore connection state if server already connected
  (async () => {
    try {
      // Try to get connection status from backend
      const resp = await fetch('/db_status');
      if (resp.ok) {
        const status = await resp.json();
        if (status && status.connected) {
          elements.serverConnected = true;

          // Get current database name if any
          const currentDb = status.current_database || status.database || '';

          // Populate databases dropdown if returned
          if (Array.isArray(status.databases) && status.databases.length > 0) {
            const frag = document.createDocumentFragment();

            // Add placeholder option first
            const placeholderOpt = document.createElement('option');
            placeholderOpt.value = '';
            placeholderOpt.textContent = 'Select database...';
            frag.appendChild(placeholderOpt);

            status.databases.forEach((db) => {
              const opt = document.createElement('option');
              opt.value = db;
              opt.textContent = db;
              // Pre-select the current database if it matches
              if (currentDb && db === currentDb) {
                opt.selected = true;
              }
              frag.appendChild(opt);
            });
            elements.databasesDropdown.appendChild(frag);
          }

          // Update UI state with current database if connected to specific one
          if (typeof window.updateConnectionStatus === 'function') {
            window.updateConnectionStatus(true, currentDb);
          }
          return; // Successfully restored state
        }
      }

      // If /db_status fails or shows not connected, try fallback with /get_databases
      try {
        const dbResp = await fetch('/get_databases');
        if (dbResp.ok) {
          const dbData = await dbResp.json();
          if (dbData.status === 'success' && Array.isArray(dbData.databases) && dbData.databases.length > 0) {
            // We have databases, so connection exists
            elements.serverConnected = true;

            const frag = document.createDocumentFragment();

            // Add placeholder option first
            const placeholderOpt = document.createElement('option');
            placeholderOpt.value = '';
            placeholderOpt.textContent = 'Select database...';
            frag.appendChild(placeholderOpt);

            dbData.databases.forEach((db) => {
              const opt = document.createElement('option');
              opt.value = db;
              opt.textContent = db;
              frag.appendChild(opt);
            });
            elements.databasesDropdown.appendChild(frag);

            // Update UI - server connected but no specific database selected
            if (typeof window.updateConnectionStatus === 'function') {
              window.updateConnectionStatus(true);
            }
            return;
          }
        }
      } catch (fallbackError) {
        console.debug('Fallback database fetch failed:', fallbackError);
      }

      // If both methods fail, we're not connected
      elements.serverConnected = false;
      if (typeof window.updateConnectionStatus === 'function') {
        window.updateConnectionStatus(false);
      }
    } catch (e) {
      console.debug('Auto DB status check failed on load:', e);
      elements.serverConnected = false;
      if (typeof window.updateConnectionStatus === 'function') {
        window.updateConnectionStatus(false);
      }
    }
  })();

  // Cross-tab sync: react to disconnects from other tabs/windows
  window.addEventListener('storage', (e) => {
    try {
      if (e.key === 'dbDisconnectedAt') {
        elements.serverConnected = false;
        elements.databasesDropdown.innerHTML = '';
        // Update connection status UI
        if (typeof window.updateConnectionStatus === 'function') {
          window.updateConnectionStatus(false);
        }
      }
    } catch (err) {
      console.debug('Storage event handler error:', err);
    }
  });

  // d) Initialize the application
  initializeApp(elements);
});
