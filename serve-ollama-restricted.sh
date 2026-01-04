#!/bin/bash

# Serve Ollama, allowing any Chrome extension to connect (less secure)
# OLLAMA_ORIGINS is required to allow requests from Chrome extensions; without it, you may get 403 Forbidden errors due to the Origin header.


# Uncomment for verbose server logs:
# export OLLAMA_DEBUG=1
export OLLAMA_ORIGINS="chrome-extension://*"
ollama serve
