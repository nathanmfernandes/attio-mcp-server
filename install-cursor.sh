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

# Cursor config paths (Cursor uses VS Code's config structure)
CURSOR_CONFIG_DIR="$HOME/Library/Application Support/Cursor/User"
CURSOR_SETTINGS_FILE="$CURSOR_CONFIG_DIR/settings.json"

# Create config directory if it doesn't exist
mkdir -p "$CURSOR_CONFIG_DIR" || error_exit "Failed to create Cursor config directory"

# Check if Cursor is running
if pgrep -x "Cursor" > /dev/null; then
    warn "Cursor is currently running. You'll need to restart it after installation."
fi

# Function to parse JSON with comments (JSONC)
parse_jsonc() {
    node -e "
    const fs = require('fs');
    try {
        const content = fs.readFileSync('$1', 'utf8');
        // Remove comments
        const jsonContent = content
            .replace(/\\/\\*[\\s\\S]*?\\*\\//g, '') // Remove /* */ comments
            .replace(/\\/\\/.*/g, ''); // Remove // comments
        JSON.parse(jsonContent);
        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
    "
}

# Check if settings file exists
BACKUP_FILE=""
if [ -f "$CURSOR_SETTINGS_FILE" ]; then
    echo "Found existing Cursor settings file"
    
    # Try to parse existing settings (may have comments)
    if ! parse_jsonc "$CURSOR_SETTINGS_FILE"; then
        error_exit "Existing Cursor settings file has invalid JSON. Please fix it manually."
    fi
    
    # Create backup with timestamp
    BACKUP_FILE="$CURSOR_SETTINGS_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$CURSOR_SETTINGS_FILE" "$BACKUP_FILE" || error_exit "Failed to create backup"
    success "Created backup: $BACKUP_FILE"
    
    # Check if Attio server already exists
    if node -e "
        const fs = require('fs');
        try {
            const content = fs.readFileSync('$CURSOR_SETTINGS_FILE', 'utf8');
            const jsonContent = content.replace(/\\/\\*[\\s\\S]*?\\*\\//g, '').replace(/\\/\\/.*/g, '');
            const settings = JSON.parse(jsonContent);
            if (settings.mcp && settings.mcp.servers && settings.mcp.servers.attio) {
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
    echo "Creating new Cursor settings file"
    echo '{}' > "$CURSOR_SETTINGS_FILE" || error_exit "Failed to create settings file"
fi

# Load .env file to get the token
ATTIO_ACCESS_TOKEN=""
if [ -f "$MCP_SERVER_PATH/.env" ]; then
    # Safely source .env file
    set -a
    source "$MCP_SERVER_PATH/.env" 2>/dev/null || warn "Could not load .env file"
    set +a
fi

# Add Attio MCP server to Cursor settings
if ! node -e "
const fs = require('fs');
const path = require('path');

try {
    const settingsPath = '$CURSOR_SETTINGS_FILE';
    const serverPath = '$MCP_SERVER_PATH';
    const accessToken = process.env.ATTIO_ACCESS_TOKEN || '$ATTIO_ACCESS_TOKEN' || '';

    // Read existing settings
    let settings = {};
    let originalContent = '';
    let hasComments = false;
    
    try {
        originalContent = fs.readFileSync(settingsPath, 'utf8');
        // Check if file has comments
        hasComments = originalContent.includes('//') || originalContent.includes('/*');
        
        // Remove comments and parse JSON
        const jsonContent = originalContent
            .replace(/\\/\\*[\\s\\S]*?\\*\\//g, '')
            .replace(/\\/\\/.*/g, '');
        settings = JSON.parse(jsonContent);
    } catch (e) {
        console.log('Creating new settings object');
    }

    // Ensure mcp configuration exists
    if (!settings['mcp']) {
        settings['mcp'] = {};
    }
    if (!settings['mcp']['servers']) {
        settings['mcp']['servers'] = {};
    }

    // Store old config if it exists
    const hadPreviousConfig = !!settings['mcp']['servers']['attio'];

    // Add Attio server
    settings['mcp']['servers']['attio'] = {
        command: 'node',
        args: [path.join(serverPath, 'build', 'index.js')],
        env: {
            ATTIO_ACCESS_TOKEN: accessToken
        }
    };

    // Write updated settings
    const newContent = JSON.stringify(settings, null, 2);
    
    if (hasComments) {
        // If original had comments, add a warning comment
        const warning = '// Note: Comments were removed during MCP server installation.\\n' +
                       '// Original file backed up with timestamp.\\n\\n';
        fs.writeFileSync(settingsPath, warning + newContent);
    } else {
        fs.writeFileSync(settingsPath, newContent);
    }

    console.log(hadPreviousConfig ? 'Updated' : 'Added' + ' Attio MCP server in Cursor settings');
    process.exit(0);
} catch (error) {
    console.error('Failed to update settings:', error.message);
    process.exit(1);
}
" 2>&1; then
    error_exit "Failed to update Cursor settings"
fi

# Verify the configuration was written correctly
if ! parse_jsonc "$CURSOR_SETTINGS_FILE"; then
    # Try to restore backup
    if [ -n "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ]; then
        mv "$BACKUP_FILE" "$CURSOR_SETTINGS_FILE"
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
        const content = fs.readFileSync('$CURSOR_SETTINGS_FILE', 'utf8');
        const jsonContent = content.replace(/\\/\\*[\\s\\S]*?\\*\\//g, '').replace(/\\/\\/.*/g, '');
        const settings = JSON.parse(jsonContent);
        if (!settings.mcp || !settings.mcp.servers || !settings.mcp.servers.attio) {
            process.exit(1);
        }
        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
" 2>/dev/null; then
    success "The Attio MCP server has been successfully configured for Cursor."
else
    error_exit "Configuration verification failed. Please check the settings file manually."
fi

echo ""
warn "Note: MCP support in Cursor may require enabling experimental features."
echo "Check Cursor's settings for any MCP-related options that need to be enabled."