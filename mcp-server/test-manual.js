#!/usr/bin/env node

/**
 * Manual test script for the Attio MCP Server
 * This allows you to test the server interactively without Claude/Cursor
 */

import { spawn } from 'child_process';
import readline from 'readline';

console.log('Starting Attio MCP Server in test mode...\n');

// Check for access token
if (!process.env.ATTIO_ACCESS_TOKEN) {
  console.error('Error: ATTIO_ACCESS_TOKEN environment variable is not set');
  console.error('Please set it in your .env file or export it:');
  console.error('export ATTIO_ACCESS_TOKEN=your_token_here');
  process.exit(1);
}

// Start the server
const server = spawn('node', ['build/index.js'], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: process.env,
});

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'mcp> ',
});

// Handle server output
server.stdout.on('data', (data) => {
  console.log('\nServer response:', data.toString());
  rl.prompt();
});

// Handle server errors
server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});

console.log('Server started. You can now send JSON-RPC commands.');
console.log('\nExample commands:');
console.log('1. List all tools:');
console.log('   {"jsonrpc": "2.0", "method": "tools/list", "id": 1}');
console.log('\n2. Get all objects:');
console.log('   {"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "getv2objects", "arguments": {}}, "id": 2}');
console.log('\n3. Get workspace info:');
console.log('   {"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "getv2self", "arguments": {}}, "id": 3}');
console.log('\nType "exit" to quit\n');

rl.prompt();

rl.on('line', (input) => {
  const trimmed = input.trim();
  
  if (trimmed === 'exit') {
    console.log('Shutting down...');
    server.kill();
    rl.close();
    process.exit(0);
  }
  
  if (trimmed) {
    try {
      // Validate JSON
      JSON.parse(trimmed);
      // Send to server
      server.stdin.write(trimmed + '\n');
    } catch (error) {
      console.error('Invalid JSON:', error.message);
      console.log('Please enter valid JSON-RPC commands');
      rl.prompt();
    }
  } else {
    rl.prompt();
  }
});

rl.on('close', () => {
  server.kill();
  process.exit(0);
});