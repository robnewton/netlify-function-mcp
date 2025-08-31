import type { Handler } from "@netlify/functions";
import * as toolModules from "./tools";
import { withMcpHandler } from "netlify-function-mcp";

export const handler: Handler = withMcpHandler({
  name: "hello-world-mcp-server",
  version: "1.0.0",
  toolModules
});