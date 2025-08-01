#!/bin/bash

# Set up virtual display for VNC
export DISPLAY=:1

# Start the login test
echo "🚀 Starting Whitepages login test with VNC display..."
node test-login.js 