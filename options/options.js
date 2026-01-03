// Options page logic for saving OLLAMA endpoint
const endpointInput = document.getElementById('endpoint');
const saveBtn = document.getElementById('save');
const saveStatus = document.getElementById('save-status');

// Load saved endpoint
chrome.storage.sync.get(['ollamaEndpoint'], (result) => {
  endpointInput.value = result.ollamaEndpoint || 'http://localhost:11434';
});

saveBtn.onclick = () => {
  const endpoint = endpointInput.value;
  chrome.storage.sync.set({ ollamaEndpoint: endpoint }, () => {
    saveStatus.textContent = 'Saved!';
    setTimeout(() => (saveStatus.textContent = ''), 1500);
  });
};
