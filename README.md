# netlify-function-mcp

A TypeScript package for building Model Context Protocol (MCP) servers as Netlify Functions. Provides a clean wrapper around the standard Netlify Handler pattern while handling all MCP protocol complexity.

Perfect for creating multiple organized MCP servers on a single domain (like `mcp.yoursite.com`) with full access to Netlify's event and context objects.

## 🎯 Features

- **🎭 Wrapper Pattern** - Preserves standard Netlify `Handler` interface with full event/context access
- **🚀 Zero Boilerplate** - Handles all MCP protocol complexity automatically
- **📡 MCP Compliant** - Full JSON-RPC 2.0 support compatible with MCP Inspector
- **🏗️ Multi-Server Architecture** - Multiple organized MCP servers on one domain
- **🔧 Flexible Customization** - From simple usage to full request/response control
- **🛠️ Tool Ecosystem** - Easy to create tools that integrate with external APIs
- **⚡ TypeScript First** - Complete type safety with excellent developer experience
- **📁 Organized Structure** - Clean separation of servers and tools by purpose

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
│            ├── mcp-wrapper.ts   # Main wrapper function
│            ├── jsonrpc.ts       # JSON-RPC 2.0 handling
│            └── errors.ts        # Error handling
├── examples/
│   └── netlify-site/             # demo Netlify site with 3 server examples
│       └── netlify/functions/
│            ├── hello-world/         # Basic tools (9 lines)
│            │    ├── hello-world.ts  # Simple wrapper usage
│            │    └── tools/
│            │         ├── helloWorld.ts
│            │         ├── calculator.ts
│            │         └── index.ts
│            ├── api-tools/           # API integrations (44 lines)
│            │    ├── api-tools.ts    # Custom logging example
│            │    └── tools/
│            │         ├── jsonPlaceholder.ts
│            │         ├── weatherApi.ts
│            │         └── index.ts
│            └── advanced-example/    # Full customization (99 lines)
│                 ├── advanced-example.ts  # Auth, logging, headers
│                 └── tools/
│                      ├── requestInfo.ts
│                      └── index.ts
└── package.json                  # monorepo root
```

## 🚀 Quick Start

### 1. Install

```bash
npm install netlify-function-mcp @netlify/functions
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

## 🔧 Why the Wrapper Pattern?

The `withMcpHandler()` approach preserves the familiar Netlify Handler interface while eliminating all MCP boilerplate:

### **Before** (Manual Implementation)
```typescript
export const handler: Handler = async (event, context) => {
  // 90+ lines of JSON-RPC parsing, CORS handling, error management...
  if (event.httpMethod === "OPTIONS") { /* CORS logic */ }
  if (event.httpMethod !== "POST") { /* Error handling */ }
  const request = parseJsonRpcMessage(event.body);
  // More protocol handling...
};
```

### **After** (With Wrapper)
```typescript
export const handler: Handler = withMcpHandler({
  name: "my-server", version: "1.0.0", toolModules
});
// That's it! 9 lines vs 90+
```

### **Advanced Usage** (Full Control)
```typescript
export const handler: Handler = withMcpHandler(config, 
  async ({ event, context, mcpServer }) => {
    console.log(`${event.httpMethod} ${event.path}`, {
      userAgent: event.headers['user-agent'],
      requestId: context.awsRequestId
    });
    
    // Custom auth, rate limiting, etc.
    if (!event.headers.authorization) {
      return { statusCode: 401, body: 'Unauthorized' };
    }
    
    return await defaultMcpHandler({ event, context, mcpServer });
  }
);
```

### **Key Benefits**
- **🎯 Familiar Pattern** - Standard Netlify `Handler` interface
- **⚡ Zero Learning Curve** - Works exactly like regular Netlify functions
- **🔓 Full Access** - Complete event/context access for auth, logging, etc.
- **🛠️ Flexible** - Simple usage or complete customization
- **📦 Zero Boilerplate** - All MCP protocol complexity handled automatically

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
   - URL: Try any of these servers:
     - `http://localhost:8888/hello-world` (basic tools)
     - `http://localhost:8888/api-tools` (API integrations)
     - `http://localhost:8888/advanced-example` (custom logging/auth)

4. Click Connect

The inspector will show available tools and allow you to test them.

## 🏗️ Multi-Server Architecture

Deploy multiple specialized MCP servers on a single domain:

### 🎯 **Organization by Purpose**

```
mcp.yoursite.com/
├── /hello-world      → Basic demonstration tools
├── /api-tools        → External API integrations  
├── /data-processing  → Database & analytics tools
├── /auth-services    → Authentication & user management
└── /file-operations  → File upload, processing, storage
```

### 📊 **Example Servers in this Repo**

| Server | Purpose | Lines of Code | Features |
|--------|---------|---------------|----------|
| **`/hello-world`** | Basic tools demo | 9 lines | Simple wrapper usage |
| **`/api-tools`** | API integrations | 44 lines | Custom request logging |
| **`/advanced-example`** | Full customization | 99 lines | Auth, headers, error handling |

### 🛠️ **Available Tools**

**Basic Tools** (`/hello-world`):
- `helloWorld` - Greeting demonstration
- `calculator` - Math operations

**API Integrations** (`/api-tools`):
- `jsonPlaceholder` - Blog post fetching
- `weatherApi` - Real weather data

**Advanced Examples** (`/advanced-example`):
- `requestInfo` - Request context demonstration

### 🎯 **Multi-Server Benefits**

- **🎯 Purpose Organization** - Group tools by domain (auth, data, APIs, etc.)
- **🔒 Isolation** - Each server has independent tools and dependencies  
- **📈 Scalable** - Add new servers without touching existing ones
- **🌐 Domain Efficient** - Multiple specialized servers on one domain
- **🛡️ Security** - Different auth/access patterns per server category
- **📊 Analytics** - Track usage patterns by tool category

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
git clone https://github.com/yourname/netlify-function-mcp.git
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

### Deploy to Production

```bash
# Deploy to your custom domain
netlify deploy --prod

# Your MCP servers will be available at:
# https://mcp.yoursite.com/hello-world
# https://mcp.yoursite.com/api-tools  
# https://mcp.yoursite.com/advanced-example
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