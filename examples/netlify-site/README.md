# Netlify MCP Server Example

This example demonstrates how to run an MCP (Model Context Protocol) server as a Netlify background function.

## Features

- **15-minute execution time** - Uses Netlify background functions for long-running operations
- **MCP Protocol compliant** - Implements JSON-RPC 2.0 message handling
- **Streamable HTTP transport** - Compatible with MCP Inspector and other MCP clients
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
  // Your tool logic here
  return { result: "Your result" };
};
```

Then export it from `tools/index.ts`:

```typescript
export * as yourToolName from "./yourToolName";
```

## Deployment

Deploy to Netlify:

```bash
netlify deploy --prod
```

Your MCP server will be available at `https://your-site.netlify.app/mcp`

## Background Functions

The function is named `mcp-background.ts` with the `-background` suffix, which tells Netlify to run it as a background function with up to 15 minutes of execution time. This is useful for:

- Long-running computations
- Data processing tasks
- External API calls that may take time
- Any MCP tool that needs more than the standard 10-second limit

## Notes

- Background functions are available on Netlify Pro plans and above
- The function always returns immediately with a 202 status for actual MCP requests
- CORS headers are included for browser-based MCP clients