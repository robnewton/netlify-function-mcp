import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { buildTools, McpServer } from "./index";

export interface McpServerConfig {
  name: string;
  version: string;
  toolModules: Record<string, any>;
}

export interface McpHandlerContext {
  event: HandlerEvent;
  context: HandlerContext;
  mcpServer: McpServer;
}

export type McpHandlerFunction = (ctx: McpHandlerContext) => Promise<any>;

/**
 * Higher-order function that wraps a standard Netlify Handler to provide MCP functionality
 * while preserving full access to event and context objects
 */
export function withMcpHandler(
  config: McpServerConfig,
  handlerFn?: McpHandlerFunction
): Handler {
  
  // Build tools from the provided modules
  const tools = buildTools(config.toolModules);
  
  // Create MCP server instance
  const mcpServer = new McpServer(
    {
      name: config.name,
      version: config.version
    },
    tools
  );

  return async (event: HandlerEvent, context: HandlerContext) => {
    // Create context object for custom handler
    const mcpContext: McpHandlerContext = {
      event,
      context,
      mcpServer
    };

    // If custom handler is provided, let it handle the request
    if (handlerFn) {
      return await handlerFn(mcpContext);
    }

    // Default MCP handler implementation
    return await defaultMcpHandler(mcpContext);
  };
}

/**
 * Default MCP handler implementation - can be used as reference or fallback
 */
export async function defaultMcpHandler(ctx: McpHandlerContext) {
  const { event, mcpServer } = ctx;

  // Handle CORS preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept",
        "Access-Control-Max-Age": "86400"
      } as Record<string, string>,
      body: ""
    };
  }

  // Only handle POST requests for MCP protocol
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
        "Allow": "POST"
      },
      body: JSON.stringify({ 
        error: "Method not allowed. Use POST for MCP requests.",
        server: mcpServer
      })
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        error: "Request body is required"
      })
    };
  }

  try {
    // Process the JSON-RPC request
    const response = await mcpServer.handleRequest(event.body);
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept"
      },
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error(`Error processing MCP request:`, error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32603,
          message: "Internal server error",
          data: {
            error: error instanceof Error ? error.message : "Unknown error"
          }
        }
      })
    };
  }
}