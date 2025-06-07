import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
  type ListToolsRequest,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import { jest } from '@jest/globals';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Attio MCP Server Integration Tests', () => {
  let server: Server;
  let listToolsHandler: (request: ListToolsRequest) => Promise<any>;
  let callToolHandler: (request: CallToolRequest) => Promise<any>;

  beforeAll(async () => {
    // Set up environment
    process.env.ATTIO_ACCESS_TOKEN = 'test-access-token';

    // Import the server module which will set up handlers
    await import('../index.js');

    // Create a test server instance
    server = new Server(
      { name: 'attio-mcp-server', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    // Capture the handlers
    const setRequestHandlerSpy = jest.spyOn(server, 'setRequestHandler');
    
    // Re-import to trigger handler setup
    jest.resetModules();
    const module = await import('../index.js');

    // Extract handlers from spy calls
    const listToolsCall = setRequestHandlerSpy.mock.calls.find(
      call => call[0] === ListToolsRequestSchema
    );
    const callToolCall = setRequestHandlerSpy.mock.calls.find(
      call => call[0] === CallToolRequestSchema
    );

    if (listToolsCall) listToolsHandler = listToolsCall[1] as any;
    if (callToolCall) callToolHandler = callToolCall[1] as any;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('List Tools', () => {
    it('should return all available Attio tools', async () => {
      const request: ListToolsRequest = {
        method: 'tools/list',
      };

      const response = await listToolsHandler(request);
      
      expect(response.tools).toBeDefined();
      expect(Array.isArray(response.tools)).toBe(true);
      expect(response.tools.length).toBeGreaterThan(0);
      
      // Check for some expected tools
      const toolNames = response.tools.map((t: any) => t.name);
      expect(toolNames).toContain('getv2objects');
      expect(toolNames).toContain('postv2objects');
      expect(toolNames).toContain('getv2self');
    });

    it('should include proper tool schemas', async () => {
      const request: ListToolsRequest = {
        method: 'tools/list',
      };

      const response = await listToolsHandler(request);
      const objectTool = response.tools.find((t: any) => t.name === 'getv2objects');
      
      expect(objectTool).toBeDefined();
      expect(objectTool.description).toContain('Lists all system-defined and user-defined objects');
      expect(objectTool.inputSchema).toBeDefined();
      expect(objectTool.inputSchema.type).toBe('object');
    });
  });

  describe('Call Tool - GET Requests', () => {
    it('should successfully call getv2objects', async () => {
      mockedAxios.mockResolvedValueOnce({
        data: {
          data: [
            { id: { workspace_id: '123' }, api_slug: 'contacts' },
            { id: { workspace_id: '123' }, api_slug: 'companies' },
          ],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'getv2objects',
          arguments: {},
        },
      };

      const response = await callToolHandler(request);
      
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'get',
          url: 'https://api.attio.com/v2/objects',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-access-token',
            Accept: 'application/json',
          }),
        })
      );
      
      expect(response.content[0].text).toContain('contacts');
      expect(response.content[0].text).toContain('companies');
    });

    it('should handle authentication errors', async () => {
      mockedAxios.mockRejectedValueOnce({
        response: {
          status: 401,
          statusText: 'Unauthorized',
          data: { error: { code: 'unauthorized', message: 'Invalid access token' } },
        },
        isAxiosError: true,
      });

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'getv2objects',
          arguments: {},
        },
      };

      const response = await callToolHandler(request);
      
      expect(response.content[0].text).toContain('401');
      expect(response.content[0].text).toContain('Invalid access token');
    });
  });

  describe('Call Tool - POST Requests', () => {
    it('should create a new object with proper request body', async () => {
      mockedAxios.mockResolvedValueOnce({
        data: {
          data: {
            id: { workspace_id: '123', object_id: '456' },
            api_slug: 'custom_object',
            singular_noun: 'Custom Object',
          },
        },
        status: 201,
        statusText: 'Created',
        headers: {},
        config: {} as any,
      });

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'postv2objects',
          arguments: {
            requestBody: {
              data: {
                api_slug: 'custom_object',
                singular_noun: 'Custom Object',
                plural_noun: 'Custom Objects',
              },
            },
          },
        },
      };

      const response = await callToolHandler(request);
      
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'post',
          url: 'https://api.attio.com/v2/objects',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-access-token',
            'content-type': 'application/json',
          }),
          data: {
            data: {
              api_slug: 'custom_object',
              singular_noun: 'Custom Object',
              plural_noun: 'Custom Objects',
            },
          },
        })
      );
    });
  });

  describe('Call Tool - Path Parameters', () => {
    it('should substitute path parameters correctly', async () => {
      mockedAxios.mockResolvedValueOnce({
        data: { data: { id: '123', name: 'Test Record' } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      // Assuming we have a tool that uses path parameters
      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'getv2objectsobjectrecordsrecord_id',
          arguments: {
            object: 'contacts',
            record_id: '12345',
          },
        },
      };

      const response = await callToolHandler(request);
      
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api.attio.com/v2/objects/contacts/records/12345',
        })
      );
    });
  });

  describe('Input Validation', () => {
    it('should validate required parameters', async () => {
      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'postv2objects',
          arguments: {
            // Missing required requestBody
          },
        },
      };

      const response = await callToolHandler(request);
      
      expect(response.content[0].text).toContain('Invalid arguments');
    });

    it('should validate parameter types', async () => {
      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'postv2objects',
          arguments: {
            requestBody: 'not an object', // Should be an object
          },
        },
      };

      const response = await callToolHandler(request);
      
      expect(response.content[0].text).toContain('Invalid arguments');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockedAxios.mockRejectedValueOnce(new Error('Network Error'));

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'getv2objects',
          arguments: {},
        },
      };

      const response = await callToolHandler(request);
      
      expect(response.content[0].text).toContain('Network Error');
    });

    it('should handle invalid tool names', async () => {
      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'nonexistentTool',
          arguments: {},
        },
      };

      const response = await callToolHandler(request);
      
      expect(response.content[0].text).toContain('Tool not found');
    });
  });
});