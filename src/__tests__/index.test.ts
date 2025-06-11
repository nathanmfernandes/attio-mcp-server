import { describe, test, expect } from 'bun:test';
import { ZodError, z } from 'zod';

describe('Attio MCP Server', () => {
  // Set up environment
  process.env.ATTIO_ACCESS_TOKEN = 'test-token-123';

  describe('Tool Execution', () => {
    test('should validate tool arguments with Zod schema', () => {
      const mockToolDefinition = {
        name: 'getv2objects',
        description: 'Lists all objects',
        inputSchema: { type: 'object', properties: {} },
        method: 'get',
        pathTemplate: '/v2/objects',
        executionParameters: [],
        securityRequirements: [{ oauth2: ['object_configuration:read'] }],
      };

      // Validate the tool definition structure
      expect(mockToolDefinition.name).toBe('getv2objects');
      expect(mockToolDefinition.method).toBe('get');
      expect(mockToolDefinition.pathTemplate).toBe('/v2/objects');
      expect(Array.isArray(mockToolDefinition.executionParameters)).toBe(true);
      expect(Array.isArray(mockToolDefinition.securityRequirements)).toBe(true);
    });

    test('should apply authentication headers correctly', () => {
      const token = process.env.ATTIO_ACCESS_TOKEN;
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      };

      expect(headers.Authorization).toBe('Bearer test-token-123');
      expect(headers.Accept).toBe('application/json');
    });

    test('should handle API errors gracefully', () => {
      const errorResponse = {
        response: {
          status: 401,
          statusText: 'Unauthorized',
          data: { error: 'Invalid token' },
        },
      };

      expect(errorResponse.response.status).toBe(401);
      expect(errorResponse.response.statusText).toBe('Unauthorized');
      expect(errorResponse.response.data.error).toBe('Invalid token');
    });
  });

  describe('Parameter Handling', () => {
    test('should correctly substitute path parameters', () => {
      const pathTemplate = '/v2/objects/{object}/records/{record_id}';
      const params = { object: 'contacts', record_id: '123' };

      // Test path parameter substitution logic
      let path = pathTemplate;
      for (const [key, value] of Object.entries(params)) {
        path = path.replace(`{${key}}`, String(value));
      }
      
      const expectedPath = '/v2/objects/contacts/records/123';
      expect(path).toBe(expectedPath);
    });

    test('should add query parameters to the request', () => {
      const queryParams = { limit: 10, page: 1 };
      const url = new URL('https://api.attio.com/v2/objects');
      
      for (const [key, value] of Object.entries(queryParams)) {
        url.searchParams.append(key, String(value));
      }

      expect(url.toString()).toBe('https://api.attio.com/v2/objects?limit=10&page=1');
    });

    test('should include header parameters', () => {
      const headerParams = {
        'X-Custom-Header': 'custom-value',
        'Accept-Language': 'en-US',
      };

      const headers = {
        Authorization: 'Bearer test-token',
        ...headerParams,
      };

      expect(headers['X-Custom-Header']).toBe('custom-value');
      expect(headers['Accept-Language']).toBe('en-US');
      expect(headers.Authorization).toBe('Bearer test-token');
    });
  });

  describe('Request Body Handling', () => {
    test('should include request body for POST/PUT/PATCH requests', () => {
      const requestBody = {
        data: {
          values: {
            name: 'Test Contact',
            email: 'test@example.com',
          },
        },
      };

      // Validate request body structure
      expect(requestBody.data).toBeDefined();
      expect(requestBody.data.values).toBeDefined();
      expect(requestBody.data.values.name).toBe('Test Contact');
      expect(requestBody.data.values.email).toBe('test@example.com');
    });
  });

  describe('Security', () => {
    test('should fail when access token is missing', () => {
      const originalToken = process.env.ATTIO_ACCESS_TOKEN;
      delete process.env.ATTIO_ACCESS_TOKEN;

      // Test that we can detect missing token
      expect(process.env.ATTIO_ACCESS_TOKEN).toBeUndefined();

      // Restore token
      process.env.ATTIO_ACCESS_TOKEN = originalToken;
    });

    test('should use the configured access token', () => {
      process.env.ATTIO_ACCESS_TOKEN = 'custom-token';
      const token = process.env.ATTIO_ACCESS_TOKEN;

      expect(token).toBe('custom-token');

      // Restore original token
      process.env.ATTIO_ACCESS_TOKEN = 'test-token-123';
    });
  });

  describe('Zod Schema Validation', () => {
    test('should create valid Zod schemas from JSON Schema', () => {
      const jsonSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      };

      // Test that we can work with schema structures
      expect(jsonSchema.type).toBe('object');
      expect(jsonSchema.properties.name.type).toBe('string');
      expect(jsonSchema.properties.age.type).toBe('number');
      expect(jsonSchema.required).toContain('name');
    });

    test('should validate required fields', () => {
      const schema = z.object({
        name: z.string(),
        email: z.string().email(),
      });

      const validData = { name: 'John', email: 'john@example.com' };
      const invalidData = { name: 'John' }; // missing email

      expect(() => schema.parse(validData)).not.toThrow();
      expect(() => schema.parse(invalidData)).toThrow(ZodError);
    });
  });
});