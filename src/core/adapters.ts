import { JSONSchemaObject } from "./types";

export interface OpenAIToolDefinition {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters: Record<string, any>;
    strict?: boolean;
  };
}

export function toOpenAITool(
  name: string,
  schema: JSONSchemaObject,
  options: { description?: string; strict?: boolean } = {}
): OpenAIToolDefinition {
  const result: OpenAIToolDefinition = {
    type: "function",
    function: {
      name: name || "custom_tool",
      ...(options.description ? { description: options.description } : {}),
      parameters: {
        type: "object",
        properties: schema.properties || {},
        ...(schema.required && schema.required.length > 0 ? { required: schema.required } : {}),
        ...(options.strict ? { additionalProperties: false } : {}),
      },
    },
  };

  if (options.strict) {
    result.function.strict = true;
  }

  return result;
}

export function toAnthropicTool(
  name: string,
  schema: JSONSchemaObject,
  options: { description?: string } = {}
) {
  return {
    name: name || "custom_tool",
    ...(options.description ? { description: options.description } : {}),
    input_schema: {
      type: "object",
      properties: schema.properties || {},
      ...(schema.required && schema.required.length > 0 ? { required: schema.required } : {}),
    },
  };
}

export function toMCPTool(
  name: string,
  schema: JSONSchemaObject,
  options: { description?: string } = {}
) {
  return {
    name: name || "custom_tool",
    ...(options.description ? { description: options.description } : {}),
    inputSchema: {
      type: "object",
      properties: schema.properties || {},
      ...(schema.required && schema.required.length > 0 ? { required: schema.required } : {}),
    },
  };
}

export function toGeminiTool(
  name: string,
  schema: JSONSchemaObject,
  options: { description?: string } = {}
) {
  function convertType(type: string): string {
    switch (type) {
      case "number": return "NUMBER";
      case "integer": return "INTEGER";
      case "boolean": return "BOOLEAN";
      case "array": return "ARRAY";
      case "object": return "OBJECT";
      default: return "STRING";
    }
  }

  function convertProperties(props: Record<string, any>): Record<string, any> {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(props)) {
      out[k] = {
        type: convertType(v.type),
        ...(v.description ? { description: v.description } : {}),
        ...(v.enum ? { enum: v.enum } : {}),
        ...(v.properties ? { properties: convertProperties(v.properties) } : {}),
      };
    }
    return out;
  }

  return {
    functionDeclarations: [
      {
        name: name || "custom_tool",
        ...(options.description ? { description: options.description } : {}),
        parameters: {
          type: "OBJECT",
          properties: convertProperties(schema.properties || {}),
          ...(schema.required ? { required: schema.required } : {}),
        },
      },
    ],
  };
}

export function toZodCode(name: string, schema: JSONSchemaObject): string {
  function generateZodProp(prop: any): string {
    let chain = "";
    if (prop.enum && Array.isArray(prop.enum)) {
      chain = `z.enum([${prop.enum.map((e: any) => `"${e}"`).join(", ")}])`;
    } else if (prop.type === "number") {
      chain = "z.number()";
    } else if (prop.type === "integer") {
      chain = "z.number().int()";
    } else if (prop.type === "boolean") {
      chain = "z.boolean()";
    } else if (prop.type === "array") {
      chain = `z.array(${prop.items ? generateZodProp(prop.items) : "z.string()"})`;
    } else if (prop.type === "object") {
      const inner = Object.entries(prop.properties || {})
        .map(([k, v]) => `    ${k}: ${generateZodProp(v)}`)
        .join(",\n");
      chain = `z.object({\n${inner}\n  })`;
    } else {
      chain = "z.string()";
    }

    if (prop.description) {
      chain += `.describe("${prop.description.replace(/"/g, '\\"')}")`;
    }

    return chain;
  }

  const requiredSet = new Set(schema.required || []);
  const entries = Object.entries(schema.properties || {}).map(([key, val]) => {
    let propChain = generateZodProp(val);
    if (!requiredSet.has(key)) {
      propChain += ".optional()";
    }
    return `  ${key}: ${propChain}`;
  });

  const schemaName =
    (name || "custom_tool").replace(/[^a-zA-Z0-9_]/g, "_") + "Schema";

  return `import { z } from "zod";

export const ${schemaName} = z.object({
${entries.join(",\n")}
});

export type ${schemaName.replace("Schema", "Input")} = z.infer<typeof ${schemaName}>;
`;
}
