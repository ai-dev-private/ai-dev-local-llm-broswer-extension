// Listen for sanitizeMarkdown requests from the page context via window.postMessage
window.addEventListener('message', (event) => {
  // Only accept messages from the same origin for security
  if (event.source !== window || !event.data || event.data.action !== 'sanitizeMarkdown') return;
  //console.log('[content.js] window.postMessage sanitizeMarkdown received:', event.data.markdown);
  let sanitizedHtml = event.data.markdown;
  console.log('[content.js] window.marked:', window.marked, 'window.DOMPurify:', window.DOMPurify);
  if (window.marked && window.DOMPurify) {
    try {
      const rawHtml = window.marked.parse(event.data.markdown);
      sanitizedHtml = window.DOMPurify.sanitize(rawHtml);
      console.log('[content.js] Markdown parsed and sanitized via postMessage');
    } catch (e) {
      sanitizedHtml = 'Error: Could not parse markdown.';
      console.error('[content.js] Error parsing markdown via postMessage:', e);
    }
  } else {
    console.warn('[content.js] marked or DOMPurify not available via postMessage');
  }
  // Respond back to the page context
  window.postMessage({ action: 'sanitizedMarkdown', html: sanitizedHtml, requestId: event.data.requestId }, '*');
  //console.log('[content.js] window.postMessage sanitizedMarkdown sent:', sanitizedHtml);
});
// Listen for OLLAMA status change notifications from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[content.js] onMessage received:', message);
  if (message.action === 'ollamaStatusChanged' && message.status === 'connected') {
    // Update the status indicator in the panel if it exists
    const statusDot = document.getElementById('ollama-status-dot');
    const statusText = document.getElementById('ollama-status-text');
    if (statusDot) statusDot.textContent = '🟢';
    if (statusText) statusText.textContent = 'Connected to OLLAMA';
    console.log('[content.js] OLLAMA status updated');
  }

  // Handle markdown sanitization requests from the page context
  if (message.action === 'sanitizeMarkdown' && typeof message.markdown === 'string') {
    console.log('[content.js] sanitizeMarkdown request received:', message.markdown);
    let sanitizedHtml = message.markdown;
    if (window.marked && window.DOMPurify) {
      try {
        const rawHtml = window.marked.parse(message.markdown);
        sanitizedHtml = window.DOMPurify.sanitize(rawHtml);
        console.log('[content.js] Markdown parsed and sanitized');
      } catch (e) {
        sanitizedHtml = 'Error: Could not parse markdown.';
        console.error('[content.js] Error parsing markdown:', e);
      }
    } else {
      console.warn('[content.js] marked or DOMPurify not available');
    }
    sendResponse({ html: sanitizedHtml });
    console.log('[content.js] sendResponse called with:', sanitizedHtml);
  }
  // Always return true to keep the port open for async responses
  console.log('[content.js] onMessage returning true to keep port open');
  return true;
});
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
    // Keyboard shortcuts:
    // Alt+Z toggles HTML checkbox
    // Alt+X toggles CSS checkbox
    // Alt+C toggles JS checkbox
    function handlePanelCheckboxShortcuts(e) {
      if (e.altKey) {
        if (e.key === 'z' || e.key === 'Z') {
          const htmlCheckbox = document.getElementById('llm-include-html');
          if (htmlCheckbox) {
            htmlCheckbox.checked = !htmlCheckbox.checked;
            e.preventDefault();
          }
        } else if (e.key === 'x' || e.key === 'X') {
          const cssCheckbox = document.getElementById('llm-include-css');
          if (cssCheckbox) {
            cssCheckbox.checked = !cssCheckbox.checked;
            e.preventDefault();
          }
        } else if (e.key === 'c' || e.key === 'C') {
          const jsCheckbox = document.getElementById('llm-include-js');
          if (jsCheckbox) {
            jsCheckbox.checked = !jsCheckbox.checked;
            e.preventDefault();
          }
        }
      }
    }
    window.addEventListener('keydown', handlePanelCheckboxShortcuts);
    // Remove the event listener when panel is closed
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
  panelDiv.style.width = '840px';
  panelDiv.style.height = '95vh';
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
  // Inject CSS reset to prevent site CSS from affecting the panel
  if (!document.getElementById('llm-extension-panel-style')) {
    const style = document.createElement('style');
    style.id = 'llm-extension-panel-style';
    style.textContent = `
      .llm-extension-panel * {
        all: unset;
        box-sizing: border-box;
        font-family: Arial, sans-serif;
        color: #222;
      }
      .llm-extension-panel {
        box-sizing: border-box;
        font-family: Arial, sans-serif;
        color: #222;
      }
      .llm-extension-panel textarea {
        width: 100%;
        min-height: 80px;
        height: 80px;
        resize: vertical;
        box-sizing: border-box;
        font-family: Arial, sans-serif;
        font-size: 1em;
        color: #222;
        background: #fff;
        border: 1px solid #bbb;
        border-radius: 4px;
        padding: 6px;
      }
      .llm-extension-panel input[type="checkbox"] {
        appearance: checkbox;
        -webkit-appearance: checkbox;
        width: 16px;
        height: 16px;
        margin: 0 4px 0 0;
        vertical-align: middle;
      }
      /* Restore markdown formatting */
      .llm-extension-panel b,
      .llm-extension-panel strong {
        font-weight: bold;
      }
      .llm-extension-panel em,
      .llm-extension-panel i {
        font-style: italic;
      }
      .llm-extension-panel code {
        font-family: monospace;
        background: #f4f4f4;
        padding: 2px 4px;
        border-radius: 3px;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .llm-extension-panel pre {
        display: block;
        white-space: pre;
        font-family: monospace;
        background: #f4f4f4;
        padding: 8px;
        border-radius: 4px;
        overflow-x: auto;
        margin: 0.5em 0;
      }
      /* List formatting for markdown */
      .llm-extension-panel ul,
      .llm-extension-panel ol {
        all: unset;
        display: block;
        margin: 1em 0 1em 1.5em;
        padding-left: 1.5em;
      }
      .llm-extension-panel ul {
        list-style-type: disc;
      }
      .llm-extension-panel ol {
        list-style-type: decimal;
      }
      .llm-extension-panel li {
        all: unset;
        display: list-item;
        margin: 0.25em 0;
        padding-left: 0.5em;
      }
    `;
    document.head.appendChild(style);
  }
  panelDiv.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;font-family:Arial,sans-serif;color:#222;gap:6px;">
      <span id="ollama-status" style="font-size:0.78em;display:flex;align-items:center;gap:4px;white-space:nowrap;">
        <span id="ollama-status-dot">⚪</span>
        <span id="ollama-status-text">OLLAMA connected</span>
      </span>
      <label for="llm-model-select" style="font-size:0.95em;color:#222;margin:0 4px 0 8px;white-space:nowrap;">Model:</label>
      <select id="llm-model-select" style="font-size:1em;padding:2px 8px;border-radius:4px;border:1px solid #bbb;margin-right:8px;max-width:120px;"></select>
      <button id="llm-panel-close" style="font-size:0.85em;background:#f5f5f5;border:1px solid #bbb;border-radius:4px;padding:1px 5px;cursor:pointer;color:#222;line-height:1;">✖</button>
    </div>
    <div style="height:2px;"></div>
    <div id="llm-message-stream" style="flex:1 1 auto;min-height:0;overflow-y:auto;padding:8px 2px 8px 2px;display:flex;flex-direction:column;gap:10px;background:#fafafa;border:1px solid #eee;border-radius:4px;margin-bottom:8px;"></div>
    <textarea id="llm-panel-prompt" style="width:100%;height:80px;resize:vertical;margin-bottom:8px;font-family:Arial,sans-serif;font-size:1em;color:#222;background:#fff;border:1px solid #bbb;border-radius:4px;padding:6px;"></textarea>
    <div style="margin-bottom:8px;display:flex;gap:12px;align-items:center;">
      <label style="font-size:0.95em;"><input type="checkbox" id="llm-include-html" style="margin-right:4px;">HTML</label>
      <label style="font-size:0.95em;"><input type="checkbox" id="llm-include-css" style="margin-right:4px;">CSS</label>
      <label style="font-size:0.95em;"><input type="checkbox" id="llm-include-js" style="margin-right:4px;">JS</label>
      <label style="font-size:0.95em;"><input type="checkbox" id="llm-include-think" style="margin-right:4px;">Think</label>
      <span style="font-size:0.85em;color:#888;">Include in prompt</span>
      <span 
        style="display:flex;align-items:center;gap:6px;cursor:help;font-size:0.95em;"
        title="[Shift+Enter] = focus\n[Ctrl+Enter] = submit\n[Alt+Z] = toggle HTML\n[Alt+X] = toggle CSS\n[Alt+C] = toggle JS"
      >
        <span>Keybinds</span>
        <span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:#e0e0e0;color:#555;text-align:center;line-height:16px;font-weight:bold;margin-left:2px;">?</span>
      </span>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:8px;">
      <button id="llm-panel-send" style="flex:1 1 auto;background:#e0e0e0;border:1px solid #bbb;border-radius:4px;padding:8px 0;font-family:Arial,sans-serif;font-size:1em;cursor:pointer;color:#222;">Send</button>
      <button id="llm-panel-clear" style="flex:0 0 auto;background:#fff0f0;border:1px solid #e88;border-radius:4px;padding:8px 12px;font-family:Arial,sans-serif;font-size:1em;cursor:pointer;color:#a00;">Clear Chat</button>
    </div>
    `;
    // Add event listener for Clear Chat button (after panelDiv.innerHTML is set)
    const clearBtn = panelDiv.querySelector('#llm-panel-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        localStorage.removeItem('llmChatHistory');
        chatHistory = [];
        renderMessages();
      });
    }
        // --- Chat message stream logic ---
        const messageStream = panelDiv.querySelector('#llm-message-stream');
        // Load chat history from localStorage (per origin)
        let chatHistory = [];
        try {
          chatHistory = JSON.parse(localStorage.getItem('llmChatHistory') || '[]');
          // console.log('[llm] Loaded chatHistory from localStorage:', chatHistory);
        } catch (e) {
          chatHistory = [];
          // console.warn('[llm] Failed to load chatHistory from localStorage:', e);
        }
        function saveHistory() {
          localStorage.setItem('llmChatHistory', JSON.stringify(chatHistory));
          // console.log('[llm] Saved chatHistory to localStorage:', chatHistory);
        }
        // --- Inject marked and DOMPurify if not already present ---
        // Injects an external script into the page's main world (no inline code)
        // function injectScriptIfNeeded(src, globalName, callback) { THIS IS NOW DONE ON BACKGROUNDJS
        //   if (window[globalName]) {
        //     console.log(`[LLM LibraryLoading] ${globalName} already present on window.`);
        //     callback();
        //     return;
        //   }
        //   const script = document.createElement('script');
        //   script.src = chrome.runtime.getURL(src);
        //   script.onload = () => {
        //     console.log(`[LLM LibraryLoading] Loaded script: ${src}, window.${globalName}:`, typeof window[globalName]);
        //     callback();
        //   };
        //   script.onerror = (e) => {
        //     console.error(`[LLM LibraryLoading] Failed to load script: ${src}`, e);
        //   };
        //   (document.documentElement || document.head).appendChild(script);
        //   console.log(`[LLM LibraryLoading] Injecting script: ${src}`);
        // }

        // Render messages using chrome.runtime.sendMessage for markdown sanitization
        function renderMessages() {
          messageStream.innerHTML = '';
          chatHistory.forEach((msg, idx) => {
            // Group thinking bubble with assistant message if present
            if (msg.role === 'assistant' && msg.thinking) {
              // Render thinking bubble (collapsible)
              const thinkingDiv = document.createElement('div');
              thinkingDiv.className = 'llm-thinking-bubble';
              thinkingDiv.style.alignSelf = 'flex-start';
              thinkingDiv.style.background = '#f5f5c6';
              thinkingDiv.style.color = '#444';
              thinkingDiv.style.borderRadius = '16px 16px 16px 4px';
              thinkingDiv.style.maxWidth = '80%';
              thinkingDiv.style.margin = '2px 0';
              thinkingDiv.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
              thinkingDiv.style.fontSize = '1em';
              thinkingDiv.style.wordBreak = 'break-word';
              thinkingDiv.style.cursor = 'pointer';
              // Collapsible logic
              let expanded = false;
              function setThinkingState(isExpanded) {
                if (isExpanded) {
                  thinkingDiv.textContent = msg.thinking || 'Thinking...';
                  thinkingDiv.style.padding = '10px 14px';
                  thinkingDiv.style.opacity = '1';
                  thinkingDiv.style.height = '';
                  thinkingDiv.style.overflow = '';
                  thinkingDiv.title = 'Click to collapse';
                } else {
                  thinkingDiv.textContent = '💡 Show thinking';
                  thinkingDiv.style.padding = '2px 10px';
                  thinkingDiv.style.opacity = '0.7';
                  thinkingDiv.style.height = '1.5em';
                  thinkingDiv.style.overflow = 'hidden';
                  thinkingDiv.title = 'Click to expand';
                }
              }
              setThinkingState(expanded);
              thinkingDiv.onclick = () => {
                expanded = !expanded;
                setThinkingState(expanded);
              };
              messageStream.appendChild(thinkingDiv);
            }
            // ...existing code...
            const msgDiv = document.createElement('div');
            if (msg.role === 'user') {
              msgDiv.style.alignSelf = 'flex-end';
              msgDiv.style.background = '#007aff';
              msgDiv.style.color = '#fff';
              msgDiv.style.borderRadius = '16px 16px 4px 16px';
              msgDiv.style.padding = '10px 14px';
              msgDiv.style.maxWidth = '80%';
              msgDiv.style.margin = '2px 0';
              msgDiv.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
              msgDiv.style.fontSize = '1em';
              msgDiv.style.wordBreak = 'break-word';
              // Badge area for future use
              const badgeRow = document.createElement('div');
              badgeRow.style.display = 'flex';
              badgeRow.style.gap = '6px';
              badgeRow.style.marginBottom = '2px';
              if (msg.badges && msg.badges.length) {
                msg.badges.forEach(badge => {
                  const badgeEl = document.createElement('span');
                  badgeEl.textContent = badge;
                  badgeEl.style.background = '#fff';
                  badgeEl.style.color = '#007aff';
                  badgeEl.style.fontSize = '0.8em';
                  badgeEl.style.padding = '2px 6px';
                  badgeEl.style.borderRadius = '8px';
                  badgeEl.style.marginRight = '4px';
                  badgeRow.appendChild(badgeEl);
                });
              }
              if (badgeRow.childNodes.length) msgDiv.appendChild(badgeRow);
              // Render user message as plain text (no markdown)
              msgDiv.textContent += msg.content;
              messageStream.appendChild(msgDiv);
            } else {
              msgDiv.style.alignSelf = 'flex-start';
              msgDiv.style.background = '#d4f8e5'; // green bubble
              msgDiv.style.color = '#222';
              msgDiv.style.borderRadius = '16px 16px 16px 4px';
              msgDiv.style.padding = '10px 14px';
              msgDiv.style.maxWidth = '80%';
              msgDiv.style.margin = '2px 0';
              msgDiv.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
              msgDiv.style.fontSize = '1em';
              msgDiv.style.wordBreak = 'break-word';
              // Use window.postMessage to sanitize markdown
              const requestId = 'msg-' + Math.random().toString(36).substr(2, 9);
              window.postMessage({ action: 'sanitizeMarkdown', markdown: msg.content || '', requestId }, '*');
              function handleSanitizedMessage(event) {
                if (event.source !== window || !event.data || event.data.action !== 'sanitizedMarkdown') return;
                if (event.data.requestId === requestId) {
                  msgDiv.innerHTML = event.data.html;
                  // Only replace the content, do not append again
                  // messageStream.appendChild(msgDiv); // Already appended in order below
                  messageStream.scrollTop = messageStream.scrollHeight;
                  window.removeEventListener('message', handleSanitizedMessage);
                }
              }
              window.addEventListener('message', handleSanitizedMessage);
              // Append the div in order, content will be filled in by sanitizer
              messageStream.appendChild(msgDiv);
            }
          });
        }

        // Ensure marked and DOMPurify are loaded before first render
        // injectScriptIfNeeded('libs/marked/marked.umd.js', 'marked', () => {
        //   injectScriptIfNeeded('libs/DOMpurify/purify.js', 'DOMPurify', renderMessages); THIS IS NOW DONE ON BACKGROUNDJS
        // });
      // After messageStream and chatHistory are initialized, render chat history
      renderMessages();
      // Ensure scroll to bottom after DOM update
      setTimeout(() => {
        messageStream.scrollTop = messageStream.scrollHeight;
      }, 0);
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
          // Restore last selected model from localStorage if available
          const lastModel = localStorage.getItem('llmLastModel');
          if (lastModel && response.models.includes(lastModel)) {
            modelSelect.value = lastModel;
          }
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


  // Global keydown handler for Shift+Enter (focus), Ctrl+Enter (send), and Ctrl+M (log chatHistory)
  function globalKeyHandler(e) {
    if (e.ctrlKey && e.key === 'Enter') {
      if (promptTextarea) {
        promptTextarea.focus();
        e.preventDefault();
      }
    }
    if (e.shiftKey && e.key === 'Enter') {
      if (promptTextarea) {
        document.getElementById('llm-panel-send').click();
        e.preventDefault();
      }
    }
    if (e.ctrlKey && (e.key === 'm' || e.key === 'M')) {
      // Print chatHistory to the console for debugging
      console.log('[llm] chatHistory:', chatHistory);
      e.preventDefault();
    }
  }
  window.addEventListener('keydown', globalKeyHandler);

  document.getElementById('llm-panel-close').onclick = () => {
    console.log('[content.js] Panel closed');
    panelDiv.remove();
    window.removeEventListener('keydown', globalKeyHandler);
    window.removeEventListener('keydown', handlePanelCheckboxShortcuts);
  };

  document.getElementById('llm-panel-send').onclick = async () => {
    const prompt = promptTextarea.value;
    if (!prompt) return;
    // Check which data to include
    const includeHTML = document.getElementById('llm-include-html').checked;
    const includeCSS = document.getElementById('llm-include-css').checked;
    const includeJS = document.getElementById('llm-include-js').checked;
    const html = includeHTML ? getPageHTML() : undefined;
    const css = includeCSS ? getPageCSS() : undefined;
    const js = includeJS ? getPageJS() : undefined;
    const model = modelSelect.value;
    // Save last selected model to localStorage
    localStorage.setItem('llmLastModel', model);
    const includeThink = document.getElementById('llm-include-think').checked;
    // Add user message to chat history and render
    const userMsg = { role: 'user', content: prompt, badges: [] };
    if (includeHTML) userMsg.badges.push('HTML');
    if (includeCSS) userMsg.badges.push('CSS');
    if (includeJS) userMsg.badges.push('JS');
    chatHistory.push(userMsg);
    console.log('[llm] Added user message:', userMsg);
    saveHistory();
    renderMessages();
    promptTextarea.value = '';
    // Add a placeholder for LLM response
    const llmMsg = { role: 'assistant', content: '⏳ Waiting for response...', uiOnly: true };
    chatHistory.push(llmMsg);
    saveHistory();
    renderMessages();
    const llmIndex = chatHistory.length - 1;
    // Build messages array for Ollama, filtering out UI-only placeholders
    // When sending to LLM, do not include 'thinking' property or any 'thinking' messages
    const messages = chatHistory
      .filter(m => !m.uiOnly && m.role !== 'thinking')
      .map(m => ({ role: m.role, content: m.content }));
    const requestBody = { model, messages, stream: false };
    if (includeHTML) requestBody.html = html;
    if (includeCSS) requestBody.css = css;
    if (includeJS) requestBody.js = js;
    if (includeThink) requestBody.think = true;
    let thinkingIndex = -1;
    chrome.runtime.sendMessage({ action: 'ollamaGenerate', body: requestBody }, (result) => {
      let llmContent = '';
      const DEBUG_OLLAMA_RESPONSE = true;
      if (DEBUG_OLLAMA_RESPONSE) {
        console.log('[content.js] OLLAMA full response:', result);
      }
      if (chrome.runtime.lastError) {
        llmContent = 'Error: ' + chrome.runtime.lastError.message;
      } else if (result && result.message && result.message.content) {
        llmContent = result.message.content;
      } else if (result && result.response) {
        llmContent = result.response;
      } else if (result && result.error) {
        llmContent = 'Error: ' + result.error;
      } else {
        llmContent = 'Unknown error or no response.';
      }
      // Find the assistant placeholder (uiOnly) and replace its content, clear uiOnly, and attach thinking if present
      let assistantMsg = null;
      if (chatHistory[llmIndex] && chatHistory[llmIndex].role === 'assistant') {
        assistantMsg = chatHistory[llmIndex];
      } else {
        // If the assistant placeholder was shifted, find the next assistant
        const nextAssistantIdx = chatHistory.findIndex((m, i) => i > llmIndex && m.role === 'assistant');
        if (nextAssistantIdx !== -1) {
          assistantMsg = chatHistory[nextAssistantIdx];
        }
      }
      console.log('[llm] Before update, assistantMsg:', assistantMsg);
      if (assistantMsg) {
        assistantMsg.content = llmContent;
        assistantMsg.uiOnly = false;
        if (result && result.thinking) {
          assistantMsg.thinking = result.thinking;
          console.log('[llm] Set thinking on assistantMsg:', assistantMsg.thinking);
        } else {
          delete assistantMsg.thinking;
        }
        console.log('[llm] After update, assistantMsg:', assistantMsg);
      } else {
        console.warn('[llm] No assistant message found to update!');
      }
      saveHistory();
      renderMessages();
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
