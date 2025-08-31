export type ToolMetadata = {
  description: string;
  inputSchema: any;
};

export type ToolHandler = (params: any) => Promise<any>;

export type Tool = {
  name: string;
  description: string;
  inputSchema: any;
  handler: ToolHandler;
};