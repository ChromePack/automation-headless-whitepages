#!/bin/bash

# Set up virtual display for server deployment
export DISPLAY=:99

# Start Xvfb (X Virtual Framebuffer) for headless server
echo "🚀 Starting Xvfb virtual display..."
Xvfb :99 -screen 0 1920x1080x24 &

# Wait a moment for Xvfb to start
echo "⏳ Waiting for virtual display to initialize..."
sleep 3

# Check if Xvfb is running
if pgrep -x "Xvfb" > /dev/null; then
    echo "✅ Virtual display started successfully"
else
    echo "❌ Failed to start virtual display"
    exit 1
fi

# Start the Node.js server
echo "🚀 Starting Whitepages API server..."
node server.js 