# Debugging background script output in Chrome extensions

If you add debug logging to your background.js (service worker) in a Chrome extension, you will NOT see those logs in the content script or popup console. Instead:

1. Go to `chrome://extensions/`
2. Find your extension and click the “service worker” link under “Inspect views” (or “background page” if you see that).
3. In the new DevTools window, check the Console tab for your debug logs (e.g., `[Ollama Debug] Request URL:` and `[Ollama Debug] Request Body:`).

This is required because background scripts run in a separate context from content scripts and popups.
# ollama

## Shadow DOM (shadow html) notes
- Using shadow DOM for the panel solved style inheritance issues (site CSS did not affect the panel).
- However, on sites with aggressive global key handlers (e.g., GitHub), focus and typing in shadow DOM text boxes was unreliable—site scripts could steal focus or block input.
- Because of this, we reverted to a regular DOM panel and will fix style issues as they arise on a per-site basis.

## restful api
```json
// POST
{
  "model": "deepseek-r1:1.5b",
  "messages": [
    {
      "role": "user",
      "content": "Say hello from the chat API"
    }
  ],
  "stream": false, // what kind of error do we get?
  "options": {
    "think": true
  }
}
```

# OLLAMA 403 forbidden errors
http headers with certain origins will be forbidden.  
For example, it doesn't work for chrome extensions by default.  
Can quickly test by serving like this:   
`OLLAMA_DEBUG=1 OLLAMA_ORIGINS="chrome-extension://*" ollama serve`
or
```bash
export OLLAMA_DEBUG=1
export OLLAMA_ORIGINS="chrome-extension://*"
ollama serve
```
However, this is very permissive.  
For `development`/`local` usage, you can use a "key" in the manifest v3 file.   
This will make a specific output extension id, when you load it locally.
You can then server ollama to only allow that extension.

For `deployement`, it seems ollama doesn't support authentation.   
So you will need to do authentication through a reverse proxy, like nginx, Caddy, etc.

# Manual rest API testing

Generate endpoint:   
```sh
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Why is the sky blue?"
}'
```

Chat end point:
```
curl http://localhost:11434/api/chat -d '{
  "model": "llama3.2",
  "messages": [
    { "role": "user", "content": "why is the sky blue?" }
  ]
}'
```

