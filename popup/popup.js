// Handles popup UI and communication with content/background
const statusDiv = document.getElementById('status');
const promptInput = document.getElementById('prompt');
const sendBtn = document.getElementById('send');
const responseDiv = document.getElementById('response');

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

const sendToOllama = async (data, prompt, endpoint) => {
  // Example: send as JSON to OLLAMA
  const body = {
    prompt,
    html: data.html,
    css: data.css,
    js: data.js
  };
  const res = await fetch(endpoint + '/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
};

sendBtn.onclick = async () => {
  const prompt = promptInput.value;
  if (!prompt) return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'extractPageData' }, async (data) => {
    const endpoint = await getOllamaEndpoint();
    responseDiv.textContent = '⏳ Waiting for response...';
    try {
      const result = await sendToOllama(data, prompt, endpoint);
      responseDiv.textContent = result.response || JSON.stringify(result);
    } catch (e) {
      responseDiv.textContent = 'Error communicating with OLLAMA.';
    }
  });
};


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
      console.log('[popup.js] togglePanel message sent, response:', response);
    });
  };
}
