import { SchemaField, JSONSchemaObject } from "./types";

export interface ToJSONSchemaOptions {
  strict?: boolean;
  title?: string;
  description?: string;
  includeSchemaDraft?: boolean;
}

/**
 * Pure transformer: Converts internal UI SchemaField[] to standard JSON Schema (Draft-07 compliant)
 */
export function toJSONSchema(
  fields: SchemaField[],
  options: ToJSONSchemaOptions = {}
): JSONSchemaObject {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const field of fields) {
    if (!field.name.trim()) continue;

    if (field.required || options.strict) {
      required.push(field.name);
    }

    properties[field.name] = transformFieldToProperty(field, options);
  }

  const result: JSONSchemaObject = {
    ...(options.includeSchemaDraft ? { $schema: "http://json-schema.org/draft-07/schema#" } : {}),
    type: "object",
    ...(options.title ? { title: options.title } : {}),
    ...(options.description ? { description: options.description } : {}),
    properties,
    ...(required.length > 0 ? { required } : {}),
    ...(options.strict ? { additionalProperties: false } : {}),
  };

  return result;
}

function transformFieldToProperty(
  field: SchemaField,
  options: ToJSONSchemaOptions
): Record<string, any> {
  const schema: Record<string, any> = {
    type: field.type,
  };

  if (field.description) {
    schema.description = field.description;
  }

  if (field.default !== undefined && field.default !== "") {
    schema.default = field.default;
  }

  // Enum constraint
  if (field.enum && Array.isArray(field.enum) && field.enum.length > 0) {
    schema.enum = field.enum;
  }

  // Type-specific constraints
  if (field.type === "string") {
    if (field.minLength !== undefined) schema.minLength = field.minLength;
    if (field.maxLength !== undefined) schema.maxLength = field.maxLength;
    if (field.pattern) schema.pattern = field.pattern;
  }

  if (field.type === "number" || field.type === "integer") {
    if (field.minimum !== undefined) schema.minimum = field.minimum;
    if (field.maximum !== undefined) schema.maximum = field.maximum;
  }

  if (field.type === "object") {
    const childFields = field.properties || [];
    const childProperties: Record<string, any> = {};
    const childRequired: string[] = [];

    for (const child of childFields) {
      if (!child.name.trim()) continue;
      if (child.required || options.strict) {
        childRequired.push(child.name);
      }
      childProperties[child.name] = transformFieldToProperty(child, options);
    }

    schema.properties = childProperties;
    if (childRequired.length > 0) {
      schema.required = childRequired;
    }
    if (options.strict) {
      schema.additionalProperties = false;
    }
  }

  if (field.type === "array") {
    if (field.items) {
      schema.items = transformFieldToProperty(field.items, options);
    } else {
      schema.items = { type: "string" };
    }
  }

  return schema;
}

function generateFieldId(): string {
  return "f_" + Math.random().toString(36).substring(2, 9);
}

/**
 * Pure transformer: Parses standard JSON Schema into UI SchemaField[]
 */
export function fromJSONSchema(rawSchema: Record<string, any>): {
  title?: string;
  description?: string;
  strict?: boolean;
  fields: SchemaField[];
} {
  if (!rawSchema || typeof rawSchema !== "object") {
    return { fields: [] };
  }

  // Handle OpenAI function tool format wrapper
  if (rawSchema.type === "function" && rawSchema.function) {
    const fn = rawSchema.function;
    return fromJSONSchema({
      title: fn.name,
      description: fn.description,
      strict: fn.strict,
      ...(fn.parameters || {}),
    });
  }

  // Handle Anthropic / MCP input_schema wrapper
  if (rawSchema.input_schema || rawSchema.inputSchema) {
    const schema = rawSchema.input_schema || rawSchema.inputSchema;
    return fromJSONSchema({
      title: rawSchema.name,
      description: rawSchema.description,
      ...schema,
    });
  }

  const title = rawSchema.title || undefined;
  const description = rawSchema.description || undefined;
  const strict = rawSchema.additionalProperties === false;
  const properties = rawSchema.properties || {};
  const requiredSet = new Set<string>(Array.isArray(rawSchema.required) ? rawSchema.required : []);

  const fields: SchemaField[] = Object.entries(properties).map(([name, propDef]) => {
    return parsePropertyToField(name, propDef as Record<string, any>, requiredSet.has(name));
  });

  return { title, description, strict, fields };
}

function parsePropertyToField(
  name: string,
  raw: Record<string, any>,
  isRequired = false
): SchemaField {
  let type: SchemaField["type"] = "string";
  const rawType = raw.type ? (Array.isArray(raw.type) ? raw.type[0] : raw.type).toLowerCase() : "string";

  if (["string", "number", "integer", "boolean", "object", "array", "null"].includes(rawType)) {
    type = rawType as SchemaField["type"];
  }

  let properties: SchemaField[] | undefined = undefined;
  let items: SchemaField | undefined = undefined;

  if (type === "object" && raw.properties && typeof raw.properties === "object") {
    const nestedReq = new Set<string>(Array.isArray(raw.required) ? raw.required : []);
    properties = Object.entries(raw.properties).map(([k, v]) =>
      parsePropertyToField(k, v as Record<string, any>, nestedReq.has(k))
    );
  }

  if (type === "array") {
    if (raw.items && typeof raw.items === "object") {
      items = parsePropertyToField("item", raw.items, true);
    } else {
      items = {
        id: generateFieldId(),
        name: "item",
        type: "string",
        required: true,
      };
    }
  }

  return {
    id: generateFieldId(),
    name,
    type,
    description: raw.description || undefined,
    required: isRequired,
    default: raw.default,
    enum: Array.isArray(raw.enum) ? raw.enum : undefined,
    minimum: raw.minimum,
    maximum: raw.maximum,
    minLength: raw.minLength,
    maxLength: raw.maxLength,
    pattern: raw.pattern,
    properties,
    items,
  };
}
