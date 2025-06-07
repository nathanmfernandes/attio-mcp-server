# Attio MCP Server

This is a Model Context Protocol (MCP) server that provides access to the Attio API, enabling AI assistants like Claude and Cursor to interact with your Attio workspace.

## Quick Start

1. **Install and configure:**
   ```bash
   ./install.sh
   ```

2. **Add your Attio access token to `.env`:**
   ```
   ATTIO_ACCESS_TOKEN=your_token_here
   ```
   
   Get your token from: https://app.attio.com/settings/api

3. **Restart Claude Desktop or Cursor**

## Manual Installation

### For Claude Desktop

```bash
./install-claude.sh
```

This will automatically:
- Add the server to Claude's configuration
- Configure authentication with your access token
- Create a backup of existing configuration

### For Cursor

```bash
./install-cursor.sh
```

This will automatically:
- Add the server to Cursor's settings
- Configure authentication with your access token
- Create a backup of existing settings

## Available Tools

The MCP server exposes all Attio API endpoints as tools, including:

- **Objects & Records**: List, create, update, and delete records
- **Attributes**: Manage object attributes
- **Lists**: Create and manage lists
- **Webhooks**: Set up and manage webhooks
- **Tasks & Notes**: Create and manage tasks and notes
- **Comments**: Add and view comments
- **Workspace**: Manage workspace settings and users

## Manual Testing

To test the server directly:

```bash
npm start
```

## Configuration

The server uses the following environment variables:

- `ATTIO_ACCESS_TOKEN`: Your Attio workspace access token (required)
- `PORT`: Port for web transport (default: 3000)
- `LOG_LEVEL`: Logging level (default: info)

## Troubleshooting

1. **Server not showing in Claude/Cursor:**
   - Restart the application after installation
   - Check the logs for any errors
   - Ensure the server is built: `npm run build`

2. **Authentication errors:**
   - Verify your access token in `.env`
   - Ensure the token has the necessary permissions

3. **Build errors:**
   - Run `npm install` to ensure all dependencies are installed
   - Run `npm run build` to compile TypeScript

## Development

To modify the server:

1. Edit `src/index.ts`
2. Run `npm run build`
3. Restart Claude/Cursor to load changes

## Support

For issues with:
- **This MCP server**: Create an issue in this repository
- **Attio API**: Contact support@attio.com
- **MCP Protocol**: Visit https://modelcontextprotocol.io