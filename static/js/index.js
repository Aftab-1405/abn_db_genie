// static/js/index.js

// 1) Import the event‐binder, database fetcher, and the executor from sql.js
import { initializeApp, initializeEventBindings } from "./events.js";
import { fetchDatabases, executeSqlString } from "./sql.js";

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

  newConversationBtn: document.getElementById("new-conversation"),
  seeConversationsBtn: document.getElementById("see-conversations"),
  conversationsModal: document.getElementById("conversations-modal"),
  conversationList: document.getElementById("conversation-list"),

  mainContent: document.getElementById("main-content"),
  mediaQuery: window.matchMedia("(min-width: 768px)"),

  chat: document.getElementById("chat"),

  profileBtn: document.getElementById("profile-btn"),
  profileMenu: document.getElementById("profile-menu"),
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

  // 4) Shared spinner HTML (used by both “Connect” and “Execute” buttons)
  LOADING_SPINNER_HTML: `
    <div class="flex items-center justify-center">
      <svg class="animate-spin h-4 w-4 md:h-5 md:w-5 mr-2 text-white"
           xmlns="http://www.w3.org/2000/svg"
           fill="none"
           viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0
                 C5.373 0 0 5.373 0 12h4zm2 5.291
                 A7.963 7.963 0 014 12H0
                 c0 3.042 1.135 5.824 3 7.938
                 l3-2.647z"></path>
      </svg>
    </div>
  `,

  // 5) *** This is the critical line ***
  //    Expose `executeSqlString` so that `ui.js` can call it when “Run” is clicked
  executeSqlString: executeSqlString,
};

// 6) This function sets up CodeMirror on #sql-editor
function initializeCodeMirror() {
  elements.sqlEditor = CodeMirror(elements.sqlEditorContainer, {
    mode: "text/x-sql",
    theme: "default",
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

  // d)
  initializeApp(elements);
});
