import { ToolHandler, ToolMetadata } from "netlify-function-mcp";

export const metadata: ToolMetadata = {
  description: "Returns information about the current HTTP request (demonstrates event access)",
  inputSchema: {
    type: "object",
    properties: {
      includeHeaders: {
        type: "boolean",
        description: "Whether to include request headers in the response",
        default: false
      }
    }
  }
};

// This tool will receive request context via the tool handler
// Note: This is just an example - in practice you'd pass event data through
// a context parameter or modify the McpServer to provide request context
export const handler: ToolHandler = async (params: { includeHeaders?: boolean }) => {
  // In a real implementation, you'd get the event context passed in somehow
  // For this demo, we'll show what the tool could return if it had access
  
  return {
    success: true,
    message: "This tool demonstrates how you could access request context",
    example: {
      timestamp: new Date().toISOString(),
      requestId: "demo-request-id",
      userAgent: "Example user agent",
      method: "POST",
      path: "/advanced-example",
      includeHeaders: params.includeHeaders || false,
      note: "In real implementation, these values would come from the Netlify event object"
    },
    instructions: [
      "The withMcpHandler wrapper gives you full access to event and context",
      "You can log requests, add authentication, modify responses",
      "Pass event data to tools through custom parameters or context",
      "Use defaultMcpHandler() for standard MCP behavior with your additions"
    ]
  };
};