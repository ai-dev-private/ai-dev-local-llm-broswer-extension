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

## Permissions
- Access to active tab and scripting
- Communication with localhost OLLAMA endpoint

## Security
- Data never leaves your machine
- Only communicates with local LLM

