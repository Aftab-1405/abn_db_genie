// Mermaid.js CDN loader for dynamic diagram rendering
export function loadMermaid(callback) {
  if (window.mermaid) {
    callback();
    return;
  }
  const script = document.createElement("script");
  script.src =
    "https://cdn.jsdelivr.net/npm/mermaid@10.9.0/dist/mermaid.min.js";
  script.onload = () => callback();
  document.head.appendChild(script);
}

export function renderMermaid(container, code, onSuccess, onError) {
  loadMermaid(() => {
    window.mermaid.initialize({ startOnLoad: false });
    const id = "mermaid-" + Math.random().toString(36).substr(2, 9);
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

      // Render the diagram
      window.mermaid
        .init(undefined, "#" + id)
        .then(() => {
          if (onSuccess) onSuccess();
        })
        .catch((err) => {
          if (onError) onError(err.message || "Rendering failed");
        });
    } catch (err) {
      if (onError) onError(err.message || "Invalid diagram syntax");
    }
  });
}
