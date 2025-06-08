# Tools Directory

This directory contains development and testing utilities for the Attio MCP Server.

## Scripts

### `demo.sh`
Interactive demo script that shows how to interact with the MCP server by running sample commands and displaying their output.

**Usage:**
```bash
npm run test:demo
```

### `test-manual.js` 
Manual testing interface that starts the MCP server and provides an interactive command-line interface for sending JSON-RPC commands.

**Usage:**
```bash
npm run test:manual
```

**Example commands:**
- List tools: `{"jsonrpc": "2.0", "method": "tools/list", "id": 1}`
- Get workspace info: `{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "Get_Current_User", "arguments": {}}, "id": 2}`

### `test-transformed-names.js`
Utility script that tests the tool name transformation system by listing all available tools with their human-readable names organized by category.

**Usage:**
```bash
npm run test:names
```

## Requirements

All scripts require:
- The server to be built (`npm run build`)
- `ATTIO_ACCESS_TOKEN` environment variable to be set (in `.env` file or exported)

## Notes

- These tools are for development and testing only
- They are excluded from the main build process
- Use `npm run test:server` for raw JSON-RPC input testing