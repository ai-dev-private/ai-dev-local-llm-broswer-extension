// Content script: Extracts DOM, CSS, and JS from the current page

// Function to get the HTML content
function getPageHTML() {
  // Clone the DOM and remove the panel before extracting HTML
  const clone = document.documentElement.cloneNode(true);
  const panel = clone.querySelector('.llm-extension-panel');
  if (panel) panel.remove();
  return clone.outerHTML;
}

// Function to get all inline and external CSS (basic version)
function getPageCSS() {
  let styles = '';
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        styles += rule.cssText + '\n';
      }
    } catch (e) {
      // Ignore CORS-restricted stylesheets
    }
  }
  return styles;
}

// Function to get all inline scripts (basic version)
function getPageJS() {
  let scripts = '';
  document.querySelectorAll('script').forEach(script => {
    if (script.textContent) {
      scripts += script.textContent + '\n';
    }
  });
  return scripts;
}


// Panel logic (moved from panel.js for compatibility)
function createLLMPanel({ getPageHTML, getPageCSS, getPageJS }) {
  console.log('[content.js] createLLMPanel called');
  let panelDiv = document.getElementById('llm-extension-panel');
  if (panelDiv) {
    console.log('[content.js] Panel already exists, removing it');
    panelDiv.remove();
    return;
  }


  panelDiv = document.createElement('div');
  panelDiv.id = 'llm-extension-panel';
  panelDiv.className = 'llm-extension-panel';
  // IMPORTANT: Always set explicit styles for all panel elements to prevent inheritance from the base page.
  // This avoids future CSS issues and ensures consistent appearance across all sites.
  panelDiv.style.position = 'fixed';
  panelDiv.style.top = '20px';
  panelDiv.style.left = 'unset';
  panelDiv.style.right = '20px';
  panelDiv.style.width = '420px';
  panelDiv.style.height = '480px';
  panelDiv.style.background = 'white';
  panelDiv.style.border = '2px solid #888';
  panelDiv.style.zIndex = '999999';
  panelDiv.style.boxShadow = '0 2px 12px rgba(0,0,0,0.2)';
  panelDiv.style.borderRadius = '8px';
  panelDiv.style.padding = '12px';
  panelDiv.style.display = 'flex';
  panelDiv.style.flexDirection = 'column';
  panelDiv.style.gap = '8px';
  panelDiv.style.fontFamily = 'Arial, sans-serif';
  panelDiv.style.color = '#222';
  panelDiv.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-family:Arial,sans-serif;color:#222;">
      <span style="font-weight:bold;">LLM Panel</span>
      <span id="ollama-status" style="display:flex;align-items:center;gap:4px;font-size:0.95em;"><span id="ollama-status-dot">⚪</span><span id="ollama-status-text">Checking...</span></span>
      <button id="llm-panel-close" style="font-size:1.1em;background:#f5f5f5;border:1px solid #bbb;border-radius:4px;padding:2px 8px;cursor:pointer;color:#222;">✖</button>
    </div>
    <div style="margin-bottom:8px;">
      <label for="llm-model-select" style="font-size:0.95em;color:#222;margin-right:8px;">Model:</label>
      <select id="llm-model-select" style="font-size:1em;padding:2px 8px;border-radius:4px;border:1px solid #bbb;"></select>
    </div>
    <div style="font-size:0.95em;color:#555;margin-bottom:4px;font-family:Arial,sans-serif;">[shift+enter] = focus, [ctrl+enter] = submit</div>
    <textarea id="llm-panel-prompt" style="width:100%;height:80px;resize:vertical;margin-bottom:8px;font-family:Arial,sans-serif;font-size:1em;color:#222;background:#fff;border:1px solid #bbb;border-radius:4px;padding:6px;"></textarea>
    <button id="llm-panel-send" style="width:100%;margin-bottom:8px;background:#e0e0e0;border:1px solid #bbb;border-radius:4px;padding:8px 0;font-family:Arial,sans-serif;font-size:1em;cursor:pointer;color:#222;">Send</button>
    <div id="llm-panel-response" style="margin-top:8px;font-size:1em;white-space:pre-wrap;min-height:200px;max-height:300px;overflow:auto;font-family:Arial,sans-serif;color:#222;background:#fafafa;border:1px solid #eee;border-radius:4px;padding:8px;"></div>
  `;
      // Fetch models from Ollama and populate dropdown
      const modelSelect = panelDiv.querySelector('#llm-model-select');
      modelSelect.innerHTML = '<option>Loading...</option>';
      chrome.runtime.sendMessage({ action: 'getOllamaModels' }, (response) => {
        if (response && response.models && Array.isArray(response.models)) {
          modelSelect.innerHTML = '';
          response.models.forEach(model => {
            const opt = document.createElement('option');
            opt.value = model;
            opt.textContent = model;
            modelSelect.appendChild(opt);
          });
        } else {
          modelSelect.innerHTML = '<option>Error loading models</option>';
        }
      });
    // OLLAMA status check via background script
    const statusDot = panelDiv.querySelector('#ollama-status-dot');
    const statusText = panelDiv.querySelector('#ollama-status-text');
    chrome.runtime.sendMessage({ action: 'checkOllamaStatus' }, (response) => {
      if (response && response.status === 'ok') {
        if (statusDot) statusDot.textContent = '🟢';
        if (statusText) statusText.textContent = 'Connected to OLLAMA';
      } else {
        if (statusDot) statusDot.textContent = '🔴';
        if (statusText) statusText.textContent = 'OLLAMA not reachable';
      }
    });
  document.body.appendChild(panelDiv);
  // Focus the textarea when panel is created
  const promptTextarea = document.getElementById('llm-panel-prompt');
  if (promptTextarea) {
    promptTextarea.focus();
  }

  // Global keydown handler for Shift+Enter (focus) and Ctrl+Enter (send)
  function globalKeyHandler(e) {
    if (e.shiftKey && e.key === 'Enter') {
      if (promptTextarea) {
        promptTextarea.focus();
        e.preventDefault();
      }
    }
    if (e.ctrlKey && e.key === 'Enter') {
      if (promptTextarea) {
        document.getElementById('llm-panel-send').click();
        e.preventDefault();
      }
    }
  }
  window.addEventListener('keydown', globalKeyHandler);

  document.getElementById('llm-panel-close').onclick = () => {
    console.log('[content.js] Panel closed');
    panelDiv.remove();
    window.removeEventListener('keydown', globalKeyHandler);
  };

  document.getElementById('llm-panel-send').onclick = async () => {
    const prompt = promptTextarea.value;
    if (!prompt) return;
    // Extract page data
    const html = getPageHTML();
    const css = getPageCSS();
    const js = getPageJS();
    const model = modelSelect.value;
    const requestBody = { prompt, html, css, js, model };
    const responseDiv = document.getElementById('llm-panel-response');
    responseDiv.textContent = '⏳ Waiting for response...';
    chrome.runtime.sendMessage({ action: 'ollamaGenerate', body: requestBody }, (result) => {
      if (chrome.runtime.lastError) {
        responseDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
        return;
      }
      // Prefer assistant's content if present
      if (result && result.message && result.message.content) {
        responseDiv.textContent = result.message.content;
      } else if (result && result.response) {
        responseDiv.textContent = result.response;
      } else if (result && result.error) {
        responseDiv.textContent = 'Error: ' + result.error;
      } else if (result) {
        responseDiv.textContent = JSON.stringify(result, null, 2);
      } else {
        responseDiv.textContent = 'Unknown error or no response.';
      }
      console.log('[content.js] OLLAMA response:', result);
    });
  };
}

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[content.js] Received message:', request);
  if (request.action === 'extractPageData') {
    sendResponse({
      html: getPageHTML(),
      css: getPageCSS(),
      js: getPageJS()
    });
  } else if (request.action === 'togglePanel') {
    console.log('[content.js] togglePanel action received');
    createLLMPanel({ getPageHTML, getPageCSS, getPageJS });
    sendResponse({ status: 'panel toggled' });
  }
});
