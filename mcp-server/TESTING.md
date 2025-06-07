# Testing the Attio MCP Server

This guide explains the different ways to test and interact with the Attio MCP server.

## Running the Server

### 1. Production Use (Claude Desktop / Cursor)

The recommended way to use the server is through Claude Desktop or Cursor:

```bash
# Install the server for your application
./install.sh

# The server will run automatically when you start Claude/Cursor
```

Once installed:
- In Claude Desktop: Look for "attio" in the MCP tools list
- In Cursor: The server will be available for AI interactions

Example prompts to test:
- "Use the Attio MCP server to list all objects in my workspace"
- "Show me all the custom objects in Attio"
- "Get information about my Attio workspace"

### 2. Manual Testing (Interactive CLI)

For development and debugging, use the interactive test client:

```bash
# First, ensure the server is built
npm run build

# Run the interactive test client
npm run test:manual
```

This provides an interactive prompt where you can send JSON-RPC commands:

```json
// List all available tools
{"jsonrpc": "2.0", "method": "tools/list", "id": 1}

// Get all objects in your workspace
{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "getv2objects", "arguments": {}}, "id": 2}

// Get workspace information
{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "getv2self", "arguments": {}}, "id": 3}

// Get a specific object (e.g., contacts)
{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "getv2objectsobject", "arguments": {"object": "contacts"}}, "id": 4}
```

### 3. Direct Server Testing

For raw server testing with piped input:

```bash
# Start the server
npm start

# In another terminal, send commands
echo '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | npm start
```

### 4. Unit Tests

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Common Test Scenarios

### 1. Authentication Test
Test that your access token works:
```json
{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "getv2self", "arguments": {}}, "id": 1}
```

Expected: Returns your workspace information
Error: Check your `ATTIO_ACCESS_TOKEN` in `.env`

### 2. List Objects Test
```json
{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "getv2objects", "arguments": {}}, "id": 2}
```

Expected: Returns all objects (both system and custom)

### 3. Create Record Test
```json
{
  "jsonrpc": "2.0", 
  "method": "tools/call", 
  "params": {
    "name": "postv2objectsobjectrecords",
    "arguments": {
      "object": "contacts",
      "requestBody": {
        "data": {
          "values": {
            "name": [
              {
                "first_name": "Test",
                "last_name": "Contact"
              }
            ],
            "email_addresses": [
              {
                "email_address": "test@example.com"
              }
            ]
          }
        }
      }
    }
  },
  "id": 3
}
```

### 4. Error Handling Test
Test with invalid tool name:
```json
{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "invalidTool", "arguments": {}}, "id": 4}
```

Expected: Error message about tool not found

## Troubleshooting

### Server Won't Start
- Check Node.js version: `node --version` (requires v20+)
- Ensure TypeScript is built: `npm run build`
- Check for port conflicts if using web transport

### Authentication Errors
- Verify `.env` file exists with `ATTIO_ACCESS_TOKEN`
- Ensure token has proper permissions in Attio
- Check token hasn't expired

### No Response from Server
- Server runs in stdio mode - it expects JSON-RPC on stdin
- Use the test client (`npm run test:manual`) for easier interaction
- Check server logs for errors

### Tools Not Found
- Rebuild the server: `npm run build`
- Check that all dependencies are installed: `npm install`
- Verify the tool name matches exactly (case-sensitive)

## Debugging Tips

1. **Enable Debug Logging**: Set `LOG_LEVEL=debug` in `.env`
2. **Check Raw Responses**: The server returns full API responses in the `content` field
3. **Validate JSON**: Use `jq` to validate your JSON-RPC commands
4. **Network Issues**: Use `curl` to test Attio API directly

## Example Test Session

```bash
$ npm run test:manual

Starting Attio MCP Server in test mode...

Server started. You can now send JSON-RPC commands.

Example commands:
1. List all tools:
   {"jsonrpc": "2.0", "method": "tools/list", "id": 1}

2. Get all objects:
   {"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "getv2objects", "arguments": {}}, "id": 2}

3. Get workspace info:
   {"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "getv2self", "arguments": {}}, "id": 3}

Type "exit" to quit

mcp> {"jsonrpc": "2.0", "method": "tools/list", "id": 1}

Server response: {"jsonrpc":"2.0","id":1,"result":{"tools":[...]}}

mcp> exit
Shutting down...
```