# Attio MCP Server

A high-performance Model Context Protocol (MCP) server that provides seamless access to the Attio API, enabling AI assistants like Claude and Cursor to interact with your Attio workspace through human-readable tools.

## Features

- **🏷️ Human-Readable Tool Names**: Automatically transforms technical API names (like `getv2objects`) into clear, categorized names (like `list_objects`)
- **📊 Full API Coverage**: Access to objects, records, attributes, lists, tasks, notes, and more
- **📁 Organized by Category**: Tools are grouped into logical categories for easy navigation
- **🤖 AI Assistant Ready**: Works seamlessly with Claude Desktop and Cursor
- **⚡ High Performance**: Built with Bun for fast execution and native TypeScript support
- **🔧 Easy Installation**: Automated setup scripts with intelligent configuration detection

## Quick Start

1. **Prerequisites:**
   ```bash
   # Install Bun (if not already installed)
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Install and configure:**
   ```bash
   ./install.sh
   ```

3. **Add your Attio access token to `.env`:**
   ```
   ATTIO_ACCESS_TOKEN=your_token_here
   ```
   
   Get your token from: https://app.attio.com/settings/api

4. **Restart Claude Desktop or Cursor**

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

The MCP server exposes all Attio API endpoints as tools with human-readable names, organized by category:

### Core Data Management
- **Objects**: `list_objects`, `create_object`, `get_object`, `update_object`
- **Records**: `list_records`, `create_record`, `query_records`, `delete_record`
- **Attributes**: `list_attributes`, `create_attribute`, `update_attribute_status`

### Lists & Entries
- **Lists**: `list_lists`, `create_list`, `update_list`
- **List Entries**: `create_list_entry`, `query_list_entries`, `update_list_entry`

### Collaboration
- **Tasks**: `list_tasks`, `create_task`, `update_task`, `delete_task`
- **Notes**: `list_notes`, `create_note`, `get_note`, `delete_note`
- **Comments**: `create_comment`, `get_comment`, `list_comment_threads`

### Administration
- **Workspace**: `list_workspace_members`, `get_workspace_member`
- **Webhooks**: `list_webhooks`, `create_webhook`, `update_webhook`
- **Authentication**: `get_current_user`

## Manual Testing

To test the server directly:

```bash
bun start
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
   - Ensure the server is built: `bun run build`

2. **Authentication errors:**
   - Verify your access token in `.env`
   - Ensure the token has the necessary permissions

3. **Build errors:**
   - Run `bun install` to ensure all dependencies are installed
   - Run `bun run build` to compile TypeScript

## Development

To modify the server:

1. Edit `src/index.ts`
2. Run `bun run build`
3. Test with `bun test`
4. Restart Claude/Cursor to load changes

### Development Commands

```bash
# Install dependencies
bun install

# Build the server
bun run build

# Run tests
bun test

# Run tests with coverage
bun test --coverage

# Format and lint code
bun run check

# Manual testing
bun run test:manual
```

## Support

For issues with:
- **This MCP server**: Create an issue in this repository
- **Attio API**: Contact support@attio.com
- **MCP Protocol**: Visit https://modelcontextprotocol.io

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is open source and available under the MIT License.

---

<div align="center">
<sub>Built with ❤️ for the AI community</sub>
</div>