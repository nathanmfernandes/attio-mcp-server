#!/bin/bash

# Install script for Claude Desktop with defensive programming
set -euo pipefail

echo "Installing Attio MCP Server for Claude Desktop..."

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

# Claude Desktop config path
CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"

# Create config directory if it doesn't exist
mkdir -p "$CLAUDE_CONFIG_DIR" || error_exit "Failed to create Claude config directory"

# Check if Claude Desktop is running
if pgrep -x "Claude" > /dev/null; then
    warn "Claude Desktop is currently running. You'll need to restart it after installation."
fi

# Function to validate JSON
validate_json() {
    if ! node -e "JSON.parse(require('fs').readFileSync('$1', 'utf8'))" 2>/dev/null; then
        return 1
    fi
    return 0
}

# Check if config file exists and is valid
if [ -f "$CLAUDE_CONFIG_FILE" ]; then
    echo "Found existing Claude config file"
    
    # Validate existing config
    if ! validate_json "$CLAUDE_CONFIG_FILE"; then
        error_exit "Existing Claude config file is invalid JSON. Please fix it manually or remove it."
    fi
    
    # Create backup with timestamp
    BACKUP_FILE="$CLAUDE_CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$CLAUDE_CONFIG_FILE" "$BACKUP_FILE" || error_exit "Failed to create backup"
    success "Created backup: $BACKUP_FILE"
    
    # Check if Attio server already exists
    if node -e "
        const config = JSON.parse(require('fs').readFileSync('$CLAUDE_CONFIG_FILE', 'utf8'));
        if (config.mcpServers && config.mcpServers.attio) {
            process.exit(1);
        }
    " 2>/dev/null; then
        echo "No existing Attio server configuration found."
    else
        warn "Attio server already configured in Claude."
        read -p "Do you want to update the existing configuration? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Installation cancelled."
            exit 0
        fi
    fi
else
    echo "Creating new Claude config file"
    echo '{"mcpServers": {}}' > "$CLAUDE_CONFIG_FILE" || error_exit "Failed to create config file"
fi

# Load .env file to get the token
ATTIO_ACCESS_TOKEN=""
if [ -f "$MCP_SERVER_PATH/.env" ]; then
    # Safely source .env file
    set -a
    source "$MCP_SERVER_PATH/.env" 2>/dev/null || warn "Could not load .env file"
    set +a
fi

# Add Attio MCP server to config using node
if ! node -e "
const fs = require('fs');
const path = require('path');

try {
    const configPath = '$CLAUDE_CONFIG_FILE';
    const serverPath = '$MCP_SERVER_PATH';
    const accessToken = process.env.ATTIO_ACCESS_TOKEN || '$ATTIO_ACCESS_TOKEN' || '';

    // Read existing config
    let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

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

    console.log(hadPreviousConfig ? 'Updated' : 'Added' + ' Attio MCP server in Claude config');
    process.exit(0);
} catch (error) {
    console.error('Failed to update config:', error.message);
    process.exit(1);
}
" 2>&1; then
    error_exit "Failed to update Claude configuration"
fi

# Verify the configuration was written correctly
if ! validate_json "$CLAUDE_CONFIG_FILE"; then
    # Try to restore backup
    if [ -f "$BACKUP_FILE" ]; then
        mv "$BACKUP_FILE" "$CLAUDE_CONFIG_FILE"
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
echo "2. Restart Claude Desktop to load the new configuration"
echo "3. Look for 'attio' in the MCP tools list in Claude"
echo ""

# Final validation
if node -e "
    const config = JSON.parse(require('fs').readFileSync('$CLAUDE_CONFIG_FILE', 'utf8'));
    if (!config.mcpServers || !config.mcpServers.attio) {
        process.exit(1);
    }
" 2>/dev/null; then
    success "The Attio MCP server has been successfully configured for Claude Desktop."
else
    error_exit "Configuration verification failed. Please check the config file manually."
fi