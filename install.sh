#!/bin/bash

# Main install script for Attio MCP Server with defensive programming
set -euo pipefail

echo "==================================="
echo "Attio MCP Server Installation"
echo "==================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Error handler
error_exit() {
    echo -e "${RED}Error: $1${NC}" >&2
    exit 1
}

# Warning message
warn() {
    echo -e "${YELLOW}Warning: $1${NC}"
}

# Success message
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Info message
info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    error_exit "Please run this script from the mcp-server directory"
fi

# Verify package.json is valid
if ! node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))" 2>/dev/null; then
    error_exit "Invalid package.json file"
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'.' -f1)
if [ "$NODE_MAJOR" -lt 16 ]; then
    error_exit "Node.js version 16 or higher is required. Current version: $NODE_VERSION"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    if ! bun install; then
        error_exit "Failed to install dependencies"
    fi
    success "Dependencies installed"
else
    info "Dependencies already installed"
fi

# Check if built
if [ ! -d "build" ]; then
    echo "Building the server..."
    if ! bun run build; then
        error_exit "Failed to build the server"
    fi
    success "Server built successfully"
else
    # Check if build is up to date
    if [ -f "src/index.ts" ]; then
        if [ "src/index.ts" -nt "build/index.js" ]; then
            warn "Source files are newer than build. Rebuilding..."
            if ! bun run build; then
                error_exit "Failed to rebuild the server"
            fi
            success "Server rebuilt successfully"
        else
            info "Server build is up to date"
        fi
    fi
fi

# Verify build output exists
if [ ! -f "build/index.js" ]; then
    error_exit "Build output not found. Please run 'bun run build' manually"
fi

# Check for .env file
ENV_STATUS="missing"
if [ ! -f ".env" ]; then
    warn ".env file not found"
    if [ -f ".env.example" ]; then
        echo "Creating .env from .env.example..."
        cp .env.example .env
        success ".env file created"
        ENV_STATUS="created"
    else
        error_exit ".env.example file not found"
    fi
else
    ENV_STATUS="exists"
fi

# Safely check for access token
HAS_TOKEN=false
if [ -f ".env" ]; then
    # Use grep to check for token without exposing it
    if grep -q "^ATTIO_ACCESS_TOKEN=.\+" ".env" 2>/dev/null; then
        HAS_TOKEN=true
    fi
fi

if [ "$HAS_TOKEN" = true ]; then
    success "Access token configured"
else
    warn "Access token not configured"
    echo ""
    echo "Please edit .env and add your Attio access token:"
    echo "  ATTIO_ACCESS_TOKEN=your_token_here"
    echo ""
    echo "Get your token from: https://app.attio.com/settings/api"
    echo ""
fi

# Check which installers are available
CLAUDE_INSTALLER=false
CURSOR_INSTALLER=false

if [ -f "./install-claude.sh" ] && [ -x "./install-claude.sh" ]; then
    CLAUDE_INSTALLER=true
fi

if [ -f "./install-cursor.sh" ] && [ -x "./install-cursor.sh" ]; then
    CURSOR_INSTALLER=true
fi

if [ "$CLAUDE_INSTALLER" = false ] && [ "$CURSOR_INSTALLER" = false ]; then
    warn "No application installers found"
    echo "Please ensure install-claude.sh and install-cursor.sh are present and executable"
    exit 0
fi

# Ask which app to install for
echo ""
echo "Which application would you like to configure the MCP server for?"

MENU_OPTIONS=()
if [ "$CLAUDE_INSTALLER" = true ]; then
    MENU_OPTIONS+=("Claude Desktop")
fi
if [ "$CURSOR_INSTALLER" = true ]; then
    MENU_OPTIONS+=("Cursor")
fi
if [ "$CLAUDE_INSTALLER" = true ] && [ "$CURSOR_INSTALLER" = true ]; then
    MENU_OPTIONS+=("Both")
fi
MENU_OPTIONS+=("Skip installation")

# Display menu
for i in "${!MENU_OPTIONS[@]}"; do
    echo "$((i+1))) ${MENU_OPTIONS[$i]}"
done
echo ""

# Get user choice with validation
while true; do
    read -p "Enter your choice (1-${#MENU_OPTIONS[@]}): " choice
    if [[ "$choice" =~ ^[0-9]+$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -le "${#MENU_OPTIONS[@]}" ]; then
        break
    else
        echo "Invalid choice. Please enter a number between 1 and ${#MENU_OPTIONS[@]}"
    fi
done

# Execute based on choice
SELECTED="${MENU_OPTIONS[$((choice-1))]}"

case "$SELECTED" in
    "Claude Desktop")
        echo ""
        ./install-claude.sh
        ;;
    "Cursor")
        echo ""
        ./install-cursor.sh
        ;;
    "Both")
        echo ""
        info "Installing for Claude Desktop..."
        ./install-claude.sh
        echo ""
        info "Installing for Cursor..."
        ./install-cursor.sh
        ;;
    "Skip installation")
        info "Skipping application configuration"
        ;;
    *)
        error_exit "Invalid selection"
        ;;
esac

echo ""
echo "==================================="
echo "Installation Summary"
echo "==================================="
success "Dependencies installed"
success "Server built"

# Token status
if [ "$HAS_TOKEN" = true ]; then
    success "Access token configured"
else
    warn "Access token not configured - please add to .env"
fi

# .env status
case "$ENV_STATUS" in
    "created")
        info ".env file was created from template"
        ;;
    "exists")
        info ".env file already existed"
        ;;
    "missing")
        warn ".env file is missing"
        ;;
esac

echo ""
echo "To test the server manually, run:"
echo "  bun start"
echo ""

if [ "$HAS_TOKEN" = false ]; then
    echo "⚠️  Don't forget to add your Attio access token to the .env file!"
    echo "   Get your token from: https://app.attio.com/settings/api"
    echo ""
fi

echo "For more information, see the README.md"
echo ""

# Final validation
if [ ! -f "build/index.js" ]; then
    error_exit "Installation incomplete: build output missing"
fi

if [ "$HAS_TOKEN" = false ]; then
    exit 1  # Exit with error if no token configured
fi

exit 0