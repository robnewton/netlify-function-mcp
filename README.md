# netlify-function-mcp

Serverless MCP (Model Context Protocol) server utilities for **Netlify Functions**.
This repo provides:

- A reusable **NPM package** `netlify-function-mcp` with types and helpers for building MCP tools.
- An **example Netlify site** showing how to expose tools via a single MCP server function.
- A simple **plugin architecture**: each tool is a TypeScript module with its own metadata + handler.

---

## 📂 Structure

```

netlify-function-mcp/
├── packages/
│   └── netlify-function-mcp/     # reusable package
│       └── src/
│            ├── index.ts
│            ├── types.ts
│            └── buildTools.ts
├── examples/
│   └── netlify-site/             # demo Netlify site
│       └── netlify/functions/mcp/
│            ├── mcp.ts
│            └── tools/
│                 ├── helloWorld.ts
│                 └── index.ts
└── package.json                  # monorepo root

````

---

## 🚀 Usage

### 1. Install
In your Netlify project:

```bash
npm install netlify-function-mcp
````

### 2. Create an MCP function

Add `netlify/functions/mcp/mcp.ts`:

```ts
import type { Handler } from "@netlify/functions";
import * as toolModules from "./tools";
import { buildTools, buildRegistry } from "netlify-function-mcp";

const tools = buildTools(toolModules);
const toolRegistry = buildRegistry(tools);

const handler: Handler = async (event) => {
  if (event.httpMethod === "GET" && event.path.includes("/mcp/listTools")) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        version: "1.0",
        tools: tools.map(({ name, description, inputSchema }) => ({
          name,
          description,
          inputSchema
        }))
      })
    };
  }

  if (event.httpMethod === "POST" && event.path.includes("/mcp/callTool")) {
    const { tool, params } = JSON.parse(event.body || "{}");
    const toolDef = toolRegistry[tool];
    if (!toolDef) return { statusCode: 404, body: JSON.stringify({ error: "Unknown tool" }) };

    const result = await toolDef.handler(params);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: result })
    };
  }

  return { statusCode: 404, body: JSON.stringify({ error: "Not Found" }) };
};

export { handler };
```

---

### 3. Create a tool

In `netlify/functions/mcp/tools/helloWorld.ts`:

```ts
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

And in `tools/index.ts`:

```ts
export * as helloWorld from "./helloWorld";
```

---

### 4. Test locally

Run Netlify dev server:

```bash
netlify dev
```

List tools:

```bash
curl http://localhost:8888/mcp/listTools
```

Call tool:

```bash
curl -X POST http://localhost:8888/mcp/callTool \
  -H "Content-Type: application/json" \
  -d '{"tool":"helloWorld","params":{"name":"Rob"}}'
```

---

## 🛠 Features

* **Single function endpoint** (`/.netlify/functions/mcp`) handles all MCP protocol requests.
* **Plugin-like architecture**: tools live in `tools/*.ts`, self-contained with metadata + handler.
* **No duplication**: tool name comes from the file name, not hardcoded twice.
* **Reusable package**: `netlify-function-mcp` can be published to NPM for use in any Netlify site.

---

## 📌 Roadmap

* [ ] CLI scaffolder to generate new tools automatically
* [ ] Built-in request validation against `inputSchema`
* [ ] Auth / rate limiting hooks in tool metadata
* [ ] Example MCP client integration

---

## 📄 License

MIT

```