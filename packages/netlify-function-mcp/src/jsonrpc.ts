import { JsonRpcError, JsonRpcErrorCode, createErrorResponse } from './errors';

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: any;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: any;
}

export type JsonRpcMessage = JsonRpcRequest | JsonRpcResponse | JsonRpcNotification;

export function isValidJsonRpcRequest(data: any): data is JsonRpcRequest {
  return (
    data &&
    typeof data === 'object' &&
    data.jsonrpc === '2.0' &&
    typeof data.method === 'string'
  );
}

export function parseJsonRpcMessage(text: string): JsonRpcMessage {
  let data: any;
  
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new JsonRpcError(
      JsonRpcErrorCode.ParseError,
      'Invalid JSON'
    );
  }

  if (!isValidJsonRpcRequest(data)) {
    throw new JsonRpcError(
      JsonRpcErrorCode.InvalidRequest,
      'Invalid JSON-RPC request'
    );
  }

  return data;
}

export function createSuccessResponse(id: string | number | null, result: any): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id,
    result,
  };
}

export function createNotification(method: string, params?: any): JsonRpcNotification {
  return {
    jsonrpc: '2.0',
    method,
    params,
  };
}