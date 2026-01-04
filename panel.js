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
    const userInput = document.getElementById('llm-panel-prompt').value;
    if (!userInput) return;
    const model = 'deepseek-r1:1.5b';
    // Optionally embed page data into the prompt (for future use)
    // const html = getPageHTML();
    // const css = getPageCSS();
    // const js = getPageJS();
    // let content = userInput + `\n\nHTML:\n${html}\n\nCSS:\n${css}\n\nJS:\n${js}`;
    // For now, just use userInput as content
    const requestBody = {
      model,
      messages: [
        {
          role: 'user',
          content: userInput
        }
      ],
      stream: false,
      options: {
        think: true
      }
    };
    const responseDiv = document.getElementById('llm-panel-response');
    responseDiv.textContent = '⏳ Waiting for response...';
    chrome.runtime.sendMessage({ action: 'ollamaChat', body: requestBody }, (result) => {
      if (chrome.runtime.lastError) {
        responseDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
        return;
      }
      if (result && result.response) {
        responseDiv.textContent = result.response;
      } else if (result && result.error) {
        responseDiv.textContent = 'Error: ' + result.error;
      } else {
        responseDiv.textContent = 'Unknown error or no response.';
      }
    });
  };
}
