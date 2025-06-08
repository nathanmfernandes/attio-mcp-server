#!/usr/bin/env node
import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Start the MCP server
const server = spawn('node', [join(__dirname, 'build/index.js')], {
  stdio: ['pipe', 'pipe', 'pipe'],
});

// Send tools/list request
const request =
  JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/list',
    id: 1,
  }) + '\n';

server.stdin.write(request);

let responseBuffer = '';

server.stdout.on('data', (data) => {
  responseBuffer += data.toString();

  // Try to parse complete JSON responses
  const lines = responseBuffer.split('\n');
  for (const line of lines) {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        if (response.result && response.result.tools) {
          console.log('Found tools with transformed names:');

          // Group tools by category
          const categorized = {};
          response.result.tools.forEach((tool) => {
            const categoryMatch = tool.description.match(/^\[([^\]]+)\]/);
            const category = categoryMatch ? categoryMatch[1] : 'Other';
            if (!categorized[category]) {
              categorized[category] = [];
            }
            categorized[category].push({
              name: tool.name,
              description: tool.description.replace(/^\[[^\]]+\]\s*/, ''),
            });
          });

          // Display categorized tools
          Object.keys(categorized)
            .sort()
            .forEach((category) => {
              console.log(`\n${category}:`);
              categorized[category]
                .sort((a, b) => a.name.localeCompare(b.name))
                .forEach((tool) => {
                  console.log(`  - ${tool.name}`);
                });
            });

          console.log(`\nTotal tools: ${response.result.tools.length}`);
          server.kill();
          process.exit(0);
        }
      } catch (e) {
        // Not a complete JSON yet, continue buffering
      }
    }
  }
});

server.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Timeout after 5 seconds
setTimeout(() => {
  console.error('Timeout waiting for response');
  server.kill();
  process.exit(1);
}, 5000);
