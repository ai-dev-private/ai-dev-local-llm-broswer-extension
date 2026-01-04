#!/bin/bash

# Serve Ollama, allowing only a specific Chrome extension to connect
# OLLAMA_ORIGINS is required to allow requests from Chrome extensions; without it, you may get 403 Forbidden errors due to the Origin header.


export OLLAMA_ORIGINS="chrome-extension://chlkbfbomiilniiejnjfcaaomhckdpnb"
# Uncomment for verbose server logs:
# export OLLAMA_DEBUG=1
ollama serve
