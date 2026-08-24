export type SchemaPropertyType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "array"
  | "object"
  | "enum";

export interface SchemaProperty {
  id: string;
  name: string;
  type: SchemaPropertyType;
  description: string;
  required: boolean;
  default?: string | number | boolean;
  enumOptions?: string[]; // for enum or string with choices
  // Constraints
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  // For array items
  itemType?: SchemaPropertyType;
  itemEnumOptions?: string[];
  itemProperties?: SchemaProperty[]; // for array of objects
  // For nested objects
  properties?: SchemaProperty[];
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  strict?: boolean;
  parameters: SchemaProperty[];
}

export type ExportFormat =
  | "openai"
  | "anthropic"
  | "gemini"
  | "mcp"
  | "zod"
  | "json_schema"
  | "typescript";
