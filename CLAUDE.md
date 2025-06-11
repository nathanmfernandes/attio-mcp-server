# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains an Attio MCP (Model Context Protocol) server generated from the Attio OpenAPI specification. The server enables AI assistants like Claude Desktop and Cursor to interact with the Attio API through standardized MCP tools.

## Common Development Commands

### Building and Running
```bash
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

# Run single test file
NODE_OPTIONS='--experimental-vm-modules' jest src/__tests__/tool-name-transformer.test.ts

# Manual testing
npm run test:manual    # Interactive test client
npm run test:demo      # Demo script with sample commands  
npm run test:names     # Test tool name transformations
npm run test:server    # Raw server for JSON-RPC input
```

### Testing the MCP Server

#### With Claude Desktop or Cursor
1. Run `./install.sh` to install the server
2. Restart Claude Desktop/Cursor
3. The server will appear in the tools list with human-readable names
4. Example prompts:
   - "Use Attio to list all objects in my workspace"
   - "Get my Attio workspace information"
   - "List all contacts in Attio"

#### Manual Testing (JSON-RPC)
```bash
# Run the interactive test client
npm run test:manual

# Quick demo of all functionality
npm run test:demo

# Test tool name transformations
npm run test:names

# Example commands using human-readable names:
# 1. List available tools
{"jsonrpc": "2.0", "method": "tools/list", "id": 1}

# 2. Call a tool with human-readable name
{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "list_objects", "arguments": {}}, "id": 2}

# 3. Get workspace info
{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "get_current_user", "arguments": {}}, "id": 3}
```

### Code Quality
```bash
# Run all checks (format, lint, typecheck)
npm run check

# Run individual tools
npm run lint          # Lint with Biome
npm run format        # Format with Biome  
npm run typecheck     # TypeScript type checking
npm run ci           # CI checks (for pre-commit)
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
The MCP server (`src/index.ts`) follows a tool-based architecture:

1. **Tool Definitions**: Each Attio API endpoint is mapped to an MCP tool with:
   - Name, description, and input schema
   - HTTP method, path template, and parameters
   - Security requirements (OAuth2 scopes)

2. **Tool Name Transformation**:
   - `tool-name-transformer.ts`: Converts technical names to human-readable ones
   - `apply-tool-names.ts`: Patches both source and build files automatically
   - Applied as postbuild hook to maintain consistency
   - Maps like `getv2objects` → `list_objects`, `postv2tasks` → `create_task`

3. **Request Flow**:
   - Human-readable tool names are mapped back to original names for execution
   - Tools are validated using Zod schemas generated from OpenAPI definitions
   - Parameters are applied to path, query, headers, or body as specified
   - Authentication uses `ATTIO_ACCESS_TOKEN` environment variable
   - Requests are proxied to `https://api.attio.com`

4. **Key Functions**:
   - `executeApiTool()`: Core function that processes tool calls, validates inputs, applies security, and makes API requests
   - `getZodSchemaFromJsonSchema()`: Converts JSON Schema to Zod for runtime validation
   - `transformToolName()`: Converts technical names to human-readable format
   - Security handling checks for required auth tokens based on OpenAPI security schemes

### Authentication
- Modified from standard OAuth2 to use direct workspace access tokens
- Token is read from `ATTIO_ACCESS_TOKEN` environment variable
- Applied as `Bearer` token in Authorization header
- Get token from: https://app.attio.com/settings/api

### Tool Categories
Tools are organized into logical categories:
- **Objects**: Core object management
- **Records**: Record CRUD operations
- **Attributes**: Attribute configuration
- **Lists**: List management
- **List Entries**: Entry operations
- **Tasks**: Task management
- **Notes**: Note operations
- **Comments**: Comment threads
- **Webhooks**: Webhook configuration
- **Workspace**: Member management
- **Authentication**: User info

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
3. Build with `npm run build` (automatically applies tool name transformations)
4. Test locally with `npm run test:manual`
5. Restart Claude/Cursor to load changes

When adding new API endpoints:
1. Update the tool definitions map in `src/index.ts`
2. Ensure proper parameter mapping (path/query/header/body)
3. Add appropriate security requirements
4. The tool name transformer will automatically handle naming
5. Test the new tool thoroughly

## Important Context

- The server runs in stdio mode by default for Claude/Cursor compatibility
- All API requests are proxied to Attio's production API
- Error responses include detailed information for debugging
- The OAuth2 token acquisition function was removed in favor of direct access tokens
- Installation scripts include defensive programming to protect user configurations
- Tool names are automatically transformed during build via postbuild hook
- Test files are excluded from builds and linting (configured in tsconfig.json and biome.json)
- The project uses ES modules with Node16 module resolution

## Task Management

This project uses Task Master for task tracking. Tasks are stored in `.taskmaster/tasks/tasks.json`. To work with tasks:

```bash
# Check for next task
task-master next

# View all tasks
task-master get-tasks

# Update task status
task-master set-task-status --id 1 --status done
```