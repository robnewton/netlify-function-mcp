import { Tool } from "./types";

/**
 * Build a list of tools from imported modules.
 * Tool name is derived from the module key (filename).
 */
export function buildTools(mods: Record<string, any>): Tool[] {
  return Object.entries(mods).map(([fileName, mod]) => ({
    name: fileName,
    description: mod.metadata.description,
    inputSchema: mod.metadata.inputSchema,
    handler: mod.handler
  }));
}

/**
 * Build a registry (map of tool name -> tool) for quick lookup.
 */
export function buildRegistry(tools: Tool[]): Record<string, Tool> {
  return Object.fromEntries(tools.map(t => [t.name, t]));
}