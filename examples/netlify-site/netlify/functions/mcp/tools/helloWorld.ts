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