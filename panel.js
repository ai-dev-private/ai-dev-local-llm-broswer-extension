// NOTE: If the panel UI grows in complexity, consider moving it to a dedicated panel.html file for easier maintenance and scalability.
// Handles the floating LLM panel injected into the page

export function createLLMPanel({ getPageHTML, getPageCSS, getPageJS }) {
  let panelDiv = document.getElementById('llm-extension-panel');
  if (panelDiv) {
    panelDiv.remove();
    return;
  }

  // Inject panel.css if not already present
  if (!document.getElementById('llm-panel-style')) {
    const link = document.createElement('link');
    link.id = 'llm-panel-style';
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = chrome.runtime.getURL('panel.css');
    document.head.appendChild(link);
  }

  panelDiv = document.createElement('div');
  panelDiv.id = 'llm-extension-panel';
  panelDiv.innerHTML = `
    <div class="llm-panel-header">
      <span style="font-weight:bold;">LLM Panel</span>
      <button id="llm-panel-close">✖</button>
    </div>
    <textarea id="llm-panel-prompt"></textarea>
    <button id="llm-panel-send">Send</button>
    <div id="llm-panel-response"></div>
  `;
  document.body.appendChild(panelDiv);
  document.getElementById('llm-panel-close').onclick = () => {
    panelDiv.remove();
  };
  document.getElementById('llm-panel-send').onclick = async () => {
    const prompt = document.getElementById('llm-panel-prompt').value;
    if (!prompt) return;
    // Get OLLAMA endpoint from extension storage
    chrome.storage.sync.get(['ollamaEndpoint'], async (result) => {
      const endpoint = result.ollamaEndpoint || 'http://localhost:11434';
      // Extract page data
      const html = getPageHTML();
      const css = getPageCSS();
      const js = getPageJS();
      const body = { prompt, html, css, js };
      const responseDiv = document.getElementById('llm-panel-response');
      responseDiv.textContent = '⏳ Waiting for response...';
      try {
        const res = await fetch(endpoint + '/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const result = await res.json();
        responseDiv.textContent = result.response || JSON.stringify(result);
      } catch (e) {
        responseDiv.textContent = 'Error communicating with OLLAMA.';
      }
    });
  };
}
