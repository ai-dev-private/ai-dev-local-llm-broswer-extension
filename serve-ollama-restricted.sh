#!/bin/bash

# Serve Ollama, allowing any Chrome extension to connect (less secure)
# OLLAMA_ORIGINS is required to allow requests from Chrome extensions; without it, you may get 403 Forbidden errors due to the Origin header.


export OLLAMA_ORIGINS="chrome-extension://*"
# Uncomment for verbose server logs:
# export OLLAMA_DEBUG=1
ollama serve
