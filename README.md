
If you see 403 Forbidden errors, make sure you are using the correct script and that the extension ID matches the one in the script.
# Local LLM Summarizer Extension

A Chrome extension to summarize or analyze web pages using a local OLLAMA LLM. Keeps your data private by running everything locally.

## Features
- Popup panel with text entry for prompts
- Extracts DOM, CSS, and JS from the current page
- Sends data to a local OLLAMA LLM for processing
- Connection status indicator
- Configurable OLLAMA endpoint in options

## Setup
1. Clone this repo
2. Build or copy files as needed
3. Load as an unpacked extension in Chrome
4. Ensure OLLAMA is running locally and CORS is enabled


## How to Run Ollama for the Extension
To allow this extension to communicate with your local Ollama server, you must start Ollama with the correct CORS (origin) settings. Two helper scripts are provided:

- `serve-ollama-permissive.sh`: Only allows requests from your specific Chrome extension (recommended for most users).
- `serve-ollama-restricted.sh`: Allows requests from any Chrome extension (less secure, use for testing only).

**Usage:**
1. Open a terminal in this project directory.
2. Run one of the scripts:
	- `./serve-ollama-permissive.sh` (recommended)
	- or `./serve-ollama-restricted.sh` (for testing)
3. Then use the extension in Chrome as normal.

## Permissions
- Access to active tab and scripting
- Communication with localhost OLLAMA endpoint

## Security
- Data never leaves your machine
- Only communicates with local LLM

## TODO: Setting a Deterministic Extension ID
To ensure your Chrome extension always has the same ID (useful for allowlisting with OLLAMA_ORIGINS), you can generate and add a key to your manifest:

1. **Generate a key (in your terminal):**
	```sh
	openssl genrsa 2048 | openssl pkcs8 -topk8 -nocrypt
	```
	This will output a PEM-encoded private key.

2. **Copy the entire output** (including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines).

3. **Paste it as a single line** (remove newlines) into your manifest:
	```json
	"key": "-----BEGIN PRIVATE KEY-----MIIEvQIBADANBgkqhkiG9w0BAQEFAASC...snip...-----END PRIVATE KEY-----"
	```

This will make your extension ID deterministic, so you can safely whitelist it in OLLAMA_ORIGINS. (ie the restrictive script)