#!/usr/bin/env bash

# Navigate to script's directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=================================================="
echo " Starting SCJ28 Academic & Startup Task Manager..."
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed. Please install Node.js (v18+) to run SCJ28."
    exit 1
fi

# Install dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing dependencies..."
    npm install
fi

# Wait for server and open browser
PORT=2800
URL="http://localhost:$PORT"

echo "[INFO] Server starting at $URL"

# Open default browser after a short delay in background
(
  sleep 1.5
  if command -v xdg-open &> /dev/null; then
    xdg-open "$URL" &> /dev/null
  elif command -v sensible-browser &> /dev/null; then
    sensible-browser "$URL" &> /dev/null
  elif command -v google-chrome &> /dev/null; then
    google-chrome "$URL" &> /dev/null
  elif command -v firefox &> /dev/null; then
    firefox "$URL" &> /dev/null
  fi
) &

# Run Express Server
node server.js
