console.log('[popup.js] Popup script loaded');

document.addEventListener('DOMContentLoaded', () => {
  console.log('[popup.js] DOMContentLoaded');
});

// Handles popup UI and communication with content/background
const statusDiv = document.getElementById('status');
const responseDiv = document.getElementById('response');

console.log('[popup.js] Elements:', { statusDiv, responseDiv });

const getOllamaEndpoint = () => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['ollamaEndpoint'], (result) => {
      resolve(result.ollamaEndpoint || 'http://localhost:11434');
    });
  });
};

const checkOllamaConnection = async (endpoint) => {
  try {
    const res = await fetch(endpoint + '/api/tags');
    if (res.ok) {
      statusDiv.textContent = '🟢 Connected to OLLAMA';
    } else {
      statusDiv.textContent = '🔴 OLLAMA not reachable';
    }
  } catch (e) {
    statusDiv.textContent = '🔴 OLLAMA not reachable';
  }
};

// Chat input and send button logic removed


// On load, check connection
getOllamaEndpoint().then(checkOllamaConnection);

// Show/Hide Panel button logic
const togglePanelBtn = document.getElementById('toggle-panel');
if (togglePanelBtn) {
  togglePanelBtn.onclick = async () => {
    console.log('[popup.js] Show/Hide Panel button clicked');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('[popup.js] Sending togglePanel message to tab', tab.id);
    chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' }, (response) => {
      if (chrome.runtime.lastError) {
        // Gracefully handle the error if the content script is not present
        console.warn('[popup.js] Could not toggle panel:', chrome.runtime.lastError.message);
        return;
      }
      console.log('[popup.js] togglePanel message sent, response:', response);
    });
  };
}
