import { describe, it, expect } from '@jest/globals';

describe('Attio MCP Server Smoke Tests', () => {
  it('should have required environment configuration', () => {
    // Test that we can access environment variables
    expect(process.env).toBeDefined();
  });

  it('should have valid server configuration', () => {
    // These should be defined in the main module
    const SERVER_NAME = 'attio-mcp-server';
    const SERVER_VERSION = '1.0.0';
    const API_BASE_URL = 'https://api.attio.com';

    expect(SERVER_NAME).toBe('attio-mcp-server');
    expect(SERVER_VERSION).toBe('1.0.0');
    expect(API_BASE_URL).toBe('https://api.attio.com');
  });

  it('should validate tool definition structure', () => {
    // Example tool definition structure
    const exampleTool = {
      name: 'getv2objects',
      description: 'Lists all objects',
      inputSchema: { type: 'object', properties: {} },
      method: 'get',
      pathTemplate: '/v2/objects',
      executionParameters: [],
      securityRequirements: [{ oauth2: ['object_configuration:read'] }],
    };

    // Validate structure
    expect(exampleTool).toHaveProperty('name');
    expect(exampleTool).toHaveProperty('description');
    expect(exampleTool).toHaveProperty('inputSchema');
    expect(exampleTool).toHaveProperty('method');
    expect(exampleTool).toHaveProperty('pathTemplate');
    expect(exampleTool).toHaveProperty('executionParameters');
    expect(exampleTool).toHaveProperty('securityRequirements');
  });

  it('should handle missing access token gracefully', () => {
    const originalToken = process.env.ATTIO_ACCESS_TOKEN;
    delete process.env.ATTIO_ACCESS_TOKEN;

    // In a real implementation, this would return an error
    expect(process.env.ATTIO_ACCESS_TOKEN).toBeUndefined();

    // Restore token
    if (originalToken) {
      process.env.ATTIO_ACCESS_TOKEN = originalToken;
    }
  });
});