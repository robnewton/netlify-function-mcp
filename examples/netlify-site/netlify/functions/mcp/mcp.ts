import type { Handler } from "@netlify/functions";
import * as toolModules from "./tools";
import { buildTools, McpServer } from "netlify-function-mcp";

// Build tools from the tools directory
const tools = buildTools(toolModules);

console.log("tools", tools);

// Create MCP server instance
const mcpServer = new McpServer(
  {
    name: "netlify-mcp-server",
    version: "1.0.0"
  },
  tools
);

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
      body: JSON.stringify({ error: "Method not allowed. Use POST for MCP requests." })
    };
  }

  // Check for proper content type
  const contentType = event.headers["content-type"] || "";
  const acceptHeader = event.headers["accept"] || "";

  // MCP Streamable HTTP transport expects these headers
  const supportsJson = acceptHeader.includes("application/json") || acceptHeader.includes("*/*");
  const supportsSSE = acceptHeader.includes("text/event-stream");

  if (!event.body) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Request body is required" })
    };
  }

  try {
    // Process the JSON-RPC request
    const response = await mcpServer.handleRequest(event.body);

    // For now, always return JSON response
    // SSE support can be added later for streaming responses
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
    console.error("Error processing MCP request:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32603,
          message: "Internal server error",
          data: error instanceof Error ? error.message : "Unknown error"
        }
      })
    };
  }
};

export { handler };