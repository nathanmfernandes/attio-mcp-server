# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains an Attio MCP (Model Context Protocol) server generated from the Attio OpenAPI specification. The server enables AI assistants like Claude Desktop and Cursor to interact with the Attio API through standardized MCP tools.

## Common Development Commands

### Building and Running
```bash
# Navigate to the MCP server directory
cd mcp-server

# Install dependencies
npm install

# Build TypeScript code
npm run build

# Run the server (stdio mode)
npm start

# Run tests
npm test
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage

# Manual testing
npm run test:manual    # Interactive test client
npm run test:server    # Raw server for JSON-RPC input
```

### Testing the MCP Server

#### With Claude Desktop or Cursor
1. Run `./install.sh` to install the server
2. Restart Claude Desktop/Cursor
3. The server will appear in the tools list
4. Example prompts:
   - "Use Attio to list all objects in my workspace"
   - "Get my Attio workspace information"
   - "List all contacts in Attio"

#### Manual Testing (JSON-RPC)
```bash
# Run the interactive test client
npm run test:manual

# Example commands to try:
# 1. List available tools
{"jsonrpc": "2.0", "method": "tools/list", "id": 1}

# 2. Call a tool (get objects)
{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "getv2objects", "arguments": {}}, "id": 2}

# 3. Get workspace info
{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "getv2self", "arguments": {}}, "id": 3}
```

### Code Quality
```bash
# Run all checks (format, lint, typecheck)
npm run check

# Run individual tools
npm run lint          # Lint with Biome
npm run format        # Format with Biome
npm run typecheck     # TypeScript type checking
npm run ci           # CI checks
```

### Installation Scripts
```bash
# Interactive installer for Claude/Cursor
./install.sh

# Install for specific applications
./install-claude.sh   # Claude Desktop only
./install-cursor.sh   # Cursor only
```

## High-Level Architecture

### MCP Server Structure
The MCP server (`mcp-server/src/index.ts`) follows a tool-based architecture:

1. **Tool Definitions**: Each Attio API endpoint is mapped to an MCP tool with:
   - Name, description, and input schema
   - HTTP method, path template, and parameters
   - Security requirements (OAuth2 scopes)

2. **Request Flow**:
   - Tools are validated using Zod schemas generated from OpenAPI definitions
   - Parameters are applied to path, query, headers, or body as specified
   - Authentication uses `ATTIO_ACCESS_TOKEN` environment variable
   - Requests are proxied to `https://api.attio.com`

3. **Key Functions**:
   - `executeApiTool()`: Core function that processes tool calls, validates inputs, applies security, and makes API requests
   - `getZodSchemaFromJsonSchema()`: Converts JSON Schema to Zod for runtime validation
   - Security handling checks for required auth tokens based on OpenAPI security schemes

### Authentication
- Modified from standard OAuth2 to use direct workspace access tokens
- Token is read from `ATTIO_ACCESS_TOKEN` environment variable
- Applied as `Bearer` token in Authorization header

### Tool Generation
Tools are generated from the Attio OpenAPI spec covering:
- Objects & Records management
- Attributes configuration
- Lists operations
- Webhooks setup
- Tasks & Notes handling
- Comments functionality
- Workspace administration

## Configuration Requirements

### Environment Setup
```bash
# Required in .env file
ATTIO_ACCESS_TOKEN=your_workspace_access_token_here

# Optional
PORT=3000              # For web transports
LOG_LEVEL=info        # Logging verbosity
```

### TypeScript Configuration
- ES modules with Node16 module resolution
- Strict type checking enabled
- Source maps for debugging
- Build output to `build/` directory

### Code Quality
- Biome for linting and formatting (migrated from ESLint/Prettier)
- Single quotes, 2-space indentation, trailing commas
- Jest for testing with TypeScript support

## Development Workflow

When modifying the MCP server:

1. Make changes to `src/index.ts`
2. Run `npm run check` to ensure code quality
3. Build with `npm run build`
4. Test locally with `npm start`
5. Restart Claude/Cursor to load changes

When adding new API endpoints:
1. Update the tool definitions map
2. Ensure proper parameter mapping (path/query/header/body)
3. Add appropriate security requirements
4. Test the new tool thoroughly

## Important Context

- The server runs in stdio mode by default for Claude/Cursor compatibility
- All API requests are proxied to Attio's production API
- Error responses include detailed information for debugging
- The OAuth2 token acquisition function was removed in favor of direct access tokens
- Installation scripts include defensive programming to protect user configurations