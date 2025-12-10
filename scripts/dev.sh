#!/bin/bash
# PromptPad Development Server
# Kills existing processes and starts fresh dev server with hot reload

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "Cleaning up existing dev processes..."

# Detect OS and clean up accordingly
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "mingw"* || "$OSTYPE" == "cygwin" ]]; then
    # Windows (Git Bash / MINGW / Cygwin)
    # Kill process on port 1420
    pid=$(netstat -ano 2>/dev/null | grep ":1420 " | grep "LISTENING" | awk '{print $5}' | head -1)
    if [ -n "$pid" ]; then
        taskkill //F //PID "$pid" 2>/dev/null || true
    fi

    # Kill any running Tauri dev builds
    taskkill //F //IM "prompt-pad.exe" 2>/dev/null || true

    sleep 1

    # Verify port is free
    if netstat -ano 2>/dev/null | grep ":1420 " | grep -q "LISTENING"; then
        echo "Warning: Port 1420 still in use"
        netstat -ano | grep ":1420 "
    fi
else
    # macOS / Linux
    # Kill existing dev processes on default port
    lsof -ti:1420 | xargs kill -9 2>/dev/null || true

    # Kill any running Tauri dev builds
    pkill -9 -f "target/(debug|release)/prompt-pad" 2>/dev/null || true
    pkill -9 -f "node.*tauri" 2>/dev/null || true

    sleep 1

    # Verify port is free
    if lsof -i:1420 >/dev/null 2>&1; then
        echo "Warning: Port 1420 still in use"
        lsof -i:1420
    fi
fi

echo "Starting dev server..."
npm run tauri dev
