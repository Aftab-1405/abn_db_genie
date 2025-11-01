// Dynamic mermaid-helper.js diagram renderer
let mermaidInitialized = false;

export function loadMermaid(callback) {
  if (window.mermaid && mermaidInitialized) {
    callback();
    return;
  }

  if (window.mermaid) {
    initializeMermaid(callback);
    return;
  }

  const script = document.createElement("script");
  // Use a modern mermaid release to ensure advanced diagram support
  script.src =
    "https://cdn.jsdelivr.net/npm/mermaid@11.6.0/dist/mermaid.min.js";
  script.onload = () => initializeMermaid(callback);
  document.head.appendChild(script);
}

function initializeMermaid(callback) {
  if (!mermaidInitialized) {
    window.mermaid.initialize({
      startOnLoad: false,
      theme: document.documentElement.classList.contains("dark")
        ? "dark"
        : "default",
      fontFamily: "system-ui, -apple-system, sans-serif",
      themeVariables: {
        dark: {
          background: "#000000",
          primaryColor: "#000000",
          primaryBorderColor: "#374151",
          primaryTextColor: "#ffffff",
          textColor: "#ffffff",
          lineColor: "#4b5563",
          mainBkg: "#000000",
          secondaryColor: "#374151",
          tertiaryColor: "#000000",
        },
      },
    });
    mermaidInitialized = true;
  }
  callback();
}

export function renderMermaid(container, code, onSuccess, onError) {
  loadMermaid(() => {
    // Use slice instead of deprecated substr(start, length)
    const id = "mermaid-" + Math.random().toString(36).slice(2, 11);
    const div = document.createElement("div");
    div.className = "mermaid";
    div.id = id;
    div.textContent = code;

    try {
      // First parse to validate the diagram
      window.mermaid.parse(code);

      // Clear container and add the diagram
      container.innerHTML = "";
      container.appendChild(div);

      // Render the diagram with a small delay to ensure DOM is ready
      setTimeout(() => {
        window.mermaid
          .init(undefined, "#" + id)
          .then(() => {
            div.classList.remove("opacity-0");
            if (onSuccess) onSuccess();
          })
          .catch((err) => {
            console.error("Mermaid rendering error:", err);
            if (onError) onError(err.message || "Rendering failed");
          });
      }, 50);
    } catch (err) {
      console.error("Mermaid parsing error:", err);
      if (onError) onError(err.message || "Invalid diagram syntax");
    }
  });
}
