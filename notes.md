# ollama

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