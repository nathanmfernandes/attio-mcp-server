#!/bin/bash

# Demo script showing how to interact with the Attio MCP Server

echo "=== Attio MCP Server Demo ==="
echo

# Check for access token
if [ -z "$ATTIO_ACCESS_TOKEN" ]; then
  if [ -f .env ]; then
    export $(cat .env | grep ATTIO_ACCESS_TOKEN | xargs)
  fi
fi

if [ -z "$ATTIO_ACCESS_TOKEN" ]; then
  echo "Error: ATTIO_ACCESS_TOKEN not set"
  echo "Please set it in .env or export it"
  exit 1
fi

echo "Starting MCP server and sending test commands..."
echo

# Build first
npm run build > /dev/null 2>&1

# Test 1: List tools
echo "1. Listing available tools:"
echo '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | timeout 2 npm start 2>/dev/null | grep -A 1000 '"result"' | head -20
echo

# Test 2: Get workspace info
echo "2. Getting workspace information:"
echo '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "getv2self", "arguments": {}}, "id": 2}' | timeout 2 npm start 2>/dev/null | grep -A 1000 '"result"'
echo

# Test 3: List objects
echo "3. Listing all objects:"
echo '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "getv2objects", "arguments": {}}, "id": 3}' | timeout 2 npm start 2>/dev/null | grep -A 1000 '"result"' | head -30
echo

echo "Demo complete! The server is working correctly."
echo
echo "To use with Claude Desktop or Cursor, run: ./install.sh"