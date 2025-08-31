# netlify-function-mcp

A TypeScript package for implementing Model Context Protocol (MCP) servers as Netlify Functions with full JSON-RPC 2.0 support.

## 🎯 Features

- **MCP Protocol Compliant** - Implements JSON-RPC 2.0 message handling for full MCP protocol support
- **Streamable HTTP Transport** - Compatible with MCP Inspector and other MCP clients
- **Plugin Architecture** - Easy to add new tools as self-contained TypeScript modules
- **External API Integration** - Tools can call public REST APIs and return structured data
- **TypeScript First** - Full type safety with TypeScript definitions
- **Organized Structure** - MCP function and tools isolated in dedicated folder
- **Monorepo Structure** - Includes both the reusable package and example implementation

## 📂 Structure

```
netlify-function-mcp/
├── packages/
│   └── netlify-function-mcp/     # reusable NPM package
│       └── src/
│            ├── index.ts
│            ├── types.ts
│            ├── buildTools.ts
│            ├── mcp-server.ts    # MCP protocol implementation
│            ├── jsonrpc.ts       # JSON-RPC 2.0 handling
│            └── errors.ts        # Error handling
├── examples/
│   └── netlify-site/             # demo Netlify site
│       └── netlify/functions/
│            └── mcp/              # MCP function folder
│                 ├── mcp.ts       # Main MCP function
│                 └── tools/       # Tool definitions
│                      ├── helloWorld.ts
│                      ├── jsonPlaceholder.ts
│                      └── index.ts
└── package.json                  # monorepo root
```

## 🚀 Quick Start

### 1. Install the package

```bash
npm install netlify-function-mcp
```

### 2. Create an MCP function

Create `netlify/functions/mcp/mcp.ts`:

```typescript
import type { Handler } from "@netlify/functions";
import * as toolModules from "./tools";
import { buildTools, McpServer } from "netlify-function-mcp";

// Build tools from the tools directory
const tools = buildTools(toolModules);

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
```

### 3. Create tools

Example tool (`netlify/functions/mcp/tools/helloWorld.ts`):

```typescript
import { ToolHandler, ToolMetadata } from "netlify-function-mcp";

export const metadata: ToolMetadata = {
  description: "Returns a friendly greeting",
  inputSchema: {
    type: "object",
    properties: { name: { type: "string" } },
    required: ["name"]
  }
};

export const handler: ToolHandler = async (params: { name: string }) => {
  return { message: `Hello, ${params.name}!` };
};
```

API integration tool (`netlify/functions/mcp/tools/jsonPlaceholder.ts`):

```typescript
import { ToolHandler, ToolMetadata } from "netlify-function-mcp";

export const metadata: ToolMetadata = {
  description: "Fetches a blog post from JSONPlaceholder API by ID",
  inputSchema: {
    type: "object",
    properties: {
      postId: {
        type: "number",
        description: "The ID of the post to fetch (1-100)",
        minimum: 1,
        maximum: 100
      }
    },
    required: ["postId"]
  }
};

export const handler: ToolHandler = async (params: { postId: number }) => {
  const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${params.postId}`);
  const post = await response.json();
  
  return {
    success: true,
    post: {
      id: post.id,
      title: post.title,
      body: post.body,
      preview: post.body.substring(0, 100) + "..."
    }
  };
};
```

Export tools from `tools/index.ts`:

```typescript
export * as helloWorld from "./helloWorld";
export * as jsonPlaceholder from "./jsonPlaceholder";
```

### 4. Configure Netlify

Add to `netlify.toml`:

```toml
[functions]
  directory = "netlify/functions"

[[redirects]]
  from = "/mcp"
  to = "/.netlify/functions/mcp"
  status = 200
```

## 🧪 Testing with MCP Inspector

1. Start local development:
   ```bash
   netlify dev
   ```

2. Open MCP Inspector (v0.16.5+)

3. Configure connection:
   - Transport: **Streamable HTTP**
   - URL: `http://localhost:8888/mcp`

4. Click Connect

The inspector will show available tools and allow you to test them.

## 📡 MCP Protocol Implementation

This package implements the Model Context Protocol with:

### Supported Methods
- `initialize` - Protocol handshake and capability exchange
- `initialized` - Confirmation notification  
- `tools/list` - Returns available tools with schemas
- `tools/call` - Executes a tool with parameters

### Transport
- **Streamable HTTP** - Single endpoint handling JSON-RPC messages
- **CORS Support** - Works with browser-based MCP clients
- **Synchronous Responses** - Real-time JSON-RPC responses for immediate results

### Message Format
All communication uses JSON-RPC 2.0:

```json
// Request
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}

// Response
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [...]
  }
}
```

## 🛠 Development

### Clone and Setup

```bash
git clone https://github.com/yourusername/netlify-function-mcp.git
cd netlify-function-mcp
npm install
```

### Build Package

```bash
cd packages/netlify-function-mcp
npm run build
```

### Run Example

```bash
cd examples/netlify-site
npm install
netlify dev
```

## 📝 Function Structure

The implementation uses regular Netlify functions (not background functions) because:
- **MCP requires synchronous responses** - JSON-RPC protocol needs immediate results
- **10-second timeout** is sufficient for most API calls and data processing
- **No special plan required** - Works on all Netlify plans
- **Real-time communication** - Perfect for interactive MCP clients

For operations that need more than 10 seconds, consider:
- Optimizing tool logic for faster execution
- Breaking large operations into smaller chunks
- Using streaming responses (future roadmap item)

## 📌 Roadmap

- [ ] SSE (Server-Sent Events) support for streaming responses
- [ ] CLI tool for scaffolding new tools
- [ ] Built-in request validation against inputSchema
- [ ] Authentication and rate limiting hooks
- [ ] Background function support for long-running operations (hybrid approach)
- [ ] Tool discovery and auto-registration features

## 📄 License

MIT