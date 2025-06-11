#!/bin/bash

# Install script for Cursor with defensive programming
set -euo pipefail

echo "Installing Attio MCP Server for Cursor..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Get the absolute path of the MCP server
MCP_SERVER_PATH="$(cd "$(dirname "$0")" && pwd)"

# Verify we're in the correct directory
if [ ! -f "$MCP_SERVER_PATH/package.json" ]; then
    error_exit "package.json not found. Please run this script from the mcp-server directory."
fi

# Check if the server is built
if [ ! -d "$MCP_SERVER_PATH/build" ] || [ ! -f "$MCP_SERVER_PATH/build/index.js" ]; then
    error_exit "Server not built. Please run 'npm run build' first."
fi

# Cursor MCP config paths
CURSOR_CONFIG_DIR="$HOME/.cursor"
CURSOR_MCP_FILE="$CURSOR_CONFIG_DIR/mcp.json"

# Create config directory if it doesn't exist
mkdir -p "$CURSOR_CONFIG_DIR" || error_exit "Failed to create Cursor config directory"

# Check if Cursor is running
if pgrep -x "Cursor" > /dev/null; then
    warn "Cursor is currently running. You'll need to restart it after installation."
fi

# Function to validate JSON (MCP config should be pure JSON, no comments)
validate_json() {
    node -e "
    const fs = require('fs');
    try {
        const content = fs.readFileSync('$1', 'utf8');
        JSON.parse(content);
        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
    "
}

# Check if MCP config file exists
BACKUP_FILE=""
if [ -f "$CURSOR_MCP_FILE" ]; then
    echo "Found existing Cursor MCP config file"
    
    # Validate existing MCP config
    if ! validate_json "$CURSOR_MCP_FILE"; then
        error_exit "Existing Cursor MCP config file has invalid JSON. Please fix it manually."
    fi
    
    # Create backup with timestamp
    BACKUP_FILE="$CURSOR_MCP_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$CURSOR_MCP_FILE" "$BACKUP_FILE" || error_exit "Failed to create backup"
    success "Created backup: $BACKUP_FILE"
    
    # Check if Attio server already exists
    if node -e "
        const fs = require('fs');
        try {
            const content = fs.readFileSync('$CURSOR_MCP_FILE', 'utf8');
            const config = JSON.parse(content);
            if (config.mcpServers && config.mcpServers.attio) {
                process.exit(1);
            }
            process.exit(0);
        } catch (e) {
            process.exit(0);
        }
    "; then
        echo "No existing Attio server configuration found."
    else
        warn "Attio server already configured in Cursor."
        read -p "Do you want to update the existing configuration? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Installation cancelled."
            exit 0
        fi
    fi
else
    echo "Creating new Cursor MCP config file"
    echo '{"mcpServers": {}}' > "$CURSOR_MCP_FILE" || error_exit "Failed to create MCP config file"
fi

# Load .env file to get the token
ATTIO_ACCESS_TOKEN=""
if [ -f "$MCP_SERVER_PATH/.env" ]; then
    # Safely source .env file
    set -a
    source "$MCP_SERVER_PATH/.env" 2>/dev/null || warn "Could not load .env file"
    set +a
fi

# Add Attio MCP server to Cursor MCP config
if ! node -e "
const fs = require('fs');
const path = require('path');

try {
    const configPath = '$CURSOR_MCP_FILE';
    const serverPath = '$MCP_SERVER_PATH';
    const accessToken = process.env.ATTIO_ACCESS_TOKEN || '$ATTIO_ACCESS_TOKEN' || '';

    // Read existing config
    let config = {};
    
    try {
        const content = fs.readFileSync(configPath, 'utf8');
        config = JSON.parse(content);
    } catch (e) {
        console.log('Creating new MCP config object');
        config = { mcpServers: {} };
    }

    // Ensure mcpServers exists
    if (!config.mcpServers) {
        config.mcpServers = {};
    }

    // Store old config if it exists
    const hadPreviousConfig = !!config.mcpServers['attio'];

    // Add Attio server
    config.mcpServers['attio'] = {
        command: 'node',
        args: [path.join(serverPath, 'build', 'index.js')],
        env: {
            ATTIO_ACCESS_TOKEN: accessToken
        }
    };

    // Write updated config with pretty formatting
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\\n');

    console.log(hadPreviousConfig ? 'Updated' : 'Added' + ' Attio MCP server in Cursor MCP config');
    process.exit(0);
} catch (error) {
    console.error('Failed to update MCP config:', error.message);
    process.exit(1);
}
" 2>&1; then
    error_exit "Failed to update Cursor MCP configuration"
fi

# Verify the configuration was written correctly
if ! validate_json "$CURSOR_MCP_FILE"; then
    # Try to restore backup
    if [ -n "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ]; then
        mv "$BACKUP_FILE" "$CURSOR_MCP_FILE"
        error_exit "Configuration resulted in invalid JSON. Restored from backup."
    else
        error_exit "Configuration resulted in invalid JSON and no backup available."
    fi
fi

success "Configuration updated successfully"

# Check token status
if [ -n "$ATTIO_ACCESS_TOKEN" ]; then
    success "Found ATTIO_ACCESS_TOKEN in .env file"
else
    warn "ATTIO_ACCESS_TOKEN not found in .env file"
    echo "Please add your Attio access token to $MCP_SERVER_PATH/.env"
    echo "Get your token from: https://app.attio.com/settings/api"
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Ensure your Attio access token is in the .env file"
echo "2. Restart Cursor to load the new configuration"
echo "3. The Attio MCP server should now be available in Cursor"
echo ""

# Final validation
if node -e "
    const fs = require('fs');
    try {
        const content = fs.readFileSync('$CURSOR_MCP_FILE', 'utf8');
        const config = JSON.parse(content);
        if (!config.mcpServers || !config.mcpServers.attio) {
            process.exit(1);
        }
        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
" 2>/dev/null; then
    success "The Attio MCP server has been successfully configured for Cursor."
else
    error_exit "Configuration verification failed. Please check the MCP config file manually."
fi

echo ""
warn "Note: MCP support in Cursor may require enabling experimental features."
echo "Check Cursor's settings for any MCP-related options that need to be enabled."