// Content script: Extracts DOM, CSS, and JS from the current page

// Function to get the HTML content
function getPageHTML() {
  return document.documentElement.outerHTML;
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

  // Inject panel.css if not already present
  if (!document.getElementById('llm-panel-style')) {
    console.log('[content.js] Injecting panel.css');
    const link = document.createElement('link');
    link.id = 'llm-panel-style';
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = chrome.runtime.getURL('panel.css');
    document.head.appendChild(link);
  }

  panelDiv = document.createElement('div');
  panelDiv.id = 'llm-extension-panel';
  // Set all panel styles inline for reliability
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
  panelDiv.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <span style="font-weight:bold;">LLM Panel</span>
      <button id="llm-panel-close" style="font-size:1.1em;">✖</button>
    </div>
    <textarea id="llm-panel-prompt" style="width:100%;height:80px;resize:vertical;margin-bottom:8px;"></textarea>
    <button id="llm-panel-send" style="width:100%;margin-bottom:8px;">Send</button>
    <div id="llm-panel-response" style="margin-top:8px;font-size:1em;white-space:pre-wrap;min-height:200px;max-height:300px;overflow:auto;"></div>
  `;
  document.body.appendChild(panelDiv);
  document.getElementById('llm-panel-close').onclick = () => {
    console.log('[content.js] Panel closed');
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
        console.log('[content.js] OLLAMA response:', result);
      } catch (e) {
        responseDiv.textContent = 'Error communicating with OLLAMA.';
        console.error('[content.js] Error communicating with OLLAMA:', e);
      }
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
