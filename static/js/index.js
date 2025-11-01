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
      const resp = await fetch('/db_status');
      if (resp.ok) {
        const status = await resp.json();
        if (status && status.connected) {
          elements.serverConnected = true;
          // Populate databases dropdown if returned
          if (Array.isArray(status.databases) && status.databases.length > 0) {
            const frag = document.createDocumentFragment();
            status.databases.forEach((db) => {
              const opt = document.createElement('option');
              opt.value = db;
              opt.textContent = db;
              frag.appendChild(opt);
            });
            elements.databasesDropdown.appendChild(frag);
          } else {
            // Fallback: call fetchDatabases to attempt to load databases
            try {
              await fetchDatabases(elements);
            } catch (e) {
              console.debug('fetchDatabases fallback failed:', e);
            }
          }

          // Show disconnect button if present
          const disconnectBtn = document.getElementById('disconnect-db');
          if (disconnectBtn) disconnectBtn.classList.remove('hidden');
        } else {
          elements.serverConnected = false;
        }
      } else {
        elements.serverConnected = false;
      }
    } catch (e) {
      console.debug('Auto DB status check failed on load:', e);
      elements.serverConnected = false;
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
