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
