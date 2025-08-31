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
│            ├── hello-world/      # Basic tools MCP server
│            │    ├── hello-world.ts
│            │    └── tools/
│            │         ├── helloWorld.ts
│            │         ├── calculator.ts
│            │         └── index.ts
│            └── api-tools/        # API integration MCP server
│                 ├── api-tools.ts
│                 └── tools/
│                      ├── jsonPlaceholder.ts
│                      ├── weatherApi.ts
│                      └── index.ts
└── package.json                  # monorepo root
```

## 🚀 Quick Start

### 1. Install the package

```bash
npm install netlify-function-mcp
```

### 2. Create an MCP server

Create `netlify/functions/my-server/my-server.ts`:

**Simple Usage** (default MCP behavior):
```typescript
import type { Handler } from "@netlify/functions";
import * as toolModules from "./tools";
import { withMcpHandler } from "netlify-function-mcp";

export const handler: Handler = withMcpHandler({
  name: "my-mcp-server",
  version: "1.0.0",
  toolModules
});
```

**Advanced Usage** (with access to event and context):
```typescript
import type { Handler } from "@netlify/functions";
import * as toolModules from "./tools";
import { withMcpHandler, defaultMcpHandler } from "netlify-function-mcp";

export const handler: Handler = withMcpHandler(
  {
    name: "my-mcp-server",
    version: "1.0.0",
    toolModules
  },
  // Custom handler with full access to Netlify event and context
  async ({ event, context, mcpServer }) => {
    // Custom logging
    console.log(`MCP Request: ${event.httpMethod} ${event.path}`, {
      userAgent: event.headers['user-agent'],
      awsRequestId: context.awsRequestId
    });

    // Custom authentication, rate limiting, etc.
    // const authHeader = event.headers.authorization;
    // if (!isValidAuth(authHeader)) {
    //   return { statusCode: 401, body: 'Unauthorized' };
    // }

    // Use default MCP behavior with your customizations
    return await defaultMcpHandler({ event, context, mcpServer });
  }
);
```

### 3. Create tools

Example tool (`netlify/functions/my-server/tools/helloWorld.ts`):

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

API integration tool (`netlify/functions/my-server/tools/weatherApi.ts`):

```typescript
import { ToolHandler, ToolMetadata } from "netlify-function-mcp";

export const metadata: ToolMetadata = {
  description: "Fetches current weather for a city",
  inputSchema: {
    type: "object",
    properties: {
      city: {
        type: "string",
        description: "City name (e.g., 'London', 'Tokyo')"
      }
    },
    required: ["city"]
  }
};

export const handler: ToolHandler = async (params: { city: string }) => {
  // Simple example using Open-Meteo API
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=51.5&longitude=-0.1&current_weather=true`);
  const data = await response.json() as any;
  
  return {
    success: true,
    location: params.city,
    temperature: data.current_weather.temperature,
    description: "Current weather data",
    timestamp: new Date().toISOString()
  };
};
```

Export tools from `tools/index.ts`:

```typescript
export * as helloWorld from "./helloWorld";
export * as weatherApi from "./weatherApi";
```

### 4. Configure Netlify

Add to `netlify.toml`:

```toml
[functions]
  directory = "netlify/functions"

[[redirects]]
  from = "/my-server"
  to = "/.netlify/functions/my-server"
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
   - URL: `http://localhost:8888/hello-world` or `http://localhost:8888/api-tools`

4. Click Connect

The inspector will show available tools and allow you to test them.

## 🔧 Wrapper Pattern Benefits

The `withMcpHandler()` wrapper preserves the standard Netlify Handler pattern while adding MCP functionality:

### **Standard Handler Pattern**
```typescript
export const handler: Handler = async (event, context) => {
  // Your custom logic with full access to event and context
  return { statusCode: 200, body: 'response' };
};
```

### **MCP Wrapper Pattern** 
```typescript
export const handler: Handler = withMcpHandler(config, customHandler);
```

### **Key Benefits:**
- **Full Event Access** - Access headers, query params, request body, user agent
- **Context Access** - AWS request ID, function name, remaining time
- **Custom Logic** - Authentication, logging, rate limiting, request modification
- **Standard Pattern** - Familiar Netlify Handler interface
- **Flexible** - Use default behavior or completely customize

## 🏗️ Multi-Server Architecture

This implementation supports multiple MCP servers on a single domain, perfect for organizing tools by category:

### Example Servers

**`/hello-world`** - Basic demonstration tools:
- `helloWorld` - Simple greeting tool
- `calculator` - Basic math operations

**`/api-tools`** - External API integrations:
- `jsonPlaceholder` - Blog post fetching
- `weatherApi` - Weather data retrieval

### Benefits

- **Organized by purpose** - Group related tools together
- **Isolated dependencies** - Each server has its own tool modules
- **Scalable routing** - Easy to add new server categories
- **Domain efficiency** - Multiple servers on one domain (e.g., mcp.hopdrive.io)

### Adding New Servers

1. Create new directory: `netlify/functions/new-server/`
2. Add server file: `new-server.ts`
3. Create tools directory with `tools/index.ts`
4. Add redirect in `netlify.toml`
5. Each server uses the same simple pattern:

```typescript
import type { Handler } from "@netlify/functions";
import * as toolModules from "./tools";
import { withMcpHandler } from "netlify-function-mcp";

export const handler: Handler = withMcpHandler({
  name: "new-server",
  version: "1.0.0", 
  toolModules
});
```

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