# Netlify MCP Server Example

This example demonstrates how to run an MCP (Model Context Protocol) server as a Netlify function with full JSON-RPC 2.0 support.

## Features

- **MCP Protocol compliant** - Implements JSON-RPC 2.0 message handling
- **Streamable HTTP transport** - Compatible with MCP Inspector and other MCP clients
- **External API integration** - Includes tools that call public REST APIs
- **Organized structure** - MCP function and tools in dedicated folder
- **Tool extensibility** - Easy to add new tools in the `tools/` directory

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

The MCP server will be available at `http://localhost:8888/mcp`

## Testing with MCP Inspector

1. Open MCP Inspector (v0.16.5 or later)
2. Select **"Streamable HTTP"** as the transport type
3. Enter the URL: `http://localhost:8888/mcp`
4. Click Connect

The inspector should successfully connect and show the available tools.

## MCP Protocol Implementation

This server implements the following MCP methods:

- `initialize` - Protocol handshake and capability exchange
- `initialized` - Confirmation notification
- `tools/list` - Returns available tools with schemas
- `tools/call` - Executes a tool with parameters

## Available Tools

### `helloWorld`
Simple greeting tool that demonstrates basic MCP functionality.
- Input: `{ name: string }`
- Output: Friendly greeting message

### `jsonPlaceholder`
API integration tool that fetches blog posts from JSONPlaceholder API.
- Input: `{ postId: number }` (1-100)
- Output: Blog post with title, body, and metadata

## Adding New Tools

To add a new tool, create a file in `netlify/functions/mcp/tools/`:

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

Then export it from `tools/index.ts`:

```typescript
export * as helloWorld from "./helloWorld";
export * as jsonPlaceholder from "./jsonPlaceholder";
export * as yourToolName from "./yourToolName";
```

## Deployment

Deploy to Netlify:

```bash
netlify deploy --prod
```

Your MCP server will be available at `https://your-site.netlify.app/mcp`

## Function Architecture

The implementation uses a regular Netlify function (`mcp.ts`) that provides:

- **Synchronous responses** - Required for MCP's JSON-RPC protocol
- **10-second execution limit** - Sufficient for most API calls and data processing
- **Real-time communication** - Perfect for interactive MCP clients
- **No special plan required** - Works on all Netlify plans

## Notes

- CORS headers are included for browser-based MCP clients
- Function and tools are organized in a dedicated `/mcp/` folder for better structure
- Tools can make external API calls and return structured data