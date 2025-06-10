// static/js/events.js

import { handleConnectDb, executeSqlString } from "./sql.js";
import {
  addMessage,
  wrapCodeBlocks,
  scrollToBottom,
  showNotification,
} from "./ui.js";
import { handleAIResponse, sendUserInput, handleError } from "./chat.js";

// —————————————————————————————————————————————————————————
// 1) initializeEventBindings: Binds all UI event listeners
// —————————————————————————————————————————————————————————
export function initializeEventBindings(elements) {
  // Make <html> available for theme toggling
  elements.html = document.documentElement;

  // —————————————————————————————————————————————————————————
  // Theme toggle (light/dark)
  // —————————————————————————————————————————————————————————
  elements.themeToggle.addEventListener("change", () => {
    const isDark = elements.html.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    elements.sqlEditor.setOption("theme", isDark ? "dracula" : "default");
  });

  // —————————————————————————————————————————————————————————
  // Sidebar toggle (mobile)
  // —————————————————————————————————————————————————————————
  const SIDEBAR_HIDDEN_CLASS = "-translate-x-full";
  const SIDEBAR_VISIBLE_CLASS = "md:ml-64";
  const toggleSidebar = () => {
    elements.sidebar.classList.toggle(SIDEBAR_HIDDEN_CLASS);
    elements.mainContent.classList.toggle(SIDEBAR_VISIBLE_CLASS);
  };
  [elements.toggleButton, elements.sidebarCloseButton].forEach((btn) => {
    if (btn) btn.addEventListener("click", toggleSidebar);
  });

  // —————————————————————————————————————————————————————————
  // Media query: ensure sidebar is visible on wide screens
  // —————————————————————————————————————————————————————————
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

  // —————————————————————————————————————————————————————————
  // Connect Database button
  // —————————————————————————————————————————————————————————
  elements.connectDbButton.addEventListener("click", () => {
    handleConnectDb(elements);
  });

  // —————————————————————————————————————————————————————————
  // New conversation button
  // —————————————————————————————————————————————————————————
  elements.newConversationBtn.addEventListener("click", async () => {
    try {
      const resp = await fetch("/new_conversation", { method: "POST" });
      const data = await resp.json();
      if (data.status === "success") {
        sessionStorage.setItem("conversation_id", data.conversation_id);
        elements.chat.innerHTML = ""; // Clear chat bubbles
        showNotification(elements, "New conversation started", "success");
      } else {
        throw new Error(`Unexpected response: ${data.status}`);
      }
    } catch {
      showNotification(elements, "Failed to start new conversation", "error");
    }
  });

  // —————————————————————————————————————————————————————————
  // “See Conversations” dropdown toggle
  // —————————————————————————————————————————————————————————
  elements.seeConversationsBtn.addEventListener("click", async (ev) => {
    ev.stopPropagation();
    const isHidden = elements.conversationList.classList.contains("hidden");
    if (isHidden) {
      await fetchAndDisplayConversations(elements);
      elements.conversationList.classList.remove("hidden");
    } else {
      elements.conversationList.classList.add("hidden");
    }
  });

  // —————————————————————————————————————————————————————————
  // Click outside conversation list → close it
  // —————————————————————————————————————————————————————————
  document.addEventListener("click", (ev) => {
    if (
      !elements.conversationList.contains(ev.target) &&
      !elements.seeConversationsBtn.contains(ev.target)
    ) {
      elements.conversationList.classList.add("hidden");
    }
  });

  // —————————————————————————————————————————————————————————
  // Profile menu toggle
  // —————————————————————————————————————————————————————————
  const toggleProfileMenu = () => {
    elements.profileMenu.classList.toggle("invisible");
    elements.profileMenu.classList.toggle("opacity-0");
    elements.profileMenu.classList.toggle("scale-95");
  };
  elements.profileBtn.addEventListener("click", toggleProfileMenu);

  // —————————————————————————————————————————————————————————
  // Open settings modal from profile menu
  // —————————————————————————————————————————————————————————
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

  // —————————————————————————————————————————————————————————
  // Close settings modal via “X”
  // —————————————————————————————————————————————————————————
  elements.settingsModalClose.addEventListener("click", () => {
    elements.settingsModal.classList.add("invisible");
  });

  // —————————————————————————————————————————————————————————
  // Click outside settings modal → close it
  // —————————————————————————————————————————————————————————
  elements.settingsModal.addEventListener("click", (ev) => {
    if (!ev.target.closest(".max-w-md")) {
      elements.settingsModal.classList.add("invisible");
    }
  });

  // —————————————————————————————————————————————————————————
  // Click outside profile menu → close it
  // —————————————————————————————————————————————————————————
  document.addEventListener("click", (ev) => {
    if (
      !elements.profileMenu.contains(ev.target) &&
      !elements.profileBtn.contains(ev.target)
    ) {
      elements.profileMenu.classList.add("invisible", "opacity-0", "scale-95");
    }
  });

  // —————————————————————————————————————————————————————————
  // Text‐input auto‐resize
  // —————————————————————————————————————————————————————————
  elements.adjustTextInputHeight = () => {
    const ti = elements.textInput;
    ti.style.height = "auto";
    ti.style.height = `${ti.scrollHeight}px`;
    ti.style.overflowY = ti.scrollHeight > 192 ? "auto" : "hidden";
  };
  elements.textInput.addEventListener("input", () => {
    elements.adjustTextInputHeight();
  });

  // —————————————————————————————————————————————————————————
  // Send icon click (or Enter key) → send user prompt to AI
  // —————————————————————————————————————————————————————————
  elements.sendIcon.addEventListener("click", () => {
    sendUserInput(elements);
  });
  elements.textInput.addEventListener("keypress", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      elements.sendIcon.click();
    }
  });

  // —————————————————————————————————————————————————————————
  // Execute SQL from CodeMirror editor
  // —————————————————————————————————————————————————————————
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

  // —————————————————————————————————————————————————————————
  // Close query result modal
  // —————————————————————————————————————————————————————————
  elements.closeBtn.addEventListener("click", () => {
    elements.queryResultModal.classList.replace("flex", "hidden");
  });
  window.addEventListener("click", (ev) => {
    if (ev.target === elements.queryResultModal) {
      elements.queryResultModal.classList.replace("flex", "hidden");
    }
  });
}

// —————————————————————————————————————————————————————————
// 2) fetchAndDisplayConversations: Fetches list and populates dropdown
// —————————————————————————————————————————————————————————
export async function fetchAndDisplayConversations(elements) {
  try {
    const resp = await fetch("/get_conversations");
    const data = await resp.json();
    if (data.status === "success") {
      populateConversations(elements, data.conversations);
    } else {
      throw new Error(`Unexpected response: ${data.status}`);
    }
  } catch {
    showNotification(elements, "Failed to fetch conversations", "error");
  }
}

function populateConversations(elements, conversations) {
  elements.conversationList.innerHTML = "";
  const frag = document.createDocumentFragment();
  conversations.forEach((conv) => {
    const a = document.createElement("a");
    a.href = "#";
    a.className =
      "block px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-600";
    const date = new Date(conv.timestamp).toLocaleDateString();
    a.textContent = `${date}: ${conv.preview}`;
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      loadConversation(elements, conv.id);
      elements.conversationList.classList.add("hidden");
    });
    frag.appendChild(a);
  });
  elements.conversationList.appendChild(frag);
}

async function loadConversation(elements, conversationId) {
  try {
    const resp = await fetch(`/get_conversation/${conversationId}`);
    const data = await resp.json();
    if (data.status === "success") {
      sessionStorage.setItem("conversation_id", conversationId);
      elements.chat.innerHTML = ""; // clear chat

      // Loop through each message in the conversation
      data.conversation.messages.forEach((msg) => {
        // 1) Add the message bubble (user or AI)
        addMessage(elements, msg.content, msg.sender);

        // 2) Immediately wrap any code blocks in that bubble with Copy/Run
        const lastWrapper = elements.chat.lastElementChild;
        if (lastWrapper) {
          const textDiv = lastWrapper.querySelector(
            `.${msg.sender}-message-text`
          );
          if (textDiv) {
            wrapCodeBlocks(textDiv, elements);
          }
        }
      });

      // 3) Scroll to bottom after loading all messages
      scrollToBottom(elements);
    }
  } catch {
    // Silently fail (optional: show a notification)
  }
}
