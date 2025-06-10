// static/js/chat.js
import {
  addMessage,
  addGenieResponseWithTypingEffect,
} from "./components/message-handler.js";

// —————————————————————————————————————————————————————————
// 1) handleAIResponse: Called when server returns { status, response }
// —————————————————————————————————————————————————————————
export function handleAIResponse(elements, data) {
  if (data.status === "success") {
    addGenieResponseWithTypingEffect(elements, data.response);
  } else {
    handleError(elements, data);
  }
}

// —————————————————————————————————————————————————————————
// 2) handleError: Convert server error into a friendly AI message
// —————————————————————————————————————————————————————————
export function handleError(elements, data) {
  const errorMessages = {
    404: "The requested resource was not found.",
    500: "Internal server error. Please try again later.",
    timeout:
      "The request timed out. Please check your internet connection and try again.",
    default:
      "DB-Genie cannot respond to your query at the moment. Please try again later. 😊",
  };

  const code = data.errorCode || data.message;
  const friendly = errorMessages[code] || errorMessages.default;
  addGenieResponseWithTypingEffect(elements, friendly);
}

// —————————————————————————————————————————————————————————
// 3) sendUserInput: Called when user clicks "Send" or presses Enter
// —————————————————————————————————————————————————————————
export async function sendUserInput(elements) {
  const prompt = elements.textInput.value;
  const convId = sessionStorage.getItem("conversation_id");

  if (!prompt) return;

  // 1) Show user bubble immediately with enhanced animation
  addMessage(elements, prompt, "user");
  elements.textInput.value = "";
  elements.adjustTextInputHeight();

  // 2) POST to backend
  try {
    const resp = await fetch("/pass_userinput_to_gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, conversation_id: convId }),
    });

    if (!resp.ok) throw new Error("Network response was not ok.");

    const data = await resp.json();
    handleAIResponse(elements, data);
  } catch {
    handleError(elements, { status: "error", message: "Network error." });
  }
}

