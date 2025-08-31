import { Tool } from './types';
import { 
  JsonRpcRequest, 
  JsonRpcResponse, 
  parseJsonRpcMessage,
  createSuccessResponse,
  isValidJsonRpcRequest
} from './jsonrpc';
import { 
  JsonRpcError, 
  JsonRpcErrorCode, 
  createErrorResponse 
} from './errors';

export interface McpServerOptions {
  name: string;
  version: string;
}

export interface McpCapabilities {
  tools?: {};
  resources?: {};
  prompts?: {};
}

export interface InitializeParams {
  protocolVersion: string;
  capabilities: McpCapabilities;
  clientInfo: {
    name: string;
    version: string;
  };
}

export interface InitializeResult {
  protocolVersion: string;
  capabilities: McpCapabilities;
  serverInfo: {
    name: string;
    version: string;
  };
}

export class McpServer {
  private initialized = false;
  private tools: Tool[] = [];
  private toolRegistry: Map<string, Tool> = new Map();

  constructor(
    private options: McpServerOptions,
    tools: Tool[]
  ) {
    this.tools = tools;
    tools.forEach(tool => {
      this.toolRegistry.set(tool.name, tool);
    });
  }

  async handleRequest(requestText: string): Promise<JsonRpcResponse> {
    let request: JsonRpcRequest;

    try {
      const message = parseJsonRpcMessage(requestText);
      if (!isValidJsonRpcRequest(message)) {
        throw new JsonRpcError(
          JsonRpcErrorCode.InvalidRequest,
          'Invalid JSON-RPC request'
        );
      }
      request = message as JsonRpcRequest;
    } catch (error) {
      if (error instanceof JsonRpcError) {
        return createErrorResponse(null, error);
      }
      return createErrorResponse(
        null,
        new JsonRpcError(
          JsonRpcErrorCode.ParseError,
          'Failed to parse request'
        )
      );
    }

    try {
      switch (request.method) {
        case 'initialize':
          return await this.handleInitialize(request);
        
        case 'initialized':
          return await this.handleInitialized(request);
        
        case 'tools/list':
          return await this.handleToolsList(request);
        
        case 'tools/call':
          return await this.handleToolsCall(request);
        
        default:
          throw new JsonRpcError(
            JsonRpcErrorCode.MethodNotFound,
            `Method not found: ${request.method}`
          );
      }
    } catch (error) {
      if (error instanceof JsonRpcError) {
        return createErrorResponse(request.id ?? null, error);
      }
      return createErrorResponse(
        request.id ?? null,
        new JsonRpcError(
          JsonRpcErrorCode.InternalError,
          error instanceof Error ? error.message : 'Internal server error'
        )
      );
    }
  }

  private async handleInitialize(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const params = request.params as InitializeParams;
    
    const result: InitializeResult = {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: this.options.name,
        version: this.options.version,
      },
    };

    this.initialized = true;
    return createSuccessResponse(request.id ?? null, result);
  }

  private async handleInitialized(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    // This is a notification, no response needed
    return createSuccessResponse(request.id ?? null, {});
  }

  private async handleToolsList(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    if (!this.initialized) {
      throw new JsonRpcError(
        JsonRpcErrorCode.InvalidRequest,
        'Server not initialized'
      );
    }

    const tools = this.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));

    return createSuccessResponse(request.id ?? null, { tools });
  }

  private async handleToolsCall(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    if (!this.initialized) {
      throw new JsonRpcError(
        JsonRpcErrorCode.InvalidRequest,
        'Server not initialized'
      );
    }

    const params = request.params;
    if (!params || typeof params.name !== 'string') {
      throw new JsonRpcError(
        JsonRpcErrorCode.InvalidParams,
        'Missing tool name'
      );
    }

    const tool = this.toolRegistry.get(params.name);
    if (!tool) {
      throw new JsonRpcError(
        JsonRpcErrorCode.InvalidParams,
        `Tool not found: ${params.name}`
      );
    }

    try {
      const result = await tool.handler(params.arguments || {});
      return createSuccessResponse(request.id ?? null, {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      });
    } catch (error) {
      throw new JsonRpcError(
        JsonRpcErrorCode.InternalError,
        `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}