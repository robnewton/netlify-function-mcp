import type { Handler } from "@netlify/functions";
import { buildTools, McpServer } from "./index";

export interface McpNetlifyOptions {
  name: string;
  version: string;
  toolModules: Record<string, any>;
}

/**
 * Creates a reusable Netlify Handler for MCP servers
 * This eliminates code duplication across multiple MCP server implementations
 */
export function createMcpHandler(options: McpNetlifyOptions): Handler {
  // Build tools from the provided modules
  const tools = buildTools(options.toolModules);
  
  // Create MCP server instance
  const mcpServer = new McpServer(
    {
      name: options.name,
      version: options.version
    },
    tools
  );

  // Return the configured handler
  const handler: Handler = async (event) => {
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
          server: options.name 
        })
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          error: "Request body is required",
          server: options.name
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
      console.error(`Error processing MCP request in ${options.name}:`, error);
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
              server: options.name,
              error: error instanceof Error ? error.message : "Unknown error"
            }
          }
        })
      };
    }
  };

  return handler;
}