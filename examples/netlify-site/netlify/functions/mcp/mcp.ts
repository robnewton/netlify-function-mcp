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
    try {
      const { tool, params } = JSON.parse(event.body || "{}");
      const toolDef = toolRegistry[tool];
      if (!toolDef) {
        return { statusCode: 404, body: JSON.stringify({ error: "Unknown tool" }) };
      }
      const result = await toolDef.handler(params);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: result })
      };
    } catch (err: any) {
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 404, body: JSON.stringify({ error: "Not Found" }) };
};

export { handler };