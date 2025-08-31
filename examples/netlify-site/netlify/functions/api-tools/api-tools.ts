import type { Handler } from "@netlify/functions";
import * as toolModules from "./tools";
import { withMcpHandler, defaultMcpHandler } from "netlify-function-mcp";

// Advanced example with custom logging and event access
export const handler: Handler = withMcpHandler(
  {
    name: "api-tools-mcp-server",
    version: "1.0.0",
    toolModules
  },
  // Custom handler function with access to event, context, and mcpServer
  async ({ event, context, mcpServer }) => {
    // Custom logging with request details
    console.log(`[${new Date().toISOString()}] MCP Request:`, {
      method: event.httpMethod,
      path: event.path,
      userAgent: event.headers['user-agent'],
      origin: event.headers.origin,
      awsRequestId: context.awsRequestId,
      functionName: context.functionName,
      functionVersion: context.functionVersion
    });

    // Example: Could add authentication, rate limiting, custom routing, etc.
    // const userAgent = event.headers['user-agent'];
    // if (userAgent?.includes('bot')) {
    //   return { statusCode: 403, body: 'Bot access not allowed' };
    // }

    // Example: Pass request metadata to MCP server or tools
    // You could modify the mcpServer or pass event data to tools

    // For this example, use the default MCP handler but with our custom logging
    const response = await defaultMcpHandler({ event, context, mcpServer });

    // Log the response
    console.log(`[${new Date().toISOString()}] MCP Response:`, {
      statusCode: response.statusCode,
      awsRequestId: context.awsRequestId
    });

    return response;
  }
);