import type { Handler } from "@netlify/functions";
import * as toolModules from "./tools";
import { withMcpHandler, defaultMcpHandler } from "netlify-function-mcp";

// Advanced example showing various ways to customize MCP handler behavior
export const handler: Handler = withMcpHandler(
  {
    name: "advanced-example-mcp-server",
    version: "1.0.0",
    toolModules
  },
  async ({ event, context, mcpServer }) => {
    // 1. Custom request logging
    const requestStart = Date.now();
    console.log(`🚀 [MCP] ${event.httpMethod} ${event.path}`, {
      userAgent: event.headers['user-agent'],
      origin: event.headers.origin,
      contentLength: event.headers['content-length'],
      awsRequestId: context.awsRequestId,
      timestamp: new Date().toISOString()
    });

    // 2. Custom authentication example (commented out)
    // const authHeader = event.headers.authorization;
    // if (!authHeader || !authHeader.startsWith('Bearer ')) {
    //   return {
    //     statusCode: 401,
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ error: 'Authentication required' })
    //   };
    // }

    // 3. Custom rate limiting example (commented out)
    // const clientIP = event.headers['x-forwarded-for'] || 'unknown';
    // if (await isRateLimited(clientIP)) {
    //   return {
    //     statusCode: 429,
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ error: 'Rate limit exceeded' })
    //   };
    // }

    // 4. Custom request modification example
    // You could modify the event.body here before passing to MCP

    try {
      // Use the default MCP handler
      const response = await defaultMcpHandler({ event, context, mcpServer });

      // 5. Custom response logging and modification
      const requestDuration = Date.now() - requestStart;
      console.log(`✅ [MCP] Response sent`, {
        statusCode: response.statusCode,
        duration: `${requestDuration}ms`,
        awsRequestId: context.awsRequestId
      });

      // You could modify the response here
      // For example, add custom headers or wrap the response

      return {
        ...response,
        headers: {
          ...response.headers,
          'X-Request-ID': context.awsRequestId,
          'X-Response-Time': `${requestDuration}ms`,
          'X-MCP-Server': 'advanced-example-v1.0.0'
        }
      };

    } catch (error) {
      const requestDuration = Date.now() - requestStart;
      console.error(`❌ [MCP] Request failed`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${requestDuration}ms`,
        awsRequestId: context.awsRequestId
      });

      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': context.awsRequestId
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32603,
            message: "Internal server error",
            data: {
              requestId: context.awsRequestId,
              timestamp: new Date().toISOString()
            }
          }
        })
      };
    }
  }
);