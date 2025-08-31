import { ToolHandler, ToolMetadata } from "netlify-function-mcp";

export const metadata: ToolMetadata = {
  description: "Performs basic mathematical calculations (add, subtract, multiply, divide)",
  inputSchema: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["add", "subtract", "multiply", "divide"],
        description: "The mathematical operation to perform"
      },
      a: {
        type: "number",
        description: "First number"
      },
      b: {
        type: "number",
        description: "Second number"
      }
    },
    required: ["operation", "a", "b"]
  }
};

export const handler: ToolHandler = async (params: { operation: string; a: number; b: number }) => {
  try {
    const { operation, a, b } = params;

    // Validate inputs
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error("Both 'a' and 'b' must be numbers");
    }

    let result: number;
    let symbol: string;

    switch (operation) {
      case "add":
        result = a + b;
        symbol = "+";
        break;
      case "subtract":
        result = a - b;
        symbol = "-";
        break;
      case "multiply":
        result = a * b;
        symbol = "*";
        break;
      case "divide":
        if (b === 0) {
          throw new Error("Cannot divide by zero");
        }
        result = a / b;
        symbol = "/";
        break;
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }

    return {
      success: true,
      calculation: {
        expression: `${a} ${symbol} ${b}`,
        result: result,
        operation: operation
      },
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      params,
      timestamp: new Date().toISOString()
    };
  }
};