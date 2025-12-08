#!/bin/bash
# PromptPad Build & Install Script
# Builds release version and installs to /Applications

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo -e "${GREEN}Building PromptPad...${NC}"

# Detect platform
case "$(uname -s)" in
    Darwin)
        echo "Detected macOS"

        # Kill any running PromptPad processes
        echo "Stopping any running PromptPad instances..."
        pkill -9 -f "PromptPad" 2>/dev/null || true

        # Build release
        echo "Building release..."
        npm run tauri build

        # Find the built app
        APP_PATH="$PROJECT_DIR/src-tauri/target/release/bundle/macos/PromptPad.app"

        if [ ! -d "$APP_PATH" ]; then
            echo -e "${RED}Error: Built app not found at $APP_PATH${NC}"
            exit 1
        fi

        # Remove old installation
        if [ -d "/Applications/PromptPad.app" ]; then
            echo "Removing old installation..."
            rm -rf "/Applications/PromptPad.app"
        fi

        # Copy to Applications
        echo "Installing to /Applications..."
        cp -R "$APP_PATH" /Applications/

        echo -e "${GREEN}PromptPad installed to /Applications/PromptPad.app${NC}"
        echo -e "${YELLOW}You may need to grant Accessibility permissions in System Settings > Privacy & Security > Accessibility${NC}"
        ;;

    Linux)
        echo "Detected Linux"

        # Build release
        echo "Building release..."
        npm run tauri build

        # Find the built AppImage or deb
        APPIMAGE_PATH=$(find "$PROJECT_DIR/src-tauri/target/release/bundle" -name "*.AppImage" 2>/dev/null | head -1)
        DEB_PATH=$(find "$PROJECT_DIR/src-tauri/target/release/bundle" -name "*.deb" 2>/dev/null | head -1)

        if [ -n "$APPIMAGE_PATH" ]; then
            echo "Installing AppImage to ~/.local/bin..."
            mkdir -p ~/.local/bin
            cp "$APPIMAGE_PATH" ~/.local/bin/promptpad
            chmod +x ~/.local/bin/promptpad
            echo -e "${GREEN}PromptPad installed to ~/.local/bin/promptpad${NC}"
        elif [ -n "$DEB_PATH" ]; then
            echo "Installing .deb package..."
            sudo dpkg -i "$DEB_PATH"
            echo -e "${GREEN}PromptPad installed via dpkg${NC}"
        else
            echo -e "${RED}Error: No installable package found${NC}"
            exit 1
        fi
        ;;

    *)
        echo -e "${RED}Unsupported platform: $(uname -s)${NC}"
        echo "See Tauri documentation for Windows support"
        exit 1
        ;;
esac

echo -e "${GREEN}Installation complete!${NC}"
