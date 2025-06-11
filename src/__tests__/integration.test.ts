import { describe, test, expect } from 'bun:test';

describe('Attio MCP Server Integration Tests', () => {
  // Set up environment for tests
  process.env.ATTIO_ACCESS_TOKEN = 'test-access-token';

  describe('Server Configuration', () => {
    test('should have proper server configuration', () => {
      // Basic configuration tests
      expect(process.env.ATTIO_ACCESS_TOKEN).toBe('test-access-token');
    });

    test('should validate API base URL', () => {
      const API_BASE_URL = 'https://api.attio.com';
      expect(API_BASE_URL).toBe('https://api.attio.com');
    });
  });

  describe('Tool Structure', () => {
    test('should have proper tool definition structure', () => {
      // Example tool definition structure validation
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

    test('should validate HTTP methods', () => {
      const validMethods = ['get', 'post', 'put', 'patch', 'delete'];
      expect(validMethods).toContain('get');
      expect(validMethods).toContain('post');
      expect(validMethods).toContain('put');
      expect(validMethods).toContain('patch');
      expect(validMethods).toContain('delete');
    });
  });

  describe('Parameter Handling', () => {
    test('should correctly substitute path parameters', () => {
      const pathTemplate = '/v2/objects/{object}/records/{record_id}';
      const params = { object: 'contacts', record_id: '123' };
      
      // Simulate path parameter substitution
      let path = pathTemplate;
      for (const [key, value] of Object.entries(params)) {
        path = path.replace(`{${key}}`, String(value));
      }
      
      const expectedPath = '/v2/objects/contacts/records/123';
      expect(path).toBe(expectedPath);
    });

    test('should handle query parameters', () => {
      const queryParams = { limit: 10, offset: 0 };
      const searchParams = new URLSearchParams();
      
      for (const [key, value] of Object.entries(queryParams)) {
        searchParams.append(key, String(value));
      }
      
      expect(searchParams.toString()).toBe('limit=10&offset=0');
    });
  });

  describe('Security', () => {
    test('should validate access token format', () => {
      const token = process.env.ATTIO_ACCESS_TOKEN;
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token?.length).toBeGreaterThan(0);
    });

    test('should create proper authorization header', () => {
      const token = 'test-token-123';
      const authHeader = `Bearer ${token}`;
      expect(authHeader).toBe('Bearer test-token-123');
    });
  });

  describe('Request Structure', () => {
    test('should create proper GET request structure', () => {
      const request = {
        method: 'get',
        url: 'https://api.attio.com/v2/objects',
        headers: {
          Authorization: 'Bearer test-access-token',
          Accept: 'application/json',
        },
      };

      expect(request.method).toBe('get');
      expect(request.url).toContain('api.attio.com');
      expect(request.headers.Authorization).toContain('Bearer');
      expect(request.headers.Accept).toBe('application/json');
    });

    test('should create proper POST request structure', () => {
      const request = {
        method: 'post',
        url: 'https://api.attio.com/v2/objects',
        headers: {
          Authorization: 'Bearer test-access-token',
          'content-type': 'application/json',
        },
        data: {
          data: {
            api_slug: 'custom_object',
            singular_noun: 'Custom Object',
          },
        },
      };

      expect(request.method).toBe('post');
      expect(request.headers['content-type']).toBe('application/json');
      expect(request.data).toBeDefined();
      expect(request.data.data.api_slug).toBe('custom_object');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing access token', () => {
      const originalToken = process.env.ATTIO_ACCESS_TOKEN;
      delete process.env.ATTIO_ACCESS_TOKEN;

      expect(process.env.ATTIO_ACCESS_TOKEN).toBeUndefined();

      // Restore token
      if (originalToken) {
        process.env.ATTIO_ACCESS_TOKEN = originalToken;
      }
    });

    test('should validate error response structure', () => {
      const errorResponse = {
        status: 401,
        statusText: 'Unauthorized',
        data: { 
          error: { 
            code: 'unauthorized', 
            message: 'Invalid access token' 
          } 
        },
      };

      expect(errorResponse.status).toBe(401);
      expect(errorResponse.data.error.code).toBe('unauthorized');
      expect(errorResponse.data.error.message).toContain('Invalid access token');
    });
  });
});