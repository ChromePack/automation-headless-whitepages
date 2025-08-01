#!/bin/bash

# Set up virtual display for VNC
export DISPLAY=:1

# Start the Node.js server
echo "🚀 Starting Whitepages API server with VNC display..."
node server.js
