// NOTE: If the panel UI grows in complexity, consider moving it to a dedicated panel.html file for easier maintenance and scalability.
// Handles the floating LLM panel injected into the page

export function createLLMPanel({ getPageHTML, getPageCSS, getPageJS }) {
  let panelDiv = document.getElementById('llm-extension-panel');
  if (panelDiv) {
    panelDiv.remove();
    return;
  }

  // Inject panel styles directly as a <style> tag if not already present
  if (!document.getElementById('llm-panel-style')) {
    const style = document.createElement('style');
    style.id = 'llm-panel-style';
    style.textContent = `
      html, body {
        height: 100vh !important;
        min-height: 100vh !important;
        box-sizing: border-box;
      }
      #llm-extension-panel {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 340px;
        height: 520px;
        background: #e6ffe6 !important;
        border-radius: 18px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.18);
        font-family: 'Segoe UI', Arial, sans-serif;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 2px solid #e0e0e0;
      }
      .llm-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px 8px 16px;
        background: #fff;
        border-bottom: 1px solid #e0e0e0;
      }
      #llm-panel-messages {
        flex: 1 1 auto;
        min-height: 120px;
        min-height: 180px;
        max-height: 100%;
        overflow-y: auto;
        padding: 16px 12px 8px 12px;
        background: #f5f5f7;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        flex-direction: column;
        gap: 10px;
        box-sizing: border-box;
      }
      .llm-message {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 16px;
        font-size: 1em;
        word-break: break-word;
        box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      }
      .llm-message.user {
        align-self: flex-end;
        background: #d1e7ff;
        color: #1a2a3a;
        border-bottom-right-radius: 4px;
      }
      .llm-message.llm {
        align-self: flex-start;
        background: #fff;
        color: #222;
        border-bottom-left-radius: 4px;
      }
      #llm-panel-input-row {
        display: flex;
        align-items: flex-end;
        gap: 8px;
        padding: 12px 16px 16px 16px;
        background: #fff;
        border-top: 1px solid #e0e0e0;
      }
      #llm-panel-prompt {
        flex: 1 1 auto;
        min-height: 36px;
        max-height: 80px;
        resize: vertical;
        border-radius: 12px;
        border: 1px solid #c0c0c0;
        padding: 8px 10px;
        font-size: 1em;
        outline: none;
        background: #f9f9fb;
      }
      #llm-panel-send {
        flex: 0 0 auto;
        padding: 8px 18px;
        border-radius: 12px;
        border: none;
        background: #007aff;
        color: #fff;
        font-weight: bold;
        font-size: 1em;
        cursor: pointer;
        transition: background 0.2s;
      }
      #llm-panel-send:active {
        background: #005bb5;
      }
    `;
    document.head.appendChild(style);
  }

  panelDiv = document.createElement('div');
  panelDiv.id = 'llm-extension-panel';
  panelDiv.innerHTML = `
    <div class="llm-panel-header">
      <span style="font-weight:bold; color: #007a00;">FLOATING PANEL</span>
      <button id="llm-panel-close">&#10006;</button>
    </div>
    <div id="llm-panel-messages"></div>
    <div id="llm-panel-input-row">
      <textarea id="llm-panel-prompt" placeholder="Type a message..."></textarea>
      <button id="llm-panel-send">Send</button>
    </div>
  `;
  document.body.appendChild(panelDiv);

  document.getElementById('llm-panel-close').onclick = () => {
    panelDiv.remove();
  };

  const messagesDiv = document.getElementById('llm-panel-messages');
  const promptInput = document.getElementById('llm-panel-prompt');
  const sendBtn = document.getElementById('llm-panel-send');

  // Chat history state
  let chatHistory = [];

  function renderMessages() {
    messagesDiv.innerHTML = '';
    chatHistory.forEach(msg => {
      const msgDiv = document.createElement('div');
      msgDiv.className = 'llm-message ' + (msg.role === 'user' ? 'user' : 'llm');
      msgDiv.textContent = msg.content;
      messagesDiv.appendChild(msgDiv);
    });
    // Scroll to bottom
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  sendBtn.onclick = async () => {
    const userInput = promptInput.value.trim();
    if (!userInput) return;
    // Add user message to chat history
    chatHistory.push({ role: 'user', content: userInput });
    renderMessages();
    promptInput.value = '';
    const model = 'deepseek-r1:1.5b';
    const requestBody = {
      model,
      messages: chatHistory.map(m => ({ role: m.role, content: m.content })),
      stream: false,
      options: { think: true }
    };
    // Add a placeholder for LLM response
    chatHistory.push({ role: 'llm', content: '⏳ Waiting for response...' });
    renderMessages();
    const llmIndex = chatHistory.length - 1;
    chrome.runtime.sendMessage({ action: 'ollamaChat', body: requestBody }, (result) => {
      if (chrome.runtime.lastError) {
        chatHistory[llmIndex].content = 'Error: ' + chrome.runtime.lastError.message;
      } else if (result && result.response) {
        chatHistory[llmIndex].content = result.response;
      } else if (result && result.error) {
        chatHistory[llmIndex].content = 'Error: ' + result.error;
      } else {
        chatHistory[llmIndex].content = 'Unknown error or no response.';
      }
      renderMessages();
    });
  };
}
