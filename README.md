# netlify-function-mcp

A TypeScript package for implementing Model Context Protocol (MCP) servers as Netlify Functions with support for 15-minute background execution.

## 🎯 Features

- **MCP Protocol Compliant** - Implements JSON-RPC 2.0 message handling for full MCP protocol support
- **Background Functions** - Supports 15-minute execution time for long-running operations
- **Streamable HTTP Transport** - Compatible with MCP Inspector and other MCP clients
- **Plugin Architecture** - Easy to add new tools as self-contained TypeScript modules
- **TypeScript First** - Full type safety with TypeScript definitions
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
│       └── netlify/functions/mcp/
│            ├── mcp-background.ts  # Background function (-background suffix)
│            └── tools/
│                 ├── helloWorld.ts
│                 └── index.ts
└── package.json                  # monorepo root
```

## 🚀 Quick Start

### 1. Install the package

```bash
npm install netlify-function-mcp
```

### 2. Create an MCP background function

Create `netlify/functions/mcp/mcp-background.ts`:

```typescript
import type { Handler } from "@netlify/functions";
import * as toolModules from "./tools";
import { buildTools, McpServer } from "netlify-function-mcp";

const tools = buildTools(toolModules);
const mcpServer = new McpServer(
  {
    name: "my-mcp-server",
    version: "1.0.0"
  },
  tools
);

const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept"
      },
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const response = await mcpServer.handleRequest(event.body || "");
  return {
    statusCode: 200,
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(response)
  };
};

export { handler };
```

### 3. Create a tool

In `netlify/functions/mcp/tools/myTool.ts`:

```typescript
import { ToolHandler, ToolMetadata } from "netlify-function-mcp";

export const metadata: ToolMetadata = {
  description: "My custom tool",
  inputSchema: {
    type: "object",
    properties: {
      input: { type: "string" }
    },
    required: ["input"]
  }
};

export const handler: ToolHandler = async (params: { input: string }) => {
  // Your tool logic here
  return { result: `Processed: ${params.input}` };
};
```

Export it from `tools/index.ts`:

```typescript
export * as myTool from "./myTool";
```

### 4. Configure Netlify

Add to `netlify.toml`:

```toml
[functions]
  directory = "netlify/functions"

[[redirects]]
  from = "/mcp"
  to = "/.netlify/functions/mcp-background"
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
- **Background Execution** - Up to 15 minutes for long-running operations

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

## 📝 Background Functions

The `-background` suffix in the function name enables:
- **15-minute execution time** (vs 10 seconds for regular functions)
- **Asynchronous processing** - Returns 202 immediately
- **Long-running operations** - Data processing, API calls, computations

Note: Background functions require Netlify Pro plan or above.

## 📌 Roadmap

- [ ] SSE (Server-Sent Events) support for streaming responses
- [ ] CLI tool for scaffolding new tools
- [ ] Built-in request validation against inputSchema
- [ ] Authentication and rate limiting hooks
- [ ] Additional transport options (WebSocket, stdio)

## 📄 License

MIT