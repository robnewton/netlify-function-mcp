# Netlify MCP Multi-Server Example

This example demonstrates how to run multiple MCP (Model Context Protocol) servers on a single Netlify site, each with its own specialized set of tools.

## Features

- **Multi-server architecture** - Multiple MCP servers on one domain
- **MCP Protocol compliant** - Implements JSON-RPC 2.0 message handling
- **Streamable HTTP transport** - Compatible with MCP Inspector and other MCP clients
- **External API integration** - Includes tools that call public REST APIs
- **Organized by purpose** - Each server focuses on specific tool categories
- **Reusable handler** - Eliminates code duplication across servers

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the TypeScript files:
```bash
npm run build
```

3. Start the local development server:
```bash
netlify dev
```

The MCP servers will be available at:
- `http://localhost:8888/hello-world` - Basic tools (simple wrapper usage)
- `http://localhost:8888/api-tools` - API integration tools (with custom logging)
- `http://localhost:8888/advanced-example` - Advanced patterns (auth, logging, custom headers)

## Testing with MCP Inspector

1. Open MCP Inspector (v0.16.5 or later)
2. Select **"Streamable HTTP"** as the transport type
3. Enter one of the URLs:
   - `http://localhost:8888/hello-world` 
   - `http://localhost:8888/api-tools`
   - `http://localhost:8888/advanced-example`
4. Click Connect

The inspector should successfully connect and show the available tools for that server.

## MCP Protocol Implementation

This server implements the following MCP methods:

- `initialize` - Protocol handshake and capability exchange
- `initialized` - Confirmation notification
- `tools/list` - Returns available tools with schemas
- `tools/call` - Executes a tool with parameters

## Available Servers & Tools

### `/hello-world` Server - Basic Tools (Simple Wrapper)
- **`helloWorld`** - Simple greeting tool
  - Input: `{ name: string }`
  - Output: Friendly greeting message
- **`calculator`** - Basic math operations
  - Input: `{ operation: "add"|"subtract"|"multiply"|"divide", a: number, b: number }`
  - Output: Mathematical calculation result

### `/api-tools` Server - API Integrations (Custom Logging)
- **`jsonPlaceholder`** - Blog post fetching
  - Input: `{ postId: number }` (1-100)
  - Output: Blog post with title, body, and metadata
- **`weatherApi`** - Weather data retrieval
  - Input: `{ city: string }` (London, Tokyo, etc.)
  - Output: Current weather information

### `/advanced-example` Server - Advanced Patterns
- **`requestInfo`** - Request information tool
  - Input: `{ includeHeaders?: boolean }`
  - Output: Example of accessing request context
  - Demonstrates: Custom logging, authentication hooks, response modification

## Adding New Tools

To add a new tool to an existing server, create a file in the server's `tools/` directory:

```typescript
import { ToolHandler, ToolMetadata } from "netlify-function-mcp";

export const metadata: ToolMetadata = {
  description: "Your tool description",
  inputSchema: {
    type: "object",
    properties: {
      param1: { type: "string" }
    },
    required: ["param1"]
  }
};

export const handler: ToolHandler = async (params: { param1: string }) => {
  // Your tool logic here - can include API calls, data processing, etc.
  const response = await fetch("https://api.example.com/data");
  const data = await response.json();
  
  return { 
    result: "Your result",
    data: data,
    timestamp: new Date().toISOString()
  };
};
```

Then export it from the server's `tools/index.ts`:

```typescript
// For hello-world server
export * as helloWorld from "./helloWorld";
export * as calculator from "./calculator";
export * as yourNewTool from "./yourNewTool";

// For api-tools server  
export * as jsonPlaceholder from "./jsonPlaceholder";
export * as weatherApi from "./weatherApi";
export * as yourApiTool from "./yourApiTool";
```

## Adding New Servers

To create a new MCP server category:

1. Create directory: `netlify/functions/new-category/`
2. Add main file: `new-category.ts`
3. Create tools directory: `tools/` with `index.ts`
4. Add redirect to `netlify.toml`

**Simple Example:**
```typescript
import type { Handler } from "@netlify/functions";
import * as toolModules from "./tools";
import { withMcpHandler } from "netlify-function-mcp";

export const handler: Handler = withMcpHandler({
  name: "new-category-mcp-server",
  version: "1.0.0",
  toolModules
});
```

**Advanced Example with Custom Logic:**
```typescript
import type { Handler } from "@netlify/functions";
import * as toolModules from "./tools";
import { withMcpHandler, defaultMcpHandler } from "netlify-function-mcp";

export const handler: Handler = withMcpHandler(
  { name: "new-category-mcp-server", version: "1.0.0", toolModules },
  async ({ event, context, mcpServer }) => {
    // Custom authentication
    const authHeader = event.headers.authorization;
    if (!authHeader) {
      return { statusCode: 401, body: 'Authentication required' };
    }

    // Custom logging
    console.log(`MCP ${event.httpMethod} ${event.path}`, {
      userAgent: event.headers['user-agent'],
      requestId: context.awsRequestId
    });

    // Use default MCP behavior
    const response = await defaultMcpHandler({ event, context, mcpServer });
    
    // Add custom headers
    return {
      ...response,
      headers: {
        ...response.headers,
        'X-Request-ID': context.awsRequestId
      }
    };
  }
);
```

## Deployment

Deploy to Netlify:

```bash
netlify deploy --prod
```

Your MCP servers will be available at:
- `https://your-site.netlify.app/hello-world`
- `https://your-site.netlify.app/api-tools`

## Multi-Server Architecture

This implementation demonstrates:

- **Reusable handler pattern** - `createMcpHandler()` eliminates code duplication
- **Organized by purpose** - Different servers for different tool categories
- **Synchronous responses** - Required for MCP's JSON-RPC protocol
- **10-second execution limit** - Sufficient for most API calls and data processing
- **Scalable routing** - Easy to add new server categories

## Notes

- CORS headers are included for browser-based MCP clients
- Each server has its own isolated tools directory for better organization
- Tools can make external API calls and return structured data
- The `createMcpHandler()` function handles all the boilerplate MCP protocol code
- Perfect for organizing tools by domain: auth, data, utilities, integrations, etc.