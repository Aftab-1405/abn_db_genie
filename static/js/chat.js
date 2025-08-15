// static/js/chat.js
import {
  addMessage,
  addGenieResponseWithTypingEffect,
  appendGenieStreamChunk,
} from "./components/message-handler.js";
import { wrapCodeBlocks } from "./components/code-blocks.js";
import { markdownService } from "./services/markdown-service.js";

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

    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status}`);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullResponse = "";
    let genieMessageElements = null; // To hold the elements for Genie's response

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      fullResponse += chunk;

      if (!genieMessageElements) {
        // Create the initial message element for Genie's response
        genieMessageElements = addMessage(elements, "", "genie");
      }
      // Append the chunk to the Genie's message element incrementally
      appendGenieStreamChunk(elements, genieMessageElements, chunk);
    }
    // After the stream is complete, process markdown and code blocks
    if (genieMessageElements) {
      const contentContainer = genieMessageElements.textDiv.querySelector(".content-wrapper");
      if (contentContainer) {
        contentContainer.innerHTML = markdownService.processFullMarkdown(fullResponse);
        wrapCodeBlocks(contentContainer, elements);
      }
    }

  } catch (error) {
    console.error("Streaming fetch error:", error);
    handleError(elements, { status: "error", message: `Network error: ${error.message}` });
  }
}

