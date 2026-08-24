import { SchemaProperty, ToolDefinition } from "./schema-types";

/**
 * Builds a standard JSON Schema properties object recursively
 */
export function buildJsonSchemaProperties(
  properties: SchemaProperty[],
  options: { strict?: boolean; includeDefaults?: boolean } = {}
): {
  propertiesObj: Record<string, any>;
  requiredList: string[];
} {
  const propertiesObj: Record<string, any> = {};
  const requiredList: string[] = [];

  for (const prop of properties) {
    if (!prop.name.trim()) continue;

    if (prop.required || options.strict) {
      requiredList.push(prop.name);
    }

    propertiesObj[prop.name] = buildPropertySchema(prop, options);
  }

  return { propertiesObj, requiredList };
}

function buildPropertySchema(
  prop: SchemaProperty,
  options: { strict?: boolean; includeDefaults?: boolean } = {}
): Record<string, any> {
  const schema: Record<string, any> = {};

  if (prop.description) {
    schema.description = prop.description;
  }

  if (options.includeDefaults && prop.default !== undefined && prop.default !== "") {
    schema.default = prop.default;
  }

  switch (prop.type) {
    case "string":
      schema.type = "string";
      if (prop.minLength !== undefined) schema.minLength = prop.minLength;
      if (prop.maxLength !== undefined) schema.maxLength = prop.maxLength;
      if (prop.pattern) schema.pattern = prop.pattern;
      break;

    case "number":
      schema.type = "number";
      if (prop.minimum !== undefined) schema.minimum = prop.minimum;
      if (prop.maximum !== undefined) schema.maximum = prop.maximum;
      break;

    case "integer":
      schema.type = "integer";
      if (prop.minimum !== undefined) schema.minimum = prop.minimum;
      if (prop.maximum !== undefined) schema.maximum = prop.maximum;
      break;

    case "boolean":
      schema.type = "boolean";
      break;

    case "enum":
      schema.type = "string";
      schema.enum = prop.enumOptions && prop.enumOptions.length > 0 ? prop.enumOptions : ["default_option"];
      break;

    case "array":
      schema.type = "array";
      const itemType = prop.itemType || "string";

      if (itemType === "object") {
        const nested = buildJsonSchemaProperties(prop.itemProperties || [], options);
        schema.items = {
          type: "object",
          properties: nested.propertiesObj,
          required: nested.requiredList,
          ...(options.strict ? { additionalProperties: false } : {}),
        };
      } else if (itemType === "enum") {
        schema.items = {
          type: "string",
          enum: prop.itemEnumOptions && prop.itemEnumOptions.length > 0 ? prop.itemEnumOptions : ["option_1"],
        };
      } else {
        schema.items = {
          type: itemType,
        };
      }
      break;

    case "object":
      schema.type = "object";
      const nested = buildJsonSchemaProperties(prop.properties || [], options);
      schema.properties = nested.propertiesObj;
      schema.required = nested.requiredList;
      if (options.strict) {
        schema.additionalProperties = false;
      }
      break;

    default:
      schema.type = "string";
  }

  return schema;
}

/**
 * Generate OpenAI Tool / Function calling schema
 */
export function generateOpenAISchema(tool: ToolDefinition): string {
  const { propertiesObj, requiredList } = buildJsonSchemaProperties(tool.parameters, {
    strict: tool.strict,
    includeDefaults: true,
  });

  const schemaObj: any = {
    type: "function",
    function: {
      name: tool.name || "custom_tool",
      description: tool.description || "",
      parameters: {
        type: "object",
        properties: propertiesObj,
        required: requiredList,
        additionalProperties: !tool.strict,
      },
    },
  };

  if (tool.strict) {
    schemaObj.function.strict = true;
  }

  return JSON.stringify(schemaObj, null, 2);
}

/**
 * Generate Anthropic Claude Tool definition
 */
export function generateAnthropicSchema(tool: ToolDefinition): string {
  const { propertiesObj, requiredList } = buildJsonSchemaProperties(tool.parameters, {
    includeDefaults: false,
  });

  const schemaObj = {
    name: tool.name || "custom_tool",
    description: tool.description || "",
    input_schema: {
      type: "object",
      properties: propertiesObj,
      required: requiredList,
    },
  };

  return JSON.stringify(schemaObj, null, 2);
}

/**
 * Generate Google Gemini Function Declaration schema
 */
export function generateGeminiSchema(tool: ToolDefinition): string {
  function toGeminiType(type: string): string {
    switch (type) {
      case "string":
      case "enum":
        return "STRING";
      case "number":
        return "NUMBER";
      case "integer":
        return "INTEGER";
      case "boolean":
        return "BOOLEAN";
      case "array":
        return "ARRAY";
      case "object":
        return "OBJECT";
      default:
        return "STRING";
    }
  }

  function convertGeminiProperty(prop: SchemaProperty): Record<string, any> {
    const result: Record<string, any> = {
      type: toGeminiType(prop.type),
      description: prop.description || undefined,
    };

    if (prop.type === "enum" && prop.enumOptions) {
      result.enum = prop.enumOptions;
    }

    if (prop.type === "array") {
      const itemType = prop.itemType || "string";
      if (itemType === "object") {
        const nestedProps: Record<string, any> = {};
        const nestedReq: string[] = [];
        (prop.itemProperties || []).forEach((p) => {
          if (p.name) {
            nestedProps[p.name] = convertGeminiProperty(p);
            if (p.required) nestedReq.push(p.name);
          }
        });
        result.items = {
          type: "OBJECT",
          properties: nestedProps,
          ...(nestedReq.length > 0 ? { required: nestedReq } : {}),
        };
      } else if (itemType === "enum") {
        result.items = {
          type: "STRING",
          enum: prop.itemEnumOptions || [],
        };
      } else {
        result.items = {
          type: toGeminiType(itemType),
        };
      }
    }

    if (prop.type === "object") {
      const nestedProps: Record<string, any> = {};
      const nestedReq: string[] = [];
      (prop.properties || []).forEach((p) => {
        if (p.name) {
          nestedProps[p.name] = convertGeminiProperty(p);
          if (p.required) nestedReq.push(p.name);
        }
      });
      result.properties = nestedProps;
      if (nestedReq.length > 0) {
        result.required = nestedReq;
      }
    }

    return result;
  }

  const propertiesObj: Record<string, any> = {};
  const requiredList: string[] = [];

  for (const prop of tool.parameters) {
    if (!prop.name.trim()) continue;
    propertiesObj[prop.name] = convertGeminiProperty(prop);
    if (prop.required) {
      requiredList.push(prop.name);
    }
  }

  const geminiObj = {
    functionDeclarations: [
      {
        name: tool.name || "custom_tool",
        description: tool.description || "",
        parameters: {
          type: "OBJECT",
          properties: propertiesObj,
          required: requiredList,
        },
      },
    ],
  };

  return JSON.stringify(geminiObj, null, 2);
}

/**
 * Generate Model Context Protocol (MCP) Tool schema
 */
export function generateMcpSchema(tool: ToolDefinition): string {
  const { propertiesObj, requiredList } = buildJsonSchemaProperties(tool.parameters, {
    includeDefaults: true,
  });

  const mcpObj = {
    name: tool.name || "custom_tool",
    description: tool.description || "",
    inputSchema: {
      type: "object",
      properties: propertiesObj,
      required: requiredList,
    },
  };

  return JSON.stringify(mcpObj, null, 2);
}

/**
 * Generate Standard JSON Schema (Draft 7 / 2020-12)
 */
export function generateJsonSchema(tool: ToolDefinition): string {
  const { propertiesObj, requiredList } = buildJsonSchemaProperties(tool.parameters, {
    includeDefaults: true,
  });

  const schemaObj = {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: tool.name || "CustomToolSchema",
    description: tool.description || "",
    type: "object",
    properties: propertiesObj,
    required: requiredList,
    additionalProperties: !tool.strict,
  };

  return JSON.stringify(schemaObj, null, 2);
}

/**
 * Generate TypeScript Interface code
 */
export function generateTypeScriptSchema(tool: ToolDefinition): string {
  function formatComment(description?: string, indent = "  "): string {
    if (!description) return "";
    return `${indent}/** ${description} */\n`;
  }

  function buildTsType(prop: SchemaProperty, indentLevel = 1): string {
    const indent = "  ".repeat(indentLevel);
    const innerIndent = "  ".repeat(indentLevel + 1);

    switch (prop.type) {
      case "string":
        return "string";
      case "number":
      case "integer":
        return "number";
      case "boolean":
        return "boolean";
      case "enum":
        if (prop.enumOptions && prop.enumOptions.length > 0) {
          return prop.enumOptions.map((o) => `"${o}"`).join(" | ");
        }
        return "string";
      case "array":
        const itemType = prop.itemType || "string";
        if (itemType === "object") {
          const props = (prop.itemProperties || [])
            .map((p) => {
              const opt = p.required ? "" : "?";
              const comment = formatComment(p.description, innerIndent);
              return `${comment}${innerIndent}${p.name}${opt}: ${buildTsType(p, indentLevel + 1)};`;
            })
            .join("\n");
          return `{\n${props}\n${indent}}[]`;
        } else if (itemType === "enum") {
          const enums = (prop.itemEnumOptions || []).map((o) => `"${o}"`).join(" | ");
          return `(${enums || "string"})[]`;
        }
        return `${itemType === "integer" ? "number" : itemType}[]`;
      case "object":
        const props = (prop.properties || [])
          .map((p) => {
            const opt = p.required ? "" : "?";
            const comment = formatComment(p.description, innerIndent);
            return `${comment}${innerIndent}${p.name}${opt}: ${buildTsType(p, indentLevel + 1)};`;
          })
          .join("\n");
        return `{\n${props}\n${indent}}`;
      default:
        return "any";
    }
  }

  const interfaceName =
    (tool.name || "CustomTool")
      .replace(/[^a-zA-Z0-9_]/g, "_")
      .replace(/^[a-z]/, (c) => c.toUpperCase()) + "Params";

  const fields = tool.parameters
    .filter((p) => p.name.trim())
    .map((p) => {
      const opt = p.required ? "" : "?";
      const comment = formatComment(p.description, "  ");
      return `${comment}  ${p.name}${opt}: ${buildTsType(p, 1)};`;
    })
    .join("\n");

  const headerComment = tool.description ? `/**\n * ${tool.description}\n */\n` : "";

  return `${headerComment}export interface ${interfaceName} {\n${fields}\n}`;
}

/**
 * Generate Zod Schema TypeScript code
 */
export function generateZodSchema(tool: ToolDefinition): string {
  function buildZodChain(prop: SchemaProperty, indentLevel = 1): string {
    const indent = "  ".repeat(indentLevel);
    const innerIndent = "  ".repeat(indentLevel + 1);
    let chain = "";

    switch (prop.type) {
      case "string":
        chain = "z.string()";
        if (prop.minLength !== undefined) chain += `.min(${prop.minLength})`;
        if (prop.maxLength !== undefined) chain += `.max(${prop.maxLength})`;
        if (prop.pattern) chain += `.regex(/${prop.pattern}/)`;
        break;
      case "number":
        chain = "z.number()";
        if (prop.minimum !== undefined) chain += `.min(${prop.minimum})`;
        if (prop.maximum !== undefined) chain += `.max(${prop.maximum})`;
        break;
      case "integer":
        chain = "z.number().int()";
        if (prop.minimum !== undefined) chain += `.min(${prop.minimum})`;
        if (prop.maximum !== undefined) chain += `.max(${prop.maximum})`;
        break;
      case "boolean":
        chain = "z.boolean()";
        break;
      case "enum":
        if (prop.enumOptions && prop.enumOptions.length > 0) {
          chain = `z.enum([${prop.enumOptions.map((o) => `"${o}"`).join(", ")}])`;
        } else {
          chain = `z.string()`;
        }
        break;
      case "array":
        const itemType = prop.itemType || "string";
        if (itemType === "object") {
          const itemProps = (prop.itemProperties || [])
            .map((p) => `${innerIndent}${p.name}: ${buildZodChain(p, indentLevel + 1)}`)
            .join(",\n");
          chain = `z.array(z.object({\n${itemProps}\n${indent}}))`;
        } else if (itemType === "enum") {
          const enums = (prop.itemEnumOptions || []).map((o) => `"${o}"`).join(", ");
          chain = `z.array(z.enum([${enums}]))`;
        } else if (itemType === "integer") {
          chain = `z.array(z.number().int())`;
        } else {
          chain = `z.array(z.${itemType}())`;
        }
        break;
      case "object":
        const objProps = (prop.properties || [])
          .map((p) => `${innerIndent}${p.name}: ${buildZodChain(p, indentLevel + 1)}`)
          .join(",\n");
        chain = `z.object({\n${objProps}\n${indent}})`;
        break;
      default:
        chain = "z.string()";
    }

    if (prop.description) {
      chain += `.describe("${prop.description.replace(/"/g, '\\"')}")`;
    }

    if (prop.default !== undefined && prop.default !== "") {
      const defaultVal =
        typeof prop.default === "string" ? `"${prop.default}"` : String(prop.default);
      chain += `.default(${defaultVal})`;
    }

    if (!prop.required && (prop.default === undefined || prop.default === "")) {
      chain += ".optional()";
    }

    return chain;
  }

  const schemaName =
    (tool.name || "custom_tool")
      .replace(/[^a-zA-Z0-9_]/g, "_")
      .replace(/^[A-Z]/, (c) => c.toLowerCase()) + "Schema";

  const fields = tool.parameters
    .filter((p) => p.name.trim())
    .map((p) => `  ${p.name}: ${buildZodChain(p, 1)}`)
    .join(",\n");

  const typeName =
    (tool.name || "custom_tool")
      .replace(/[^a-zA-Z0-9_]/g, "_")
      .replace(/^[a-z]/, (c) => c.toUpperCase()) + "Input";

  return `import { z } from "zod";

export const ${schemaName} = z.object({
${fields}
});

export type ${typeName} = z.infer<typeof ${schemaName}>;
`;
}
