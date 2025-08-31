export enum JsonRpcErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
}

export class JsonRpcError extends Error {
  constructor(
    public code: JsonRpcErrorCode,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'JsonRpcError';
  }
}

export function createErrorResponse(id: string | number | null, error: JsonRpcError) {
  return {
    jsonrpc: '2.0' as const,
    id,
    error: {
      code: error.code,
      message: error.message,
      ...(error.data !== undefined && { data: error.data }),
    },
  };
}