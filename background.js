// Format incoming data to Ollama chat API format
function formatOllamaChatRequest(body) {
  // If already in chat format, just return as-is
  if (body && body.model && Array.isArray(body.messages)) {
    return body;
  }
  // Otherwise, convert prompt/html/css/js to a single content string
  const model = 'deepseek-r1:1.5b';
  let content = body.prompt || '';
  if (body.html || body.css || body.js) {
    content += '\n\nHTML:\n' + (body.html || '') + '\n\nCSS:\n' + (body.css || '') + '\n\nJS:\n' + (body.js || '');
  }
  return {
    model,
    messages: [
      {
        role: 'user',
        content
      }
    ],
    stream: false,
    options: {
      think: true
    }
  };
}
import * as DEBUG_FLAGS from './globals.js';
// Listen for OLLAMA status check requests from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'ollamaGenerate') {
      chrome.storage.sync.get(['ollamaEndpoint'], (result) => {
        const endpoint = result.ollamaEndpoint || 'http://localhost:11434';
        const url = endpoint + '/api/chat';
        const formattedBody = formatOllamaChatRequest(request.body);
        if (DEBUG_FLAGS.DEBUG_OLLAMA_REQUEST) {
          console.log('[Ollama Debug] Request URL:', url);
          console.log('[Ollama Debug] Request Body:', JSON.stringify(formattedBody, null, 2));
        }
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formattedBody)
        })
          .then(async (res) => {
            const text = await res.text();
            // Debug: log status, headers, and body
            if (DEBUG_FLAGS.DEBUG_OLLAMA_REQUEST) {
              console.log('[Ollama Debug] Response status:', res.status, res.statusText);
              console.log('[Ollama Debug] Response headers:', Array.from(res.headers.entries()));
              console.log('[Ollama Debug] Response body:', text);
            }
            try {
              const data = JSON.parse(text);
              sendResponse(data);
            } catch (e) {
              sendResponse({
                error: 'Invalid JSON from Ollama',
                status: res.status,
                statusText: res.statusText,
                raw: text
              });
            }
          })
          .catch((err) => {
            if (DEBUG_FLAGS.DEBUG_OLLAMA_REQUEST) {
              console.log('[Ollama Debug] Fetch error:', err);
            }
            sendResponse({ error: err.message });
          });
      });
      return true;
    }
  if (request.action === 'checkOllamaStatus') {
    chrome.storage.sync.get(['ollamaEndpoint'], (result) => {
      const endpoint = result.ollamaEndpoint || 'http://localhost:11434';
      fetch(endpoint + '/api/tags')
        .then(res => {
          if (res.ok) {
            sendResponse({ status: 'ok' });
          } else {
            sendResponse({ status: 'fail' });
          }
        })
        .catch(() => {
          sendResponse({ status: 'fail' });
        });
    });
    // Indicate async response
    return true;
  }
  if (request.action === 'ollamaChat') {
    chrome.storage.sync.get(['ollamaEndpoint'], (result) => {
      const endpoint = result.ollamaEndpoint || 'http://localhost:11434';
      fetch(endpoint + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body)
      })
        .then(async (res) => {
          let data;
          try {
            data = await res.json();
          } catch (e) {
            data = { error: 'Invalid JSON from Ollama' };
          }
          sendResponse(data);
        })
        .catch((err) => {
          sendResponse({ error: err.message });
        });
    });
    return true;
  }
});
// Background script for handling extension events and communication
chrome.runtime.onInstalled.addListener(() => {
  // Initialization logic if needed
});

// Listen for keyboard shortcut to open popup (if needed)
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-popup") {
    chrome.action.openPopup();
  } else if (command === "toggle-panel") {
    // Find the active tab and send a message to toggle the panel
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'togglePanel' });
      }
    });
  }
});
