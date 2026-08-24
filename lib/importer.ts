import { SchemaProperty, ToolDefinition } from "./schema-types";

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Parses a JSON schema property into our SchemaProperty model
 */
function parseProperty(name: string, raw: any, isRequired = false): SchemaProperty {
  const typeStr = raw.type ? (Array.isArray(raw.type) ? raw.type[0] : raw.type).toLowerCase() : "string";
  
  let type: SchemaProperty["type"] = "string";
  let enumOptions: string[] | undefined = undefined;
  let itemType: SchemaProperty["type"] | undefined = undefined;
  let itemEnumOptions: string[] | undefined = undefined;
  let itemProperties: SchemaProperty[] | undefined = undefined;
  let properties: SchemaProperty[] | undefined = undefined;

  if (raw.enum && Array.isArray(raw.enum)) {
    type = "enum";
    enumOptions = raw.enum.map(String);
  } else if (typeStr === "integer") {
    type = "integer";
  } else if (typeStr === "number") {
    type = "number";
  } else if (typeStr === "boolean") {
    type = "boolean";
  } else if (typeStr === "array") {
    type = "array";
    if (raw.items) {
      if (raw.items.enum && Array.isArray(raw.items.enum)) {
        itemType = "enum";
        itemEnumOptions = raw.items.enum.map(String);
      } else if (raw.items.type === "object" && raw.items.properties) {
        itemType = "object";
        const nestedReq = new Set<string>(Array.isArray(raw.items.required) ? raw.items.required : []);
        itemProperties = Object.entries(raw.items.properties).map(([k, v]) =>
          parseProperty(k, v, nestedReq.has(k))
        );
      } else {
        itemType = raw.items.type || "string";
      }
    } else {
      itemType = "string";
    }
  } else if (typeStr === "object") {
    type = "object";
    if (raw.properties && typeof raw.properties === "object") {
      const nestedReq = new Set<string>(Array.isArray(raw.required) ? raw.required : []);
      properties = Object.entries(raw.properties).map(([k, v]) =>
        parseProperty(k, v, nestedReq.has(k))
      );
    }
  } else {
    type = "string";
  }

  return {
    id: generateId(),
    name,
    type,
    description: raw.description || "",
    required: isRequired,
    default: raw.default,
    minimum: raw.minimum,
    maximum: raw.maximum,
    minLength: raw.minLength,
    maxLength: raw.maxLength,
    pattern: raw.pattern,
    enumOptions,
    itemType,
    itemEnumOptions,
    itemProperties,
    properties,
  };
}

/**
 * Imports any JSON payload (OpenAI tool, Anthropic tool, MCP tool, or standard JSON schema)
 */
export function importToolSchema(jsonString: string): ToolDefinition {
  const parsed = JSON.parse(jsonString);

  // Case 1: OpenAI Tool definition ({ type: "function", function: { ... } })
  if (parsed.type === "function" && parsed.function) {
    const fn = parsed.function;
    const params = fn.parameters || {};
    const requiredSet = new Set<string>(Array.isArray(params.required) ? params.required : []);
    const properties: SchemaProperty[] = [];

    if (params.properties && typeof params.properties === "object") {
      for (const [k, v] of Object.entries(params.properties)) {
        properties.push(parseProperty(k, v, requiredSet.has(k)));
      }
    }

    return {
      id: generateId(),
      name: fn.name || "imported_openai_tool",
      description: fn.description || "",
      strict: !!fn.strict,
      parameters: properties,
    };
  }

  // Case 2: Anthropic Claude tool ({ name, description, input_schema })
  if (parsed.name && parsed.input_schema) {
    const schema = parsed.input_schema;
    const requiredSet = new Set<string>(Array.isArray(schema.required) ? schema.required : []);
    const properties: SchemaProperty[] = [];

    if (schema.properties && typeof schema.properties === "object") {
      for (const [k, v] of Object.entries(schema.properties)) {
        properties.push(parseProperty(k, v, requiredSet.has(k)));
      }
    }

    return {
      id: generateId(),
      name: parsed.name,
      description: parsed.description || "",
      parameters: properties,
    };
  }

  // Case 3: MCP Tool definition ({ name, description, inputSchema })
  if (parsed.name && parsed.inputSchema) {
    const schema = parsed.inputSchema;
    const requiredSet = new Set<string>(Array.isArray(schema.required) ? schema.required : []);
    const properties: SchemaProperty[] = [];

    if (schema.properties && typeof schema.properties === "object") {
      for (const [k, v] of Object.entries(schema.properties)) {
        properties.push(parseProperty(k, v, requiredSet.has(k)));
      }
    }

    return {
      id: generateId(),
      name: parsed.name,
      description: parsed.description || "",
      parameters: properties,
    };
  }

  // Case 4: Gemini functionDeclarations array
  if (Array.isArray(parsed.functionDeclarations) && parsed.functionDeclarations[0]) {
    const fn = parsed.functionDeclarations[0];
    const params = fn.parameters || {};
    const requiredSet = new Set<string>(Array.isArray(params.required) ? params.required : []);
    const properties: SchemaProperty[] = [];

    if (params.properties && typeof params.properties === "object") {
      for (const [k, v] of Object.entries(params.properties)) {
        properties.push(parseProperty(k, v, requiredSet.has(k)));
      }
    }

    return {
      id: generateId(),
      name: fn.name || "imported_gemini_tool",
      description: fn.description || "",
      parameters: properties,
    };
  }

  // Case 5: Standard JSON Schema root
  if (parsed.properties || parsed.type === "object") {
    const requiredSet = new Set<string>(Array.isArray(parsed.required) ? parsed.required : []);
    const properties: SchemaProperty[] = [];

    if (parsed.properties && typeof parsed.properties === "object") {
      for (const [k, v] of Object.entries(parsed.properties)) {
        properties.push(parseProperty(k, v, requiredSet.has(k)));
      }
    }

    return {
      id: generateId(),
      name: parsed.title || "imported_schema",
      description: parsed.description || "",
      parameters: properties,
    };
  }

  // Case 6: Fallback inferred from raw JSON object example (e.g. { query: "hello", count: 5 })
  if (typeof parsed === "object" && !Array.isArray(parsed)) {
    const properties: SchemaProperty[] = Object.entries(parsed).map(([key, val]) => {
      let type: SchemaProperty["type"] = "string";
      if (typeof val === "number") type = Number.isInteger(val) ? "integer" : "number";
      else if (typeof val === "boolean") type = "boolean";
      else if (Array.isArray(val)) type = "array";
      else if (typeof val === "object" && val !== null) type = "object";

      return {
        id: generateId(),
        name: key,
        type,
        description: `Field for ${key}`,
        required: true,
        default: typeof val === "string" || typeof val === "number" || typeof val === "boolean" ? val : undefined,
      };
    });

    return {
      id: generateId(),
      name: "inferred_tool",
      description: "Auto-generated schema from sample JSON object",
      parameters: properties,
    };
  }

  throw new Error("Unrecognized schema or JSON format.");
}
