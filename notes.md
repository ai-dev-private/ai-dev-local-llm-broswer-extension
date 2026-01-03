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