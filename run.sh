#!/usr/bin/env bash

# Navigate to script's directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=================================================="
echo " Starting SCJ28 Academic & Startup Task Manager..."
echo "=================================================="

# Ensure tasks.db file exists (prevents Docker from creating a directory)
if [ ! -f "tasks.db" ]; then
    touch tasks.db
fi

# Function to check if a port is in use
is_port_in_use() {
    local port=$1
    if command -v lsof &>/dev/null; then
        lsof -i:"$port" &>/dev/null && return 0
    fi
    if command -v ss &>/dev/null; then
        ss -tuln | grep -q ":$port " && return 0
    fi
    if command -v netstat &>/dev/null; then
        netstat -tuln | grep -q ":$port " && return 0
    fi
    (echo > /dev/tcp/127.0.0.1/"$port") 2>/dev/null && return 0
    return 1
}

# Find first available port starting from 2800
PORT=2800
while is_port_in_use "$PORT"; do
    echo "[INFO] Port $PORT is already in use. Checking port $((PORT + 1))..."
    PORT=$((PORT + 1))
done

URL="http://localhost:$PORT"

# Function to open URL in browser
open_browser() {
    (
        sleep 1.5
        if command -v xdg-open &> /dev/null; then
            xdg-open "$URL" &> /dev/null
        elif command -v open &> /dev/null; then
            open "$URL" &> /dev/null
        elif command -v sensible-browser &> /dev/null; then
            sensible-browser "$URL" &> /dev/null
        elif command -v google-chrome &> /dev/null; then
            google-chrome "$URL" &> /dev/null
        elif command -v firefox &> /dev/null; then
            firefox "$URL" &> /dev/null
        fi
    ) &
}

# Check if Docker is installed and daemon is running
if command -v docker &> /dev/null && docker info &> /dev/null; then
    echo "[INFO] Docker detected! Running via Docker container..."

    # Check if Docker image exists
    if ! docker image inspect scj28-task-manager:latest &> /dev/null; then
        echo "[INFO] Building Docker image 'scj28-task-manager:latest'..."
        docker build -t scj28-task-manager:latest .
    fi

    CONTAINER_NAME="scj28-app-$PORT"

    # Check if container exists
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
            echo "[INFO] Container $CONTAINER_NAME is already running on $URL"
        else
            echo "[INFO] Starting existing container $CONTAINER_NAME..."
            docker start "$CONTAINER_NAME" > /dev/null
        fi
    else
        echo "[INFO] Launching container $CONTAINER_NAME on port $PORT..."
        docker run -d \
            --name "$CONTAINER_NAME" \
            -p "$PORT:2800" \
            -v "$DIR/tasks.db:/app/tasks.db" \
            scj28-task-manager:latest > /dev/null
    fi

    echo "[INFO] Container active! Opening $URL in browser..."
    open_browser
    exit 0
fi

# Fallback: Run natively via Node.js
if command -v node &> /dev/null; then
    echo "[INFO] Docker unavailable or not running. Falling back to Node.js..."

    # Install dependencies if node_modules is missing
    if [ ! -d "node_modules" ]; then
        echo "[INFO] Installing dependencies..."
        npm install
    fi

    echo "[INFO] Express Server starting on $URL"
    open_browser

    # Run Express Server with selected PORT
    PORT=$PORT node server.js
    exit 0
fi

echo "[ERROR] Neither Docker nor Node.js was found on your system."
echo "[ERROR] Please install Docker (https://www.docker.com/) or Node.js (https://nodejs.org/) to run SCJ28."
exit 1
